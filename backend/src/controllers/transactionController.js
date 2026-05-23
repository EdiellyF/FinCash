import { created, ok } from '../utils/response.js';
import { createTransaction, listTransactions, removeTransaction, updateTransaction } from '../services/transactionService.js';
import { logger } from '../config/logger.js';

export async function list(req, res) {
  logger.info('Listing transactions', { userId: req.user.id, query: req.query });
  const result = await listTransactions(req.user.id, req.query);
  
  logger.info('Transactions listed successfully', { 
    userId: req.user.id, 
    count: result.transactions.length,
    total: result.pagination.total
  });
  
  return ok(res, result.transactions, 'Transações listadas com sucesso.', result.pagination);
}

export async function create(req, res) {
  logger.info('Creating transaction', { userId: req.user.id, data: req.validatedData });
  const result = await createTransaction(req.user.id, req.validatedData);
  logger.info('Transaction created successfully', { 
    userId: req.user.id, 
    transactionId: result.transaction.id,
    budgetAlert: !!result.budgetAlert 
  });
  return created(res, result, 'Transação criada com sucesso.');
}

export async function update(req, res) {
  logger.info('Updating transaction', { userId: req.user.id, transactionId: req.params.id, data: req.validatedData });
  const result = await updateTransaction(req.user.id, req.params.id, req.validatedData);
  logger.info('Transaction updated successfully', { 
    userId: req.user.id, 
    transactionId: req.params.id,
    budgetAlert: !!result.budgetAlert 
  });
  return ok(res, result, 'Transação atualizada com sucesso.');
}

export async function remove(req, res) {
  logger.info('Deleting transaction', { userId: req.user.id, transactionId: req.params.id });
  await removeTransaction(req.user.id, req.params.id);
  logger.info('Transaction deleted successfully', { userId: req.user.id, transactionId: req.params.id });
  return ok(res, null, 'Transação removida com sucesso.');
}