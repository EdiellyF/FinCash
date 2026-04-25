import { created, ok } from '../utils/response.js';
import { createTransaction, listTransactions, removeTransaction, updateTransaction } from '../services/transactionService.js';

export async function list(req, res) {
  return ok(res, await listTransactions(req.user.id, req.query));
}

export async function create(req, res) {
  return created(res, await createTransaction(req.user.id, req.validatedData), 'Transação criada com sucesso.');
}

export async function update(req, res) {
  return ok(res, await updateTransaction(req.user.id, req.params.id, req.validatedData), 'Transação atualizada com sucesso.');
}

export async function remove(req, res) {
  await removeTransaction(req.user.id, req.params.id);
  return ok(res, null, 'Transação removida com sucesso.');
}
