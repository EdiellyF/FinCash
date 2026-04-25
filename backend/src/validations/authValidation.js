import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres.'),
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres.')
});

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres.')
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('E-mail inválido.')
});

export const resetPasswordSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  newPassword: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres.')
});
