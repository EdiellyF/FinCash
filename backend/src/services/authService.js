import bcrypt from 'bcryptjs';
import { prisma } from '../config/db.js';
import { generateToken } from '../utils/generateToken.js';

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
    throw new Error('E-mail já cadastrado.');
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash
    }
  });

  return { user: publicUser(user), token: generateToken(user.id) };
}

export async function loginUser(data) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw new Error('Credenciais inválidas.');

  const passwordMatch = await bcrypt.compare(data.password, user.passwordHash);
  if (!passwordMatch) throw new Error('Credenciais inválidas.');

  return { user: publicUser(user), token: generateToken(user.id) };
}

export async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  return {
    found: !!user,
    note: 'Implementação simplificada. Em produção, gere token seguro e envie por e-mail.'
  };
}

export async function resetPassword(email, newPassword) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Usuário não encontrado.');

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { email },
    data: { passwordHash }
  });

  return { success: true };
}
