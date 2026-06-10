import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

function buildOtpHtml(otp) {
  return `
    <div style="font-family: Arial">
      <h2>Seu codigo e:</h2>
      <h1>${otp}</h1>
      <p>Expira em 10 minutos.</p>
    </div>
  `;
}

function hasSmtpConfig() {
  return Boolean(env.smtpHost && env.smtpUser && env.smtpPass);
}

function hasResendConfig() {
  return Boolean(env.resendApiKey);
}

async function sendWithSmtp(email, otp) {
  const transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass
    }
  });

  await transporter.sendMail({
    from: env.smtpFrom || env.smtpUser,
    to: email,
    subject: 'Codigo de confirmacao',
    html: buildOtpHtml(otp)
  });
}

async function sendWithResend(email, otp) {
  const resend = new Resend(env.resendApiKey);

  await resend.emails.send({
    from: 'FinCash <onboarding@resend.dev>',
    to: email,
    subject: 'Codigo de confirmacao',
    html: buildOtpHtml(otp)
  });
}

export async function sendOTP(email, otp) {
  const errors = [];

  logger.info('Attempting to send OTP email', { email, hasSmtp: hasSmtpConfig(), hasResend: hasResendConfig() });

  if (hasSmtpConfig()) {
    try {
      await sendWithSmtp(email, otp);
      logger.info('OTP email sent successfully with SMTP', { email });
      return;
    } catch (error) {
      errors.push(`SMTP: ${error.message}`);
      logger.warn('Failed to send OTP with SMTP', { email, error: error.message });
    }
  } else {
    logger.warn('SMTP not configured, skipping', { email });
  }

  if (hasResendConfig()) {
    try {
      await sendWithResend(email, otp);
      logger.info('OTP email sent successfully with Resend', { email });
      return;
    } catch (error) {
      errors.push(`Resend: ${error.message}`);
      logger.warn('Failed to send OTP with Resend', { email, error: error.message });
    }
  } else {
    logger.warn('Resend not configured, skipping', { email });
  }

  // Development fallback - never throw error in development
  if (env.nodeEnv === 'development') {
    logger.warn('Email service not configured. Using development fallback.', {
      email,
      otp,
      errors,
      environment: env.nodeEnv
    });
    return; // Never throw in development
  }

  // In production, throw error if both methods failed
  throw new Error(`Nao foi possivel enviar o codigo de confirmacao. ${errors.join(' | ')}`);
}