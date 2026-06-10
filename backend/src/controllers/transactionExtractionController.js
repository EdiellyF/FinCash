import { ok, created } from '../utils/response.js';
import { 
  extractTransactionsFromText, 
  extractTransactionsFromPDF,
  saveExtractedTransactions 
} from '../services/transactionExtractionService.js';
import { ValidationError } from '../utils/errors.js';
import { logger } from '../config/logger.js';

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
    throw new ValidationError('Arquivo PDF e obrigatorio para extracao de transacoes.');
  }

  if (req.file.mimetype !== 'application/pdf') {
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
