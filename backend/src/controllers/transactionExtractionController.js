import { ok, created } from '../utils/response.js';
import {
  extractTransactionsFromText,
  extractTransactionsFromPDF,
  saveExtractedTransactions
} from '../services/transactionExtractionService.js';
import { ValidationError } from '../utils/errors.js';
import { logger } from '../config/logger.js';
import { prisma } from '../config/db.js';

const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024;
const MAX_EXTRACTIONS_PER_DAY = 4;

async function checkExtractionLimit(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const log = await prisma.requestLog.findUnique({
    where: {
      userId_date_provider: {
        userId,
        date: today,
        provider: 'transaction_extraction',
      },
    },
  });

  return log ? log.count : 0;
}

async function incrementExtractionCount(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const log = await prisma.requestLog.findUnique({
    where: {
      userId_date_provider: {
        userId,
        date: today,
        provider: 'transaction_extraction',
      },
    },
  });

  if (!log) {
    await prisma.requestLog.create({
      data: {
        userId,
        date: today,
        count: 1,
        provider: 'transaction_extraction',
      },
    });
    return 1;
  }

  await prisma.requestLog.update({
    where: { id: log.id },
    data: { count: log.count + 1 },
  });

  return log.count + 1;
}

function getPdfValidationFailure(file) {
  if (!file?.buffer || !Buffer.isBuffer(file.buffer) || file.buffer.length < 5) {
    return 'arquivo_vazio';
  }

  if (file.buffer.length > MAX_PDF_SIZE_BYTES) {
    return 'arquivo_muito_grande';
  }

  const header = file.buffer.subarray(0, 5).toString('ascii');
  const hasPdfHeader = header === '%PDF-';
  const hasPdfExtension = /\.pdf$/i.test(file.originalname || '');
  const contentTypeIsPdf = file.mimetype === 'application/pdf';

  if (!hasPdfHeader && !(contentTypeIsPdf && hasPdfExtension)) {
    return 'cabecalho_pdf_invalido';
  }

  return null;
}

function isPdfFile(file) {
  return !getPdfValidationFailure(file);
}

export async function extractTransactions(req, res) {
  const { text } = req.body;

  if (!text || text.trim().length === 0) {
    throw new ValidationError('Texto é obrigatório para extração de transações.');
  }

  // Verificar limite diário de extrações
  const extractionCount = await checkExtractionLimit(req.user.id);
  if (extractionCount >= MAX_EXTRACTIONS_PER_DAY) {
    logger.warn('Transaction extraction limit exceeded', {
      userId: req.user.id,
      extractionCount,
      limit: MAX_EXTRACTIONS_PER_DAY
    });
    throw new ValidationError(`Você atingiu o limite diário de ${MAX_EXTRACTIONS_PER_DAY} extrações de transações. Tente novamente amanhã.`);
  }

  logger.info('Transaction extraction requested', {
    userId: req.user.id,
    textLength: text.length,
    extractionCount: extractionCount + 1
  });

  const result = await extractTransactionsFromText(req.user.id, text);

  // Incrementar contador
  await incrementExtractionCount(req.user.id);

  return ok(res, {
    ...result,
    remainingExtractions: MAX_EXTRACTIONS_PER_DAY - (extractionCount + 1)
  }, 'Transações extraídas com sucesso.');
}

export async function extractTransactionsPDF(req, res) {
  if (!req.file?.buffer) {
    logger.warn('PDF extraction rejected: arquivo ausente', {
      userId: req.user?.id,
      path: req.path
    });
    throw new ValidationError('Arquivo PDF e obrigatorio para extracao de transacoes.');
  }

  // Verificar limite diário de extrações
  const extractionCount = await checkExtractionLimit(req.user.id);
  if (extractionCount >= MAX_EXTRACTIONS_PER_DAY) {
    logger.warn('Transaction extraction limit exceeded', {
      userId: req.user.id,
      extractionCount,
      limit: MAX_EXTRACTIONS_PER_DAY
    });
    throw new ValidationError(`Você atingiu o limite diário de ${MAX_EXTRACTIONS_PER_DAY} extrações de transações. Tente novamente amanhã.`);
  }

  const failureReason = getPdfValidationFailure(req.file);

  if (req.file.size > MAX_PDF_SIZE_BYTES || failureReason === 'arquivo_muito_grande') {
    logger.warn('PDF extraction rejected: arquivo muito grande', {
      userId: req.user?.id,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      maxAllowedBytes: MAX_PDF_SIZE_BYTES
    });
    throw new ValidationError('Arquivo PDF muito grande. Envie um arquivo menor que 20MB.');
  }

  if (failureReason === 'cabecalho_pdf_invalido' || failureReason === 'arquivo_vazio') {
    logger.warn('PDF extraction rejected: cabeçalho PDF inválido ou arquivo vazio', {
      userId: req.user?.id,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      reason: failureReason
    });
    throw new ValidationError('Envie um arquivo PDF valido. O arquivo enviado nao possui o cabecalho PDF esperado.');
  }

  if (!isPdfFile(req.file)) {
    logger.warn('PDF extraction rejected: arquivo inválido', {
      userId: req.user?.id,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      reason: failureReason
    });
    throw new ValidationError('Envie um arquivo PDF valido.');
  }

  logger.info('PDF transaction extraction requested', {
    userId: req.user.id,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    extractionCount: extractionCount + 1
  });

  const result = await extractTransactionsFromPDF(req.user.id, req.file.buffer);

  // Incrementar contador
  await incrementExtractionCount(req.user.id);

  return ok(res, {
    ...result,
    remainingExtractions: MAX_EXTRACTIONS_PER_DAY - (extractionCount + 1)
  }, 'Transacoes extraidas do PDF com sucesso.');
}

export async function extractAndSaveTransactions(req, res) {
  const { text, transactionDate } = req.body;
  
  if (!text || text.trim().length === 0) {
    throw new ValidationError('Texto é obrigatório para extração de transações.');
  }

  logger.info('Transaction extraction and save requested', { 
    userId: req.user.id, 
    textLength: text.length,
    transactionDate 
  });
  
  // Primeiro extrair as transações
  const extractionResult = await extractTransactionsFromText(req.user.id, text);
  
  // Depois salvar no banco
  const saveResult = await saveExtractedTransactions(
    req.user.id, 
    extractionResult.transactions,
    { 
      autoSave: true,
      transactionDate: transactionDate || new Date()
    }
  );
  
  return created(res, {
    extraction: extractionResult,
    save: saveResult
  }, 'Transações extraídas e salvas com sucesso.');
}

export async function saveTransactions(req, res) {
  const { transactions, transactionDate } = req.body;

  if (!Array.isArray(transactions) || transactions.length === 0) {
    throw new ValidationError('Informe ao menos uma transacao extraida para salvar.');
  }

  logger.info('Saving previously extracted transactions requested', {
    userId: req.user.id,
    count: transactions.length
  });

  const saveResult = await saveExtractedTransactions(
    req.user.id,
    transactions,
    {
      autoSave: true,
      transactionDate: transactionDate || new Date()
    }
  );

  return created(res, { save: saveResult }, 'Transacoes salvas com sucesso.');
}
