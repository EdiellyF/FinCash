import { prisma } from '../../config/db.js';

const TOTAL_DAILY_LIMIT_PER_USER = 2;

/**
 * Verifica e incrementa o contador de requisições para um usuário e provedor
 */
async function checkAndIncrementRequestCount(userId, provider) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const log = await prisma.requestLog.findUnique({
    where: {
      userId_date_provider: {
        userId,
        date: today,
        provider,
      },
    },
  });

  if (!log) {
    await prisma.requestLog.create({
      data: {
        userId,
        date: today,
        count: 1,
        provider,
      },
    });
    return 1;
  }

  await prisma.requestLog.update({
    where: { id: log.id },
    data: { count: log.count + 1 },
  });

  return log.count + 1;
}

/**
 * Verifica o contador de requisições de um usuário para um provedor específico
 */
async function checkUserLimit(userId, provider) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const log = await prisma.requestLog.findUnique({
    where: {
      userId_date_provider: {
        userId,
        date: today,
        provider,
      },
    },
  });

  return log ? log.count : 0;
}

/**
 * Verifica o total de requisições de um usuário (todos os provedores)
 */
async function checkTotalUserRequestCount(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const logs = await prisma.requestLog.findMany({
    where: {
      userId,
      date: today,
      provider: {
        in: ['gemini', 'groq'],
      },
    },
  });

  return logs.reduce((total, log) => total + log.count, 0);
}

/**
 * Retorna os limites para um provedor específico
 */
function getProviderLimits(provider) {
  const limits = {
    gemini: {
      perUser: TOTAL_DAILY_LIMIT_PER_USER,
    },
    groq: {
      perUser: TOTAL_DAILY_LIMIT_PER_USER,
    },
  };
  return limits[provider] || { perUser: Infinity };
}

/**
 * Verifica se um provedor está disponível para um usuário
 */
async function isProviderAvailable(provider, userId) {
  const limits = getProviderLimits(provider);
  const totalUserCount = await checkTotalUserRequestCount(userId);

  return totalUserCount < limits.perUser;
}

/**
 * Retorna os limites atuais do usuário
 */
async function getUserLimits(userId) {
  const geminiUserCount = await checkUserLimit(userId, 'gemini');
  const groqUserCount = await checkUserLimit(userId, 'groq');
  const totalUserCount = await checkTotalUserRequestCount(userId);

  // Calcular porcentagem de uso do TOTAL
  const totalUserPercentage = (totalUserCount / TOTAL_DAILY_LIMIT_PER_USER) * 100;

  return {
    combined: {
      userLimit: TOTAL_DAILY_LIMIT_PER_USER,
      userUsed: totalUserCount,
      userRemaining: Math.max(0, TOTAL_DAILY_LIMIT_PER_USER - totalUserCount),
      userPercentage: Math.min(100, totalUserPercentage),
      nearLimit: totalUserCount >= TOTAL_DAILY_LIMIT_PER_USER - 1,
      limitExceeded: totalUserCount >= TOTAL_DAILY_LIMIT_PER_USER,
    },
    gemini: {
      userUsed: geminiUserCount,
      userPercentage: Math.min(100, geminiUserCount > 0 ? 100 : 0),
      available: totalUserCount < TOTAL_DAILY_LIMIT_PER_USER,
    },
    groq: {
      userUsed: groqUserCount,
      userPercentage: Math.min(100, groqUserCount > 0 ? 100 : 0),
      available: totalUserCount < TOTAL_DAILY_LIMIT_PER_USER,
    },
  };
}

export {
  checkAndIncrementRequestCount,
  checkUserLimit,
  checkTotalUserRequestCount,
  getProviderLimits,
  isProviderAvailable,
  getUserLimits,
  TOTAL_DAILY_LIMIT_PER_USER,
};