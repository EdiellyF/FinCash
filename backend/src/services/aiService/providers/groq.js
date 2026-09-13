import Groq from 'groq-sdk';
import { env } from '../../../config/env.js';
import { buildFullPrompt } from '../prompts.js';

const groqClient = env.groqApiKey ? new Groq({ apiKey: env.groqApiKey }) : null;
const MODEL = 'llama-3.3-70b-versatile';

/**
 * Gera resposta financeira usando Groq
 */
async function generateWithGroq(contextText, historyText, userMessage) {
  if (!groqClient) {
    throw new Error('GROQ_API_KEY não configurada ou inválida.');
  }

  const fullPrompt = buildFullPrompt(contextText, historyText, userMessage);

  const messages = [
    {
      role: 'user',
      content: fullPrompt,
    },
  ];

  const chatCompletion = await groqClient.chat.completions.create({
    messages,
    model: MODEL,
  });

  return chatCompletion.choices[0]?.message?.content || '';
}

/**
 * Verifica se o provedor Groq está disponível
 */
function isGroqAvailable() {
  return !!groqClient;
}

export { generateWithGroq, isGroqAvailable };