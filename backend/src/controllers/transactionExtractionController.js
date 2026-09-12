import { ok, created } from '../utils/response.js';
import { 
  extractTransactionsFromText, 
  extractTransactionsFromPDF,
  saveExtractedTransactions 
} from '../services/transactionExtractionService.js';
import { ValidationError } from '../utils/errors.js';
import { logger } from '../config/logger.js';

const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024;

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

  logger.info('Transaction extraction requested', { 
    userId: req.user.id, 
    textLength: text.length 
  });
  
  const result = await extractTransactionsFromText(req.user.id, text);
  
  return ok(res, result, 'Transações extraídas com sucesso.');
}

export async function extractTransactionsPDF(req, res) {
  if (!req.file?.buffer) {
    logger.warn('PDF extraction rejected: arquivo ausente', {
      userId: req.user?.id,
      path: req.path
    });
    throw new ValidationError('Arquivo PDF e obrigatorio para extracao de transacoes.');
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
    fileSize: req.file.size
  });

  const result = await extractTransactionsFromPDF(req.user.id, req.file.buffer);

  return ok(res, result, 'Transacoes extraidas do PDF com sucesso.');
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
