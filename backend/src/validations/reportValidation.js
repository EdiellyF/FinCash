import { z } from 'zod';

export const monthlyReportSchema = z.object({
  month: z.coerce.number().int().min(1).max(12, 'Mês deve ser entre 1 e 12.'),
  year: z.coerce.number().int().min(2000).max(2100, 'Ano inválido.')
});

export const categorySummarySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional()
}).refine(data => data.startDate || data.endDate, {
  message: 'Pelo menos uma data deve ser fornecida.'
});

export const exportCsvSchema = z.object({
  month: z.coerce.number().int().min(1).max(12, 'Mês deve ser entre 1 e 12.'),
  year: z.coerce.number().int().min(2000).max(2100, 'Ano inválido.'),
  advanced: z.string().optional(),
  fields: z.string().optional(),
  separator: z.string().optional()
});

export const exportPdfSchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  type: z.enum(['transactions', 'goals', 'budgets']).optional(),
  advanced: z.string().optional()
});

export const exportGoalsCsvSchema = z.object({
  fields: z.string().optional(),
  separator: z.string().optional()
});

export const exportBudgetsCsvSchema = z.object({
  month: z.coerce.number().int().min(1).max(12, 'Mês deve ser entre 1 e 12.'),
  year: z.coerce.number().int().min(2000).max(2100, 'Ano inválido.'),
  fields: z.string().optional(),
  separator: z.string().optional()
});
