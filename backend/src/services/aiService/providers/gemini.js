import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../../config/env.js';
import { buildFullPrompt } from '../prompts.js';

const genAI = env.geminiApiKey ? new GoogleGenerativeAI(env.geminiApiKey) : null;
const MODEL = env.geminiModel || 'gemini-2.5-pro';

/**
 * Gera resposta financeira usando Gemini
 */
async function generateWithGemini(contextText, historyText, userMessage) {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY não configurada ou inválida.');
  }

  const model = genAI.getGenerativeModel({ model: MODEL });
  const fullPrompt = buildFullPrompt(contextText, historyText, userMessage);

  const result = await model.generateContent(fullPrompt);
  return result.response.text();
}

/**
 * Verifica se o provedor Gemini está disponível
 */
function isGeminiAvailable() {
  return !!genAI;
}

export { generateWithGemini, isGeminiAvailable };