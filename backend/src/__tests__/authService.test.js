import crypto from 'crypto';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';

vi.mock('../config/db.js', () => {
  const findUnique = vi.fn();
  const create = vi.fn();
  const findMany = vi.fn();
  const update = vi.fn();
  const updateMany = vi.fn();

  return {
    prisma: {
      user: { findUnique, create, update },
      refreshToken: { create, findMany, update, updateMany }
    }
  };
});

vi.mock('bcryptjs', async () => {
  const actual = await vi.importActual('bcryptjs');
  return {
    ...actual,
    hash: vi.fn(actual.hash),
    compare: vi.fn(actual.compare)
  };
});

import { prisma } from '../config/db.js';
import { registerUser, loginUser, refreshUserSession, logoutUser, resetPasswordWithBackupCode } from '../services/authService.js';
import { ConflictError, AuthenticationError } from '../utils/errors.js';

async function hashValue(value) {
  return bcrypt.hash(value, 10);
}

beforeEach(() => {
  prisma.user.findUnique.mockReset();
  prisma.user.create.mockReset();
  prisma.user.update.mockReset();
  prisma.refreshToken.create.mockReset();
  prisma.refreshToken.findMany.mockReset();
  prisma.refreshToken.update.mockReset();
  prisma.refreshToken.updateMany.mockReset();

  prisma.refreshToken.create.mockResolvedValue({ id: 'rt-new' });
  prisma.refreshToken.update.mockResolvedValue({ id: 'rt-1' });
  prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
});

describe('authService', () => {
  it('registers a new user and issues access + refresh tokens', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: 'u1', name: 'Alice', email: 'a@a.com' });

    const result = await registerUser({ name: 'Alice', email: 'a@a.com', password: 'pwd', consentAccepted: true });

    expect(result).toHaveProperty('user');
    expect(result.user).toHaveProperty('id', 'u1');
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result.accessToken.split('.')).toHaveLength(3);
    expect(result.refreshToken).not.toMatch(/^eyJ/);
  });

  it('rejects duplicate email on register', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u2', email: 'a@a.com' });

    await expect(registerUser({ name: 'Bob', email: 'a@a.com', password: 'pwd' })).rejects.toBeInstanceOf(ConflictError);
  });

  it('rejects wrong password on login', async () => {
    const wrongHash = await hashValue('correct_password');
    prisma.user.findUnique.mockResolvedValue({ id: 'u3', email: 'u@u.com', passwordHash: wrongHash });

    await expect(loginUser({ email: 'u@u.com', password: 'wrong_password' })).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('logs in successfully with accessToken and opaque refreshToken', async () => {
    const rightHash = await hashValue('correct_password');
    prisma.user.findUnique.mockResolvedValue({ id: 'u4', name: 'Carol', email: 'c@c.com', passwordHash: rightHash });

    const result = await loginUser({ email: 'c@c.com', password: 'correct_password' });

    expect(result).toHaveProperty('user');
    expect(result.user).toHaveProperty('id', 'u4');
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result.accessToken.split('.')).toHaveLength(3);
    expect(result.refreshToken).not.toMatch(/^eyJ/);
    expect(result.refreshToken).not.toBe(result.accessToken);
  });

  it('refreshes a valid token by rotating it and revoking the old one', async () => {
    const validRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = await hashValue(validRefreshToken);
    const futureDate = new Date(Date.now() + 60_000);
    prisma.refreshToken.findMany.mockResolvedValue([
      { id: 'rt1', userId: 'u5', tokenHash, expiresAt: futureDate, revokedAt: null }
    ]);

    const result = await refreshUserSession(validRefreshToken);

    expect(result.accessToken.split('.')).toHaveLength(3);
    expect(result.refreshToken).not.toMatch(/^eyJ/);
    expect(prisma.refreshToken.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'rt1' },
      data: { revokedAt: expect.any(Date) }
    }));
  });

  it('rejects a refresh token that was already revoked', async () => {
    const revokedToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = await hashValue(revokedToken);
    const futureDate = new Date(Date.now() + 60_000);
    prisma.refreshToken.findMany.mockResolvedValue([
      { id: 'rt1', userId: 'u5', tokenHash, expiresAt: futureDate, revokedAt: new Date() }
    ]);

    await expect(refreshUserSession(revokedToken)).rejects.toBeInstanceOf(AuthenticationError);
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'u5' },
      data: { revokedAt: expect.any(Date) }
    }));
  });

  it('rejects an expired refresh token', async () => {
    const expiredRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = await hashValue(expiredRefreshToken);
    prisma.refreshToken.findMany.mockResolvedValue([
      { id: 'rt2', userId: 'u5', tokenHash, expiresAt: new Date(Date.now() - 60_000), revokedAt: null }
    ]);

    await expect(refreshUserSession(expiredRefreshToken)).rejects.toBeInstanceOf(AuthenticationError);
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'u5' },
      data: { revokedAt: expect.any(Date) }
    }));
  });

  it('revokes the refresh token on logout', async () => {
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = await hashValue(refreshToken);
    const futureDate = new Date(Date.now() + 60_000);
    prisma.refreshToken.findMany.mockResolvedValue([
      { id: 'rt1', userId: 'u5', tokenHash, expiresAt: futureDate, revokedAt: null }
    ]);

    await logoutUser('u5', refreshToken);

    expect(prisma.refreshToken.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'rt1' },
      data: { revokedAt: expect.any(Date) }
    }));
  });

  it('resets password with a valid backup code and invalidates the used code', async () => {
    const validBackupCode = 'abc123backup';
    const otherBackupCode = 'unusedbackup';
    const validBackupCodeHash = await hashValue(validBackupCode);
    const otherBackupCodeHash = await hashValue(otherBackupCode);

    prisma.user.findUnique.mockResolvedValue({
      id: 'u6',
      name: 'Dora',
      email: 'd@d.com',
      passwordHash: await hashValue('old_password'),
      backupCodes: [validBackupCodeHash, otherBackupCodeHash]
    });
    prisma.user.update.mockResolvedValue({ id: 'u6' });

    const result = await resetPasswordWithBackupCode('d@d.com', validBackupCode, 'new_password');

    expect(result).toEqual({ success: true });
    expect(prisma.user.update).toHaveBeenLastCalledWith({
      where: { email: 'd@d.com' },
      data: {
        backupCodes: [otherBackupCodeHash],
        passwordHash: expect.any(String)
      }
    });
    await expect(bcrypt.compare('new_password', prisma.user.update.mock.calls.at(-1)[0].data.passwordHash)).resolves.toBe(true);
  });

  it('rejects password reset with an invalid backup code', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u7',
      email: 'e@e.com',
      passwordHash: await hashValue('old_password'),
      backupCodes: [await hashValue('different_code')]
    });

    await expect(resetPasswordWithBackupCode('e@e.com', 'wrong_code', 'new_password')).rejects.toBeInstanceOf(AuthenticationError);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('rejects password reset with an already used backup code', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u8',
      email: 'f@f.com',
      passwordHash: await hashValue('old_password'),
      backupCodes: []
    });

    await expect(resetPasswordWithBackupCode('f@f.com', 'used_code', 'new_password')).rejects.toBeInstanceOf(AuthenticationError);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
