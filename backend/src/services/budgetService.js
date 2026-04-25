import { prisma } from '../config/db.js';

export async function listBudgets(userId) {
  return prisma.budget.findMany({
    where: { userId },
    include: { category: true },
    orderBy: [{ year: 'desc' }, { month: 'desc' }]
  });
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
  if (!budget) throw new Error('Orçamento não encontrado.');

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
  if (!budget) throw new Error('Orçamento não encontrado.');

  await prisma.budget.delete({ where: { id } });
}
