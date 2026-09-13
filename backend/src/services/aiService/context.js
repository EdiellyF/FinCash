import { prisma } from '../../config/db.js';

/**
 * Obtém contexto financeiro do usuário para um período específico
 */
async function getFinancialContext(userId, period = '30d') {
  const now = new Date();
  const periodDays = {
    '7d': 7,
    '30d': 30,
    '365d': 365,
  }[period] || 30;

  const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const recentTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      transactionDate: {
        gte: startDate,
      },
    },
    include: {
      category: true,
    },
    orderBy: {
      transactionDate: 'desc',
    },
    take: 50,
  });

  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { deadline: 'asc' },
  });

  const budgets = await prisma.budget.findMany({
    where: {
      userId,
      month: currentMonth,
      year: currentYear,
    },
    include: {
      category: true,
    },
  });

  const totalIncome = recentTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = recentTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpense;

  return {
    balance,
    totalIncome,
    totalExpense,
    recentTransactions,
    goals,
    budgets,
    currentMonth,
    currentYear,
    period,
    periodDays,
  };
}

/**
 * Obtém contexto comparativo para múltiplos períodos
 */
async function getComparativeContext(userId, periods = ['7d', '30d', '365d']) {
  const contexts = await Promise.all(
    periods.map(period => getFinancialContext(userId, period))
  );

  return {
    periods: contexts.map(ctx => ({
      period: ctx.period,
      periodDays: ctx.periodDays,
      balance: ctx.balance,
      totalIncome: ctx.totalIncome,
      totalExpense: ctx.totalExpense,
    })),
    currentGoals: contexts[0].goals,
    currentBudgets: contexts[0].budgets,
  };
}

export { getFinancialContext, getComparativeContext };