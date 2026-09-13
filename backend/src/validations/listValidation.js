import { z } from 'zod';

export const listTransactionsSchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
  categoryId: z.string().uuid('Categoria inválida.').optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
});

export const listCategoriesSchema = z.object({
  type: z.enum(['income', 'expense']).optional()
});

export const listGoalsSchema = z.object({
  // Goals list doesn't require query parameters
});

export const listBudgetsSchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional()
});
