import { prisma } from '../config/db.js';
import * as bcrypt from 'bcryptjs';
import { logger } from '../config/logger.js';
import { AuthenticationError, NotFoundError } from '../utils/errors.js';

export async function getMe(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('Usuário não encontrado.');

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt
  };
}

export async function updateMe(userId, data) {
  if (data.email) {
    const existing = await prisma.user.findFirst({
      where: { email: data.email, NOT: { id: userId } }
    });
    if (existing) throw new Error('Este e-mail já está em uso.');
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      email: data.email,
      avatarUrl: data.avatarUrl
    }
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl
  };
}

export async function deleteAccount(userId, currentPassword) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('Usuário não encontrado.');

  // If user doesn't have a password hash (e.g. OAuth-only account), treat as invalid password
  if (!user.passwordHash) {
    logger.warn('Account deletion attempt for user without password hash', { userId });
    throw new AuthenticationError('Senha atual inválida.');
  }

  const passwordMatches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!passwordMatches) {
    logger.warn('Account deletion attempt with invalid password', { userId });
    throw new AuthenticationError('Senha atual inválida.');
  }

  // Perform deletion (onDelete: Cascade in schema should remove related data)
  await prisma.user.delete({ where: { id: userId } });

  logger.info('User account deleted', { userId });
  return;
}
