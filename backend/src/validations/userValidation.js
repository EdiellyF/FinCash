import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres.').optional(),
  email: z.string().email('E-mail inválido.').optional(),
  avatarUrl: z.string().url('URL inválida.').optional().nullable()
}).refine(data => data.name || data.email || data.avatarUrl, {
  message: 'Pelo menos um campo deve ser fornecido para atualização.'
});

export const deleteAccountSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória.')
});
