import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';

vi.mock('../config/db.js', () => {
  const findUnique = vi.fn();
  const create = vi.fn();
  const del = vi.fn();
  const refreshTokenCreate = vi.fn();
  const refreshTokenFindMany = vi.fn();
  const refreshTokenUpdate = vi.fn();
  const refreshTokenUpdateMany = vi.fn();

  return {
    prisma: {
      user: { findUnique, create, delete: del },
      refreshToken: {
        create: refreshTokenCreate,
        findMany: refreshTokenFindMany,
        update: refreshTokenUpdate,
        updateMany: refreshTokenUpdateMany
      }
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
import { registerUser } from '../services/authService.js';
import { getMe, deleteAccount } from '../services/userService.js';
import { ValidationError } from '../utils/errors.js';

beforeEach(() => {
  prisma.user.findUnique.mockReset();
  prisma.user.create.mockReset();
  prisma.user.delete.mockReset();
  prisma.refreshToken.create.mockReset();
  prisma.refreshToken.findMany.mockReset();
  prisma.refreshToken.update.mockReset();
  prisma.refreshToken.updateMany.mockReset();
  prisma.refreshToken.create.mockResolvedValue({ id: 'rt-new' });
});

describe('Privacy and consent compliance', () => {
  it('rejects registration without consentAccepted=true', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(registerUser({ name: 'A', email: 'a@a.com', password: 'pwd' })).rejects.toBeInstanceOf(ValidationError);
  });

  it('registers with consent and sets consent fields', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: 'u1', name: 'A', email: 'a@a.com' });

    const result = await registerUser({ name: 'A', email: 'a@a.com', password: 'pwd', consentAccepted: true });

    expect(prisma.user.create).toHaveBeenCalled();
    const callData = prisma.user.create.mock.calls[0][0].data;
    expect(callData.consentVersion).toBe('1.0');
    expect(callData.consentGivenAt).toBeInstanceOf(Date);
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
  });

  it('deleteAccount verifies password and deletes the user', async () => {
    const correctHash = await bcrypt.hash('correct_password', 10);
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', passwordHash: correctHash });
    await deleteAccount('u1', 'correct_password');
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });

  it('getMe never returns sensitive fields', async () => {
    const now = new Date();
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', name: 'A', email: 'a@a.com', avatarUrl: null, passwordHash: 'x', totpSecret: 's', backupCodes: ['a'], createdAt: now });
    const res = await getMe('u1');
    expect(res).toEqual({ id: 'u1', name: 'A', email: 'a@a.com', avatarUrl: null, createdAt: now });
    expect(res).not.toHaveProperty('passwordHash');
    expect(res).not.toHaveProperty('totpSecret');
    expect(res).not.toHaveProperty('backupCodes');
  });
});
