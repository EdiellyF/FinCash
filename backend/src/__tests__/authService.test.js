import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma client
vi.mock('../config/db.js', () => {
  const findUnique = vi.fn();
  const create = vi.fn();
  return {
    prisma: {
      user: { findUnique, create }
    }
  };
});

vi.mock('bcryptjs', () => ({
  hash: vi.fn(() => 'hashed_password'),
  compare: vi.fn((provided, stored) => provided === 'correct_password')
}));

import { prisma } from '../config/db.js';
import { registerUser, loginUser } from '../services/authService.js';
import { ConflictError, AuthenticationError } from '../utils/errors.js';

beforeEach(() => {

  prisma.user.findUnique.mockReset();
  prisma.user.create.mockReset();
});

describe('authService', () => {
  it('registers a new user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: 1, name: 'Alice', email: 'a@a.com' });

    const result = await registerUser({ name: 'Alice', email: 'a@a.com', password: 'pwd' });

    expect(result).toHaveProperty('user');
    expect(result.user).toHaveProperty('id');
    expect(result).toHaveProperty('token');
  });

  it('rejects duplicate email on register', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 2, email: 'a@a.com' });

    await expect(registerUser({ name: 'Bob', email: 'a@a.com', password: 'pwd' })).rejects.toBeInstanceOf(ConflictError);
  });

  it('rejects wrong password on login', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 3, email: 'u@u.com', passwordHash: 'hashed_password' });

    await expect(loginUser({ email: 'u@u.com', password: 'wrong_password' })).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('logs in successfully with correct password', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 4, name: 'Carol', email: 'c@c.com', passwordHash: 'hashed_password' });

    const result = await loginUser({ email: 'c@c.com', password: 'correct_password' });

    expect(result).toHaveProperty('user');
    expect(result.user).toHaveProperty('id');
    expect(result).toHaveProperty('token');
  });
});
