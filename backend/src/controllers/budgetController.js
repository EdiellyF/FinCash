import { created, ok } from '../utils/response.js';
import { createBudget, listBudgets, removeBudget, updateBudget } from '../services/budgetService.js';

export async function list(req, res) {
  return ok(res, await listBudgets(req.user.id));
}

export async function create(req, res) {
  return created(res, await createBudget(req.user.id, req.validatedData), 'Orçamento salvo com sucesso.');
}

export async function update(req, res) {
  return ok(res, await updateBudget(req.user.id, req.params.id, req.validatedData), 'Orçamento atualizado com sucesso.');
}

export async function remove(req, res) {
  await removeBudget(req.user.id, req.params.id);
  return ok(res, null, 'Orçamento removido com sucesso.');
}
