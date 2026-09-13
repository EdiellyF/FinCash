import { z } from 'zod';

export const extractTransactionsSchema = z.object({
  text: z.string().min(1, 'Texto é obrigatório.'),
  transactionDate: z.string().optional()
});

export const extractAndSaveTransactionsSchema = z.object({
  text: z.string().min(1, 'Texto é obrigatório.'),
  transactionDate: z.string().optional()
});

export const saveTransactionsSchema = z.object({
  transactions: z.array(z.object({
    categoryId: z.string().uuid('Categoria inválida.'),
    type: z.enum(['income', 'expense']),
    title: z.string().min(2, 'Título obrigatório.'),
    description: z.string().optional().nullable(),
    amount: z.coerce.number().positive('Valor deve ser maior que zero.'),
    transactionDate: z.string().min(1, 'Data obrigatória.')
  })).min(1, 'Pelo menos uma transação deve ser fornecida.')
});
