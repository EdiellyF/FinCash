import * as bcrypt from 'bcryptjs';
import { prisma } from '../config/db.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';
import { ConflictError, AuthenticationError, NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../config/logger.js';
import * as otplib from 'otplib';
import crypto from 'crypto';
import { env } from '../config/env.js';

// Consent policy version used when registering users
const CONSENT_VERSION = '1.0';

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

// Helper wrapper for otplib compatibility across versions
const hasOtplibModernApi = otplib && typeof otplib.generateSecret === 'function' && typeof otplib.generateURI === 'function' && typeof otplib.verify === 'function';

function generateSecret() {
  if (hasOtplibModernApi) return otplib.generateSecret();
  // Try older otplib authenticator API if present (returns base32)
  if (otplib.authenticator && typeof otplib.authenticator.generateSecret === 'function') {
    return otplib.authenticator.generateSecret();
  }
  // Fallback: generate random bytes and encode to Base32 (ensure compatibility with most authenticators)
  const bytes = crypto.randomBytes(10);
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += ALPHABET[(value << (5 - bits)) & 31];
  }
  // padding is optional for TOTP secrets; return uppercase base32 without padding
  return output;
}

function generateUri(secret, email) {
  const issuer = env.nodeEnv === 'production' ? 'FinCash' : 'FinCash (dev)';
  if (hasOtplibModernApi) {
    return otplib.generateURI({ secret, label: email, issuer });
  }
  return `otpauth://totp/${issuer}:${email}?secret=${secret}&issuer=${issuer}`;
}

async function normalizeSecretToBase32(secret) {
  if (!secret) return secret;
  // If secret already looks like base32 (A-Z2-7), return uppercased
  if (/^[A-Z2-7]+=*$/i.test(secret)) return String(secret).replace(/=+$/, '').toUpperCase();
  // If hex-like, convert to base32
  if (/^[0-9a-fA-F]+$/.test(secret)) {
    const bytes = Buffer.from(secret, 'hex');
    const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = '';
    for (let i = 0; i < bytes.length; i++) {
      value = (value << 8) | bytes[i];
      bits += 8;
      while (bits >= 5) {
        output += ALPHABET[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }
    if (bits > 0) {
      output += ALPHABET[(value << (5 - bits)) & 31];
    }
    return output;
  }
  // otherwise, return as-is
  return secret;
}

async function verifyTotp(token, secret) {
  const t = String(token).trim();
  const normalized = await normalizeSecretToBase32(secret);

  // List of candidate verification callables in order of preference
  const candidates = [];
  if (otplib.totp && typeof otplib.totp.check === 'function') candidates.push(() => otplib.totp.check(t, normalized));
  if (typeof otplib.verify === 'function') candidates.push(() => otplib.verify({ token: t, secret: normalized, window: 1 }));
  if (typeof otplib.verifySync === 'function') candidates.push(() => otplib.verifySync({ token: t, secret: normalized, window: 1 }));
  if (otplib.authenticator && typeof otplib.authenticator.check === 'function') candidates.push(() => otplib.authenticator.check(t, normalized));

  for (const fn of candidates) {
    try {
      const res = fn();
      const value = res instanceof Promise ? await res : res;
      // otplib may return boolean or an object; handle common shapes
      if (typeof value === 'boolean') return value;
      if (value && typeof value === 'object') {
        // Some otplib variants return { valid: true } or { isValid: true }
        if (typeof value.valid === 'boolean') return value.valid;
        if (typeof value.isValid === 'boolean') return value.isValid;
        // fallback: truthy object means success? be strict: treat truthy as false unless explicit
        // but if it contains a 'delta' number (steps off), consider valid when delta within window
        if (typeof value.delta === 'number') return true;
      }
    } catch (err) {
      // ignore and try next candidate
      logger.debug('verifyTotp candidate error', { err: err.message || err });
    }
  }

  return false;
}

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

async function issueUserTokens(userId) {
  const accessToken = generateAccessToken(userId);
  const refreshToken = await generateRefreshToken(userId);
  return { accessToken, refreshToken };
}

async function findRefreshTokenRecordByValue(rawRefreshToken) {
  if (!rawRefreshToken) return null;

  const records = await prisma.refreshToken.findMany({});

  for (const record of records) {
    const matches = await bcryptLib.compare(rawRefreshToken, record.tokenHash);
    if (matches) return record;
  }

  return null;
}

async function revokeAllRefreshTokensForUser(userId) {
  await prisma.refreshToken.updateMany({
    where: { userId },
    data: { revokedAt: new Date() }
  });
}

async function findValidRefreshTokenRecord(rawRefreshToken) {
  if (!rawRefreshToken) return null;

  const now = new Date();
  const records = await prisma.refreshToken.findMany({
    where: {
      revokedAt: null,
      expiresAt: { gt: now }
    }
  });

  for (const record of records) {
    const matches = await bcryptLib.compare(rawRefreshToken, record.tokenHash);
    if (matches) return record;
  }

  return null;
}

export async function registerUser(data) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    logger.warn('Registration attempt with existing email', { email: data.email });
    throw new ConflictError('E-mail já cadastrado.');
  }

  const consentAccepted = data?.consentAccepted === true;
  const passwordHash = await bcryptLib.hash(data.password, 10);

  // generate TOTP secret and backup codes
  const secret = generateSecret();
  const totpUri = generateUri(secret, data.email);

  const plainBackupCodes = generatePlainBackupCodes(8);
  const hashedBackupCodes = await Promise.all(plainBackupCodes.map(c => bcryptLib.hash(c, 10)));

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      totpSecret: secret,
      totpEnabled: false,
      backupCodes: hashedBackupCodes,
      ...(consentAccepted ? {
        consentGivenAt: new Date(),
        consentVersion: CONSENT_VERSION
      } : {})
    }
  });

  logger.info('New user registered (TOTP)', { userId: user.id, result: 'success' });

  const tokens = await issueUserTokens(user.id);

  // Return the otpauth URI and the plaintext backup codes ONCE
  return {
    user: publicUser(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    totpUri,
    backupCodes: plainBackupCodes
  };
}

