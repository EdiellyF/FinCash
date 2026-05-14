import { created, ok } from '../utils/response.js';
import { forgotPassword, loginUser, registerUser, resetPassword } from '../services/authService.js';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { sendOTP } from '../services/emailService.js';

const prisma = new PrismaClient();

export async function register(req, res) {
  const result = await registerUser(req.validatedData);
  return created(res, result, 'Cadastro realizado com sucesso.');
}

export async function login(req, res) {
  const result = await loginUser(req.validatedData);
  return ok(res, result, 'Login realizado com sucesso.');
}

export async function logout(req, res) {
  return ok(res, null, 'Logout realizado com sucesso.');
}

export async function forgotPasswordController(req, res) {
  const result = await forgotPassword(req.validatedData.email);
  return ok(res, result, 'Solicitação de recuperação processada.');
}

export async function resetPasswordController(req, res) {
  const result = await resetPassword(req.validatedData.email, req.validatedData.newPassword);
  return ok(res, result, 'Senha redefinida com sucesso.');
}

export async function requestRegister(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!email.includes('@')) {
      return res.status(400).json({
        message: 'Email inválido'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Senha deve ter pelo menos 6 caracteres'
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'Email já cadastrado'
      });
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

    return res.json({
      message: 'OTP enviado'
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Erro interno'
    });
  }
}

export async function verifyRegister(req, res) {
  try {
    const { email, otp } = req.body;

    const pendingUser = await prisma.pendingUser.findUnique({
      where: { email }
    });

    if (!pendingUser) {
      return res.status(404).json({
        message: 'Solicitação não encontrada'
      });
    }

    if (pendingUser.otpCode !== otp) {
      return res.status(400).json({
        message: 'Código inválido'
      });
    }

    if (new Date() > pendingUser.otpExpiresAt) {
      return res.status(400).json({
        message: 'Código expirado'
      });
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

    return res.json({
      message: 'Conta criada',
      user
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Erro interno'
    });
  }
}

export async function resendOTP(req, res) {
  try {
    const { email } = req.body;

    const pendingUser = await prisma.pendingUser.findUnique({
      where: { email }
    });

    if (!pendingUser) {
      return res.status(404).json({
        message: 'Solicitação não encontrada'
      });
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

    return res.json({
      message: 'Novo código enviado'
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Erro interno'
    });
  }
}