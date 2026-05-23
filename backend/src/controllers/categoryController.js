import { created, ok } from '../utils/response.js';
import { createCategory, listCategories, removeCategory, updateCategory } from '../services/categoryService.js';
import { logger } from '../config/logger.js';

export async function list(req, res) {
  logger.info('Listing categories', { userId: req.user.id });
  const categories = await listCategories(req.user.id);
  return ok(res, categories);
}

export async function create(req, res) {
  logger.info('Creating category', { userId: req.user.id, data: req.validatedData });
  const category = await createCategory(req.user.id, req.validatedData);
  logger.info('Category created successfully', { userId: req.user.id, categoryId: category.id });
  return created(res, category, 'Categoria criada com sucesso.');
}

export async function update(req, res) {
  logger.info('Updating category', { userId: req.user.id, categoryId: req.params.id, data: req.validatedData });
  const category = await updateCategory(req.user.id, req.params.id, req.validatedData);
  logger.info('Category updated successfully', { userId: req.user.id, categoryId: req.params.id });
  return ok(res, category, 'Categoria atualizada com sucesso.');
}

export async function remove(req, res) {
  logger.info('Deleting category', { userId: req.user.id, categoryId: req.params.id });
  await removeCategory(req.user.id, req.params.id);
  logger.info('Category deleted successfully', { userId: req.user.id, categoryId: req.params.id });
  return ok(res, null, 'Categoria removida com sucesso.');
}