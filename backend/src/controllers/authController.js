import { created, ok } from '../utils/response.js';
import { forgotPassword, loginUser, registerUser, resetPassword } from '../services/authService.js';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { sendOTP } from '../services/emailService.js';
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors.js';
import { logger } from '../config/logger.js';

const prisma = new PrismaClient();

export async function register(req, res) {
  logger.info('User registration attempt', { email: req.validatedData.email });
  const result = await registerUser(req.validatedData);
  logger.info('User registered successfully', { userId: result.user.id });
  return created(res, result, 'Cadastro realizado com sucesso.');
}

export async function login(req, res) {
  logger.info('User login attempt', { email: req.validatedData.email });
  const result = await loginUser(req.validatedData);
  logger.info('User logged in successfully', { userId: result.user.id });
  return ok(res, result, 'Login realizado com sucesso.');
}

export async function logout(req, res) {
  logger.info('User logout', { userId: req.user.id });
  return ok(res, null, 'Logout realizado com sucesso.');
}

export async function forgotPasswordController(req, res) {
  logger.info('Password reset requested', { email: req.validatedData.email });
  const result = await forgotPassword(req.validatedData.email);
  return ok(res, result, 'Solicitação de recuperação processada.');
}

export async function resetPasswordController(req, res) {
  logger.info('Password reset attempt', { email: req.validatedData.email });
  const result = await resetPassword(req.validatedData.email, req.validatedData.newPassword);
  logger.info('Password reset successful', { email: req.validatedData.email });
  return ok(res, result, 'Senha redefinida com sucesso.');
}

export async function requestRegister(req, res) {
  const { name, email, password } = req.body;

  logger.info('Registration request with OTP', { email });

  if (!email.includes('@')) {
    throw new ValidationError('Email inválido');
  }

  if (password.length < 6) {
    throw new ValidationError('Senha deve ter pelo menos 6 caracteres');
  }

  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new ConflictError('Email já cadastrado');
  }

  const otp = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  const otpExpiresAt = new Date(
    Date.now() + 10 * 60 * 1000
  );

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.pendingUser.upsert({
    where: { email },
    update: {
      name,
      password: hashedPassword,
      otpCode: otp,
      otpExpiresAt
    },
    create: {
      name,
      email,
      password: hashedPassword,
      otpCode: otp,
      otpExpiresAt
    }
  });

  await sendOTP(email, otp);

  logger.info('OTP sent successfully', { email });

  return created(res, { email }, 'OTP enviado');
}

export async function verifyRegister(req, res) {
  const { email, otp } = req.body;

  logger.info('OTP verification attempt', { email });

  const pendingUser = await prisma.pendingUser.findUnique({
    where: { email }
  });

  if (!pendingUser) {
    throw new NotFoundError('Solicitação não encontrada');
  }

  if (pendingUser.otpCode !== otp) {
    logger.warn('Invalid OTP attempt', { email });
    throw new ValidationError('Código inválido');
  }

  if (new Date() > pendingUser.otpExpiresAt) {
    logger.warn('Expired OTP attempt', { email });
    throw new ValidationError('Código expirado');
  }

  const user = await prisma.user.create({
    data: {
      name: pendingUser.name,
      email: pendingUser.email,
      passwordHash: pendingUser.password
    }
  });

  await prisma.pendingUser.delete({
    where: { email }
  });

  logger.info('User account created successfully', { userId: user.id, email });

  return created(res, { user }, 'Conta criada com sucesso');
}

export async function resendOTP(req, res) {
  const { email } = req.body;

  logger.info('OTP resend request', { email });

  const pendingUser = await prisma.pendingUser.findUnique({
    where: { email }
  });

  if (!pendingUser) {
    throw new NotFoundError('Solicitação não encontrada');
  }

  const otp = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  const otpExpiresAt = new Date(
    Date.now() + 10 * 60 * 1000
  );

  await prisma.pendingUser.update({
    where: { email },
    data: {
      otpCode: otp,
      otpExpiresAt
    }
  });

  await sendOTP(email, otp);

  logger.info('New OTP sent successfully', { email });

  return ok(res, null, 'Novo código enviado');
}