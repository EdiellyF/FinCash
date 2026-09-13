import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres.'),
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres.')
});

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres.'),
  totpCode: z.string().length(6, 'Código TOTP deve ter 6 dígitos.').optional()
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(20, 'Refresh token inválido.')
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(20, 'Refresh token inválido.').optional()
});

export const totpConfirmSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  totpCode: z.string().length(6, 'Código TOTP deve ter 6 dígitos.')
});

export const backupLoginSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  backupCode: z.string().min(6)
});

export const resetPasswordWithBackupCodeSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  backupCode: z.string().min(6),
  newPassword: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres.')
});

export const totpResetSchema = z.object({
  action: z.enum(['generate_backup', 'reset_totp']).optional(),
  email: z.string().email('E-mail inválido.').optional(),
  backupCode: z.string().optional()
});
