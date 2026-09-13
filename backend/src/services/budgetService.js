import { prisma } from '../config/db.js';
import { NotFoundError } from '../utils/errors.js';

function monthDateRange(year, month) {
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1))
  };
}

function spentKey(categoryId, month, year) {
  return `${categoryId}:${year}-${month}`;
}

export async function listBudgets(userId) {
  const budgets = await prisma.budget.findMany({
    where: { userId },
    include: { category: true },
    orderBy: [{ year: 'desc' }, { month: 'desc' }]
  });

  if (budgets.length === 0) {
    return budgets;
  }

  const categoryIds = [...new Set(budgets.map((budget) => budget.categoryId))];
  const periods = [
    ...new Map(
      budgets.map((budget) => [`${budget.year}-${budget.month}`, { month: budget.month, year: budget.year }])
    ).values()
  ];

  const groupedByPeriod = await Promise.all(
    periods.map(({ month, year }) => {
      const { start, end } = monthDateRange(year, month);
      return prisma.transaction.groupBy({
        by: ['categoryId'],
        where: {
          userId,
          type: 'expense',
          categoryId: { in: categoryIds },
          transactionDate: { gte: start, lt: end }
        },
        _sum: { amount: true }
      });
    })
  );

  const spentByKey = new Map();
  groupedByPeriod.forEach((groups, index) => {
    const { month, year } = periods[index];
    for (const group of groups) {
      spentByKey.set(spentKey(group.categoryId, month, year), Number(group._sum.amount ?? 0));
    }
  });

  return budgets.map((budget) => ({
    ...budget,
    spentAmount: spentByKey.get(spentKey(budget.categoryId, budget.month, budget.year)) ?? 0
  }));
}

export async function createBudget(userId, data) {
  return prisma.budget.upsert({
    where: {
      userId_categoryId_month_year: {
        userId,
        categoryId: data.categoryId,
        month: Number(data.month),
        year: Number(data.year)
      }
    },
    update: {
      limitAmount: data.limitAmount
    },
    create: {
      userId,
      categoryId: data.categoryId,
      month: Number(data.month),
      year: Number(data.year),
      limitAmount: data.limitAmount
    },
    include: { category: true }
  });
}

export async function updateBudget(userId, id, data) {
  const budget = await prisma.budget.findFirst({ where: { id, userId } });
  if (!budget) {
    throw new NotFoundError('Orçamento não encontrado.');
  }

  return prisma.budget.update({
    where: { id },
    data: {
      categoryId: data.categoryId,
      month: Number(data.month),
      year: Number(data.year),
      limitAmount: data.limitAmount
    },
    include: { category: true }
  });
}

export async function removeBudget(userId, id) {
  const budget = await prisma.budget.findFirst({ where: { id, userId } });
  if (!budget) {
    throw new NotFoundError('Orçamento não encontrado.');
  }

  await prisma.budget.delete({ where: { id } });
}