import { z } from 'zod';

export const transactionSchema = z.object({
  categoryId: z.string().uuid('Categoria inválida.'),
  type: z.enum(['income', 'expense']),
  title: z.string().min(2, 'Título obrigatório.'),
  description: z.string().optional().nullable(),
  amount: z.coerce.number().positive('Valor deve ser maior que zero.'),
  transactionDate: z.string().min(1, 'Data obrigatória.')
});
