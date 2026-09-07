import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';

export function generateAccessToken(userId) {
  return jwt.sign({ userId }, env.jwtSecret, { expiresIn: env.accessTokenTtl });
}

export async function generateRefreshToken(userId) {
  const refreshToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = await bcrypt.hash(refreshToken, 10);
  const expiresAt = new Date(Date.now() + env.refreshTokenDays * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt
    }
  });

  return refreshToken;
}
