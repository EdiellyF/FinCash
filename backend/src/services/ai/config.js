import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { env } from '../../config/env.js';

export const prisma = new PrismaClient();

export const genAI = env.geminiApiKey ? new GoogleGenerativeAI(env.geminiApiKey) : null;
export const groqClient = env.groqApiKey ? new Groq({ apiKey: env.groqApiKey }) : null;

export const TOTAL_DAILY_LIMIT_PER_USER = 2;

export const MODELS = {
  gemini: env.geminiModel || 'gemini-2.5-pro',
  groq: 'llama-3.3-70b-versatile',
};
