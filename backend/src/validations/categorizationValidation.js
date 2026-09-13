import { z } from 'zod';

export const batchCategorizeSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  type: z.enum(['income', 'expense']).optional()
});

export const autoCategorizeSchema = z.object({
  transactionId: z.string().uuid('ID de transação inválido.')
});
