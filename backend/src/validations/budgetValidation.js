import { z } from 'zod';

export const budgetSchema = z.object({
  categoryId: z.string().uuid('Categoria inválida.'),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000),
  limitAmount: z.coerce.number().positive('Limite deve ser maior que zero.')
});
