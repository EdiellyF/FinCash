import { created, ok } from '../utils/response.js';
import { createGoal, listGoals, removeGoal, updateGoal } from '../services/goalService.js';

export async function list(req, res) {
  return ok(res, await listGoals(req.user.id));
}

export async function create(req, res) {
  return created(res, await createGoal(req.user.id, req.validatedData), 'Meta criada com sucesso.');
}

export async function update(req, res) {
  return ok(res, await updateGoal(req.user.id, req.params.id, req.validatedData), 'Meta atualizada com sucesso.');
}

export async function remove(req, res) {
  await removeGoal(req.user.id, req.params.id);
  return ok(res, null, 'Meta removida com sucesso.');
}
