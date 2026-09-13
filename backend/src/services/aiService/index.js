import { env } from '../../config/env.js';
import { getFinancialContext, getComparativeContext } from './context.js';
import { formatContextText, formatHistoryText } from './prompts.js';
import { generateWithGemini, isGeminiAvailable } from './providers/gemini.js';
import { generateWithGroq, isGroqAvailable } from './providers/groq.js';
import {
  checkAndIncrementRequestCount,
  checkTotalUserRequestCount,
  TOTAL_DAILY_LIMIT_PER_USER,
  getUserLimits,
} from './rateLimiter.js';
import { getGenericAdvice, isRateLimitError } from './utils.js';

/**
 * Gera dica financeira usando o melhor provedor disponível
 */
export async function generateFinancialAdvice(userId, userMessage, conversationHistory = [], period = '30d') {
  try {
    const context = await getFinancialContext(userId, period);
    const contextText = formatContextText(context);
    const historyText = formatHistoryText(conversationHistory);

    // Provider priority is configurable via environment variable AI_PROVIDER_PRIORITY (comma-separated)
    const providerPriority = (env.aiProviderPriority || 'groq,gemini').split(',').map(p => p.trim()).filter(Boolean);
    let response = null;
    let usedProvider = null;

    for (const candidate of providerPriority) {
      // Skip candidate if client not configured or per-user total limit reached
      if (candidate === 'groq' && !isGroqAvailable()) continue;
      if (candidate === 'gemini' && !isGeminiAvailable()) continue;

      // if user exhausted total daily quota, don't attempt providers
      const totalUserCount = await checkTotalUserRequestCount(userId);
      if (totalUserCount >= TOTAL_DAILY_LIMIT_PER_USER) break;

      try {
        if (candidate === 'groq') {
          response = await generateWithGroq(contextText, historyText, userMessage);
        } else if (candidate === 'gemini') {
          response = await generateWithGemini(contextText, historyText, userMessage);
        }

        usedProvider = candidate;
        break; // success
      } catch (err) {
        // If rate limited by provider, log and try next provider. For non-rate errors
        // also try next provider to be resilient.
        console.warn(`[FinCash AI] Provider ${candidate} failed:`, err?.message || err);
        if (isRateLimitError(err)) {
          console.warn(`[FinCash AI] Provider ${candidate} reported rate limit (429). Trying next provider if available.`);
        }
        // continue loop to try next provider
      }
    }

    if (!response) {
   
      return getGenericAdvice();
    }

  
    const ttl = userMessage.includes('análise completa') || userMessage.includes('visão geral') ? 86400 : 3600;


    if (usedProvider) {
      await checkAndIncrementRequestCount(userId, usedProvider);
      await checkAndIncrementRequestCount('global', usedProvider);
    }

    return response;
  } catch (error) {
    console.error('Erro ao gerar dica financeira:', error);

    // Fallback: dicas genéricas baseadas em regras
    return getGenericAdvice();
  }
}

export { getFinancialContext, getComparativeContext, getUserLimits };