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
      refreshToken: { create, findMany, update, updateMany },
      passwordResetToken: { create, findMany, update, updateMany }
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
import { registerUser, loginUser, refreshUserSession, logoutUser, forgotPassword, resetPassword } from '../services/authService.js';
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
  prisma.passwordResetToken.create.mockReset?.();
  prisma.passwordResetToken.findMany.mockReset?.();
  prisma.passwordResetToken.update.mockReset?.();
  prisma.passwordResetToken.updateMany.mockReset?.();

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

  // Password reset tests
  it('resets password with valid token and revokes refresh tokens', async () => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await hashValue(rawToken);
    const future = new Date(Date.now() + 60_000);

    prisma.user.findUnique.mockResolvedValue({ id: 'u-reset', email: 'r@r.com' });
    prisma.passwordResetToken.findMany.mockResolvedValue([
      { id: 'prt1', userId: 'u-reset', tokenHash, expiresAt: future, usedAt: null }
    ]);
    prisma.passwordResetToken.update.mockResolvedValue({ id: 'prt1' });
    prisma.user.update.mockResolvedValue({ id: 'u-reset' });

    await expect(resetPassword('r@r.com', rawToken, 'newpass')).resolves.toEqual({ success: true });
    expect(prisma.passwordResetToken.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'prt1' }, data: { usedAt: expect.any(Date) } }));
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'u-reset' } }));
  });

  it('rejects expired token', async () => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await hashValue(rawToken);
    const past = new Date(Date.now() - 60_000);

    prisma.user.findUnique.mockResolvedValue({ id: 'u-exp', email: 'e@e.com' });
    prisma.passwordResetToken.findMany.mockResolvedValue([
      { id: 'prt2', userId: 'u-exp', tokenHash, expiresAt: past, usedAt: null }
    ]);

    await expect(resetPassword('e@e.com', rawToken, 'newpass')).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('rejects token that was already used', async () => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await hashValue(rawToken);
    const future = new Date(Date.now() + 60_000);

    prisma.user.findUnique.mockResolvedValue({ id: 'u-used', email: 'u@u.com' });
    prisma.passwordResetToken.findMany.mockResolvedValue([
      { id: 'prt3', userId: 'u-used', tokenHash, expiresAt: future, usedAt: new Date() }
    ]);

    await expect(resetPassword('u@u.com', rawToken, 'newpass')).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('token for other user does not work', async () => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await hashValue(rawToken);
    const future = new Date(Date.now() + 60_000);

    // token belongs to another user
    prisma.user.findUnique.mockResolvedValue({ id: 'u-target', email: 't@t.com' });
    prisma.passwordResetToken.findMany.mockResolvedValue([]);

    await expect(resetPassword('t@t.com', rawToken, 'newpass')).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('forgotPassword does not reveal existence of email', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u-z', email: 'z@z.com' });
    const res1 = await forgotPassword('z@z.com');

    prisma.user.findUnique.mockResolvedValue(null);
    const res2 = await forgotPassword('missing@no.com');

    expect(res1).toEqual(res2);
  });
});
