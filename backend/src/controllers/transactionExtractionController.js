import { ok, created } from '../utils/response.js';
import { 
  extractTransactionsFromText, 
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