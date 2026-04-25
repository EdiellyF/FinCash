import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(2, 'Nome obrigatório.'),
  type: z.enum(['income', 'expense']),
  color: z.string().optional().nullable(),
  icon: z.string().optional().nullable()
});
