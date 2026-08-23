import * as bcrypt from 'bcryptjs';
import { prisma } from '../config/db.js';
import { generateToken } from '../utils/generateToken.js';
import { ConflictError, AuthenticationError, NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../config/logger.js';
import * as otplib from 'otplib';
import crypto from 'crypto';
import { env } from '../config/env.js';

// Normalize bcrypt import shape to support both runtime (default export) and test mocks
const bcryptLib = (function () {
  try {
    if (bcrypt && typeof bcrypt.hash === 'function') return bcrypt;
    if (bcrypt && bcrypt.default && typeof bcrypt.default.hash === 'function') return bcrypt.default;
  } catch (e) {
    // ignore and fallback
  }
  return bcrypt;
})();

// Compatibility wrapper: otplib may not expose authenticator in all test environments/mocks
const authenticator = (otplib && otplib.authenticator) ? otplib.authenticator : {
  generateSecret: () => crypto.randomBytes(10).toString('hex'),
  keyuri: (user, service, secret) => `otpauth://totp/${service}:${user}?secret=${secret}&issuer=${service}`,
  verify: () => false
};

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl
  };
}

function generatePlainBackupCodes(count = 8) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    // 10 hex chars (5 bytes -> 10 hex chars) - alphanumeric-ish
    codes.push(crypto.randomBytes(5).toString('hex'));
  }
  return codes;
}

export async function registerUser(data) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    logger.warn('Registration attempt with existing email', { email: data.email });
    throw new ConflictError('E-mail já cadastrado.');
  }

  const passwordHash = await bcryptLib.hash(data.password, 10);

  // generate TOTP secret and backup codes
  const secret = authenticator.generateSecret();
  const totpUri = authenticator.keyuri(data.email, env.nodeEnv === 'production' ? 'FinCash' : 'FinCash (dev)', secret);

  const plainBackupCodes = generatePlainBackupCodes(8);
  const hashedBackupCodes = await Promise.all(plainBackupCodes.map(c => bcryptLib.hash(c, 10)));

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      totpSecret: secret,
      totpEnabled: false,
      backupCodes: hashedBackupCodes
    }
  });

  logger.info('New user registered (TOTP) ', { userId: user.id, email: user.email });

  // Return the otpauth URI and the plaintext backup codes ONCE
  return { user: publicUser(user), token: generateToken(user.id), totpUri, backupCodes: plainBackupCodes };
}

export async function confirmTotp(emailOrId, token) {
  // emailOrId can be email or user id
  const where = emailOrId.includes('@') ? { email: emailOrId } : { id: emailOrId };
  const user = await prisma.user.findUnique({ where });
  if (!user) throw new NotFoundError('Usuário não encontrado.');
  if (!user.totpSecret) throw new ValidationError('TOTP não configurado para este usuário.');

  const ok = authenticator.verify({ token, secret: user.totpSecret });
  if (!ok) {
    logger.warn('Invalid TOTP confirmation attempt', { userId: user.id });
    throw new ValidationError('Código TOTP inválido.');
  }

  await prisma.user.update({ where, data: { totpEnabled: true } });
  logger.info('User confirmed TOTP setup', { userId: user.id });
  return { success: true };
}

export async function loginUser(data) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    logger.warn('Login attempt with non-existent email', { email: data.email });
    throw new AuthenticationError('Credenciais inválidas.');
  }

  const passwordMatch = await bcryptLib.compare(data.password, user.passwordHash);
  if (!passwordMatch) {
    logger.warn('Login attempt with wrong password', { email: data.email, userId: user.id });
    throw new AuthenticationError('Credenciais inválidas.');
  }

  // If TOTP is enabled for the user, require and verify the code. Otherwise allow password-only login
  if (user.totpEnabled) {
    if (!data.totpCode) {
      throw new AuthenticationError('Código TOTP necessário.');
    }
    const totpValid = authenticator.verify({ token: data.totpCode, secret: user.totpSecret, window: 1 });
    if (!totpValid) {
      logger.warn('Invalid TOTP on login', { userId: user.id });
      throw new AuthenticationError('Código TOTP inválido.');
    }
  }

  logger.info('User logged in successfully (TOTP)', { userId: user.id, email: user.email });

  return { user: publicUser(user), token: generateToken(user.id) };
}

export async function backupLogin(email, backupCode) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    logger.warn('Backup login attempt with non-existent email', { email });
    throw new AuthenticationError('Credenciais inválidas.');
  }

  const stored = user.backupCodes || [];
  // stored is expected to be array of hashed codes
  let matchedIndex = -1;
  for (let i = 0; i < stored.length; i++) {
    const ok = await bcryptLib.compare(backupCode, stored[i]);
    if (ok) {
      matchedIndex = i;
      break;
    }
  }

  if (matchedIndex === -1) {
    logger.warn('Invalid backup code attempt', { userId: user.id });
    throw new AuthenticationError('Código de backup inválido.');
  }

  // remove used code
  const newCodes = stored.filter((_, idx) => idx !== matchedIndex);
  await prisma.user.update({ where: { email }, data: { backupCodes: newCodes } });

  logger.info('User logged in with backup code', { userId: user.id });
  return { user: publicUser(user), token: generateToken(user.id) };
}

export async function generateNewBackupCodesForUserId(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('Usuário não encontrado.');

  const plainBackupCodes = generatePlainBackupCodes(8);
  const hashedBackupCodes = await Promise.all(plainBackupCodes.map(c => bcryptLib.hash(c, 10)));

  await prisma.user.update({ where: { id: userId }, data: { backupCodes: hashedBackupCodes } });

  logger.info('Generated new backup codes', { userId });
  return { backupCodes: plainBackupCodes };
}

export async function resetTotpForUser(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('Usuário não encontrado.');

  const secret = authenticator.generateSecret();
  const plainBackupCodes = generatePlainBackupCodes(8);
  const hashedBackupCodes = await Promise.all(plainBackupCodes.map(c => bcryptLib.hash(c, 10)));

  await prisma.user.update({ where: { id: userId }, data: { totpSecret: secret, totpEnabled: false, backupCodes: hashedBackupCodes } });

  const totpUri = authenticator.keyuri(user.email, env.nodeEnv === 'production' ? 'FinCash' : 'FinCash (dev)', secret);

  logger.info('Reset TOTP for user', { userId });
  return { totpUri, backupCodes: plainBackupCodes };
}

export async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  logger.info('Password reset requested', { email, found: !!user });
  return {
    found: !!user,
    note: 'Implementação simplificada. Em produção, gere token seguro e envie por e-mail.'
  };
}

export async function resetPassword(email, newPassword) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new NotFoundError('Usuário não encontrado.');

  const passwordHash = await bcryptLib.hash(newPassword, 10);
  await prisma.user.update({
    where: { email },
    data: { passwordHash }
  });

  logger.info('Password reset successfully', { userId: user.id, email });

  return { success: true };
}