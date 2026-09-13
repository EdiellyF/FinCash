import { z } from 'zod';

export const sendMessageSchema = z.object({
  message: z.string().min(1, 'Mensagem é obrigatória.')
});

export const comparePeriodsSchema = z.object({
  periods: z.array(z.enum(['7d', '30d', '365d'])).min(1, 'Pelo menos um período deve ser fornecido.')
});
