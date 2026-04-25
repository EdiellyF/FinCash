import { created, ok } from '../utils/response.js';
import { createCategory, listCategories, removeCategory, updateCategory } from '../services/categoryService.js';

export async function list(req, res) {
  return ok(res, await listCategories(req.user.id));
}

export async function create(req, res) {
  return created(res, await createCategory(req.user.id, req.validatedData), 'Categoria criada com sucesso.');
}

export async function update(req, res) {
  return ok(res, await updateCategory(req.user.id, req.params.id, req.validatedData), 'Categoria atualizada com sucesso.');
}

export async function remove(req, res) {
  await removeCategory(req.user.id, req.params.id);
  return ok(res, null, 'Categoria removida com sucesso.');
}