export async function confirmTotp(emailOrId, token) {
  // emailOrId can be email or user id
  const where = emailOrId.includes('@') ? { email: emailOrId } : { id: emailOrId };
  const user = await prisma.user.findUnique({ where });
  if (!user) throw new NotFoundError('Usuário não encontrado.');
  if (!user.totpSecret) throw new ValidationError('TOTP não configurado para este usuário.');

  const ok = await verifyTotp(token, user.totpSecret);
  if (!ok) {
    logger.warn('Invalid TOTP confirmation attempt', { userId: user.id, result: 'failure' });
    throw new ValidationError('Código TOTP inválido.');
  }

  await prisma.user.update({ where, data: { totpEnabled: true } });
  logger.info('User confirmed TOTP setup', { userId: user.id, result: 'success' });
  return { success: true };
}

export async function loginUser(data) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    logger.warn('Login attempt with non-existent email', { userId: null, result: 'failure' });
    throw new AuthenticationError('Credenciais inválidas.');
  }

  const passwordMatch = await bcryptLib.compare(data.password, user.passwordHash);
  if (!passwordMatch) {
    logger.warn('Login attempt with wrong password', { userId: user.id, result: 'failure' });
    throw new AuthenticationError('Credenciais inválidas.');
  }

  // If TOTP is enabled for the user, require and verify the code. Otherwise allow password-only login
  if (user.totpEnabled) {
    if (!data.totpCode) {
      logger.warn('Login attempt missing TOTP code', { userId: user.id, result: 'failure' });
      throw new AuthenticationError('Código TOTP necessário.');
    }
    const totpValid = await verifyTotp(data.totpCode, user.totpSecret);
    if (!totpValid) {
      logger.warn('Invalid TOTP on login', { userId: user.id, result: 'failure' });
      throw new AuthenticationError('Código TOTP inválido.');
    }
  }

  logger.info('User logged in successfully', { userId: user.id, result: 'success' });

  const tokens = await issueUserTokens(user.id);
  return { user: publicUser(user), accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
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
    logger.warn('Invalid backup code attempt', { userId: user.id, result: 'failure' });
    throw new AuthenticationError('Código de backup inválido.');
  }

  // remove used code
  const newCodes = stored.filter((_, idx) => idx !== matchedIndex);
  await prisma.user.update({ where: { email }, data: { backupCodes: newCodes } });

  logger.info('User logged in with backup code', { userId: user.id, result: 'success' });
  const tokens = await issueUserTokens(user.id);
  return { user: publicUser(user), accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
}

export async function refreshUserSession(refreshToken) {
  if (!refreshToken) {
    throw new AuthenticationError('Refresh token não informado.');
  }

  const matchedRecord = await findRefreshTokenRecordByValue(refreshToken);
  if (!matchedRecord) {
    throw new AuthenticationError('Refresh token inválido, expirado ou revogado.');
  }

  const isExpired = matchedRecord.expiresAt <= new Date();
  if (matchedRecord.revokedAt || isExpired) {
    await revokeAllRefreshTokensForUser(matchedRecord.userId);
    logger.warn('Refresh token reuse detected; invalidating all user refresh tokens', { userId: matchedRecord.userId });
    throw new AuthenticationError('Refresh token inválido, expirado ou revogado.');
  }

  await prisma.refreshToken.update({
    where: { id: matchedRecord.id },
    data: { revokedAt: new Date() }
  });

  const accessToken = generateAccessToken(matchedRecord.userId);
  const nextRefreshToken = await generateRefreshToken(matchedRecord.userId);

  logger.info('Refresh token rotated successfully', { userId: matchedRecord.userId });
  return { accessToken, refreshToken: nextRefreshToken };
}

export async function logoutUser(userId, refreshToken) {
  if (refreshToken) {
    const matchingRecord = await findRefreshTokenRecordByValue(refreshToken);
    if (matchingRecord && matchingRecord.userId === userId) {
      await prisma.refreshToken.update({
        where: { id: matchingRecord.id },
        data: { revokedAt: new Date() }
      });
      return { success: true };
    }
  }

  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() }
  });

  return { success: true };
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

  const secret = generateSecret();
  const plainBackupCodes = generatePlainBackupCodes(8);
  const hashedBackupCodes = await Promise.all(plainBackupCodes.map(c => bcryptLib.hash(c, 10)));

  await prisma.user.update({ where: { id: userId }, data: { totpSecret: secret, totpEnabled: false, backupCodes: hashedBackupCodes } });

  const totpUri = generateUri(secret, user.email);

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