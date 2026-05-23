import bcrypt from 'bcryptjs';
import { prisma } from '../config/db.js';
import { generateToken } from '../utils/generateToken.js';
import { ConflictError, AuthenticationError, NotFoundError } from '../utils/errors.js';
import { logger } from '../config/logger.js';

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl
  };
}

export async function registerUser(data) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    logger.warn('Registration attempt with existing email', { email: data.email });
    throw new ConflictError('E-mail já cadastrado.');
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash
    }
  });

  logger.info('New user registered', { userId: user.id, email: user.email });

  return { user: publicUser(user), token: generateToken(user.id) };
}

export async function loginUser(data) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    logger.warn('Login attempt with non-existent email', { email: data.email });
    throw new AuthenticationError('Credenciais inválidas.');
  }

  const passwordMatch = await bcrypt.compare(data.password, user.passwordHash);
  if (!passwordMatch) {
    logger.warn('Login attempt with wrong password', { email: data.email, userId: user.id });
    throw new AuthenticationError('Credenciais inválidas.');
  }

  logger.info('User logged in successfully', { userId: user.id, email: user.email });

  return { user: publicUser(user), token: generateToken(user.id) };
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

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { email },
    data: { passwordHash }
  });

  logger.info('Password reset successfully', { userId: user.id, email });

  return { success: true };
}