import { z } from 'zod';

export const goalSchema = z.object({
  title: z.string().min(2, 'Título obrigatório.'),
  targetAmount: z.coerce.number().positive('Valor alvo deve ser maior que zero.'),
  currentAmount: z.coerce.number().min(0).optional(),
  deadline: z.string().optional().nullable()
});
