import { ok } from '../utils/response.js';
import { 
  suggestCategory, 
  batchCategorizeTransactions, 
  autoCategorizeTransaction 
} from '../services/categorizationService.js';
import { logger } from '../config/logger.js';

export async function getSuggestion(req, res) {
  const { title, description, type } = req.body;
  
  logger.info('Category suggestion requested', { 
    userId: req.user.id, 
    title, 
    type 
  });
  
  const suggestion = await suggestCategory(req.user.id, {
    title,
    description,
    type
  });
  
  return ok(res, suggestion, 'Categoria sugerida com sucesso.');
}

export async function batchCategorize(req, res) {
  const { limit, type } = req.query;
  
  logger.info('Batch categorization requested', { 
    userId: req.user.id, 
    limit: parseInt(limit),
    type 
  });
  
  const result = await batchCategorizeTransactions(req.user.id, {
    limit: limit ? parseInt(limit) : 50,
    type
  });
  
  return ok(res, result, 'Categorização em lote concluída.');
}

export async function autoCategorize(req, res) {
  const { transactionId } = req.params;
  
  logger.info('Auto categorization requested', { 
    userId: req.user.id, 
    transactionId 
  });
  
  const result = await autoCategorizeTransaction(req.user.id, transactionId);
  
  return ok(res, result, 'Auto-categorização realizada.');
}