import { created, ok } from '../utils/response.js';
import {
  forgotPassword,
  loginUser,
  registerUser,
  resetPassword,
  confirmTotp,
  backupLogin,
  generateNewBackupCodesForUserId,
  resetTotpForUser,
  refreshUserSession,
  logoutUser
} from '../services/authService.js';
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors.js';
import { logger } from '../config/logger.js';

export async function register(req, res) {
  logger.info('User registration attempt', { email: req.validatedData.email });
  const result = await registerUser(req.validatedData);
  logger.info('User registered successfully', { userId: result.user.id });
  // result contains { user, totpUri, backupCodes }
  return created(res, result, 'Cadastro realizado com sucesso. Retorne o QR (otpauth URI) e códigos de backup ao usuário UMA VEZ.');
}

export async function login(req, res) {
  logger.info('User login attempt', { email: req.validatedData.email });
  const result = await loginUser(req.validatedData);
  logger.info('User logged in successfully', { userId: result.user.id });
  return ok(res, result, 'Login realizado com sucesso.');
}

export async function logout(req, res) {
  const refreshToken = req.validatedData?.refreshToken;
  logger.info('User logout', { userId: req.user.id, refreshTokenProvided: !!refreshToken });
  await logoutUser(req.user.id, refreshToken);
  return ok(res, null, 'Logout realizado com sucesso.');
}

export async function refresh(req, res) {
  const { refreshToken } = req.validatedData;
  logger.info('Refresh token rotation attempt', { refreshTokenProvided: !!refreshToken });
  const result = await refreshUserSession(refreshToken);
  return ok(res, result, 'Token renovado com sucesso.');
}

export async function forgotPasswordController(req, res) {
  logger.info('Password reset requested', { email: req.validatedData.email });
  const result = await forgotPassword(req.validatedData.email);
  return ok(res, result, 'Solicitação de recuperação processada.');
}

export async function resetPasswordController(req, res) {
  logger.info('Password reset attempt', { email: req.validatedData.email });
  const result = await resetPassword(req.validatedData.email, req.validatedData.newPassword);
  logger.info('Password reset successful', { email: req.validatedData.email });
  return ok(res, result, 'Senha redefinida com sucesso.');
}

export async function totpConfirmController(req, res) {
  const { email, totpCode } = req.validatedData;
  logger.info('TOTP confirmation attempt', { email });
  const result = await confirmTotp(email, totpCode);
  return ok(res, result, 'TOTP confirmado com sucesso.');
}

export async function backupLoginController(req, res) {
  const { email, backupCode } = req.validatedData;
  logger.info('Backup login attempt', { email });
  const result = await backupLogin(email, backupCode);
  logger.info('Backup login successful', { userId: result.user.id });
  return ok(res, result, 'Login via código de backup realizado com sucesso.');
}

export async function resetTotpController(req, res) {
  // This endpoint supports two modes:
  // - authenticated user (req.user) can request action: generate_backup or reset_totp
  // - unauthenticated user can provide email + backupCode to authenticate, which will consume that backup code, then reset TOTP
  const action = req.validatedData.action || 'generate_backup';

  if (req.user?.id) {
    const userId = req.user.id;
    if (action === 'generate_backup') {
      const result = await generateNewBackupCodesForUserId(userId);
      return ok(res, result, 'Novos códigos de backup gerados. Mostre-os UMA VEZ.');
    }

    if (action === 'reset_totp') {
      const result = await resetTotpForUser(userId);
      return ok(res, result, 'TOTP reiniciado. Forneça novo otpauth URI e códigos de backup UMA VEZ.');
    }
  } else {
    const { email, backupCode } = req.validatedData;
    if (!email || !backupCode) throw new ValidationError('Email e código de backup são necessários para reset sem autenticação.');

    // backupLogin will consume the provided backup code
    const loginResult = await backupLogin(email, backupCode);
    const userId = loginResult.user.id;

    // after successful backup login, perform reset_totp
    const result = await resetTotpForUser(userId);
    return ok(res, result, 'TOTP reiniciado usando código de backup. Forneça novo otpauth URI e códigos de backup UMA VEZ.');
  }

  throw new ValidationError('Ação inválida');
}