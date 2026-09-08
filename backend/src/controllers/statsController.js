import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger.js';
import { logSanitizedError } from '../utils/safeLogger.js';

const prisma = new PrismaClient();

/**
 * Obtém estatísticas do usuário atual
 */
export async function getUserStats(req, res) {
  try {
    const userId = req.user.id;
    const period = req.query.period || '30d';

    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '365d': 365,
    }[period] || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Total de análises no período
    const totalAnalyses = await prisma.chatMessage.count({
      where: {
        userId,
        role: 'assistant',
        createdAt: { gte: startDate },
      },
    });

    // Análises por dia
    const analysesByDay = await prisma.$queryRaw`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as count
      FROM chat_messages
      WHERE user_id = ${userId}
        AND role = 'assistant'
        AND created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Distribuição por provedor
    const providerDistribution = await prisma.$queryRaw`
      SELECT
        provider,
        COUNT(*) as count
      FROM request_logs
      WHERE user_id = ${userId}
        AND date >= ${startDate}
      GROUP BY provider
    `;

    // Horários de pico
    const peakHours = await prisma.$queryRaw`
      SELECT
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as count
      FROM chat_messages
      WHERE user_id = ${userId}
        AND role = 'assistant'
        AND created_at >= ${startDate}
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY count DESC
      LIMIT 5
    `;

    // Média de tempo entre análises (aproximado)
    const messages = await prisma.chatMessage.findMany({
      where: {
        userId,
        role: 'assistant',
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });

    let avgTimeBetweenAnalyses = 0;
    if (messages.length > 1) {
      const intervals = [];
      for (let i = 1; i < messages.length; i++) {
        const diff = messages[i].createdAt - messages[i - 1].createdAt;
        intervals.push(diff);
      }
      avgTimeBetweenAnalyses = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    }

    res.json({
      period,
      periodDays,
      totalAnalyses,
      analysesByDay: analysesByDay.map(row => ({
        date: row.date,
        count: Number(row.count),
      })),
      providerDistribution: providerDistribution.map(row => ({
        provider: row.provider,
        count: Number(row.count),
      })),
      peakHours: peakHours.map(row => ({
        hour: Number(row.hour),
        count: Number(row.count),
      })),
      avgTimeBetweenAnalyses: Math.round(avgTimeBetweenAnalyses / (1000 * 60)), // em minutos
    });
  } catch (error) {
    logSanitizedError('Erro ao buscar estatísticas', error, { userId: req?.user?.id });
    res.status(500).json({ message: 'Erro ao buscar estatísticas.' });
  }
}

/**
 * Obtém histórico detalhado de uso
 */
export async function getUsageHistory(req, res) {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;

    const logs = await prisma.requestLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit,
    });

    res.json(logs);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ message: 'Erro ao buscar histórico.' });
  }
}
