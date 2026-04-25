import { prisma } from '../config/db.js';

async function ensureCategoryOwnership(userId, categoryId) {
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      OR: [{ userId }, { isDefault: true }]
    }
  });

  if (!category) throw new Error('Categoria inválida.');
  return category;
}

async function calculateBudgetAlert(userId, payload, ignoreTransactionId = null) {
  if (payload.type !== 'expense') return null;

  const date = new Date(payload.transactionDate);
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  const budget = await prisma.budget.findFirst({
    where: {
      userId,
      categoryId: payload.categoryId,
      month,
      year
    },
    include: { category: true }
  });

  if (!budget) return null;

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      categoryId: payload.categoryId,
      type: 'expense',
      transactionDate: { gte: monthStart, lte: monthEnd },
      ...(ignoreTransactionId ? { NOT: { id: ignoreTransactionId } } : {})
    }
  });

  const currentSpent = transactions.reduce((sum, item) => sum + Number(item.amount), 0);
  const projected = currentSpent + Number(payload.amount);
  const limit = Number(budget.limitAmount);

  if (projected > limit) {
    return {
      category: budget.category.name,
      month,
      year,
      limit,
      projected,
      exceededBy: projected - limit
    };
  }

  return null;
}

export async function listTransactions(userId, query) {
  const where = {
    userId,
    ...(query.type ? { type: query.type } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...((query.startDate || query.endDate) ? {
      transactionDate: {
        ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
        ...(query.endDate ? { lte: new Date(query.endDate) } : {})
      }
    } : {})
  };

  return prisma.transaction.findMany({
    where,
    include: { category: true },
    orderBy: { transactionDate: 'desc' }
  });
}

export async function createTransaction(userId, data) {
  await ensureCategoryOwnership(userId, data.categoryId);
  const budgetAlert = await calculateBudgetAlert(userId, data);

  const transaction = await prisma.transaction.create({
    data: {
      userId,
      categoryId: data.categoryId,
      type: data.type,
      title: data.title,
      description: data.description,
      amount: data.amount,
      transactionDate: new Date(data.transactionDate)
    },
    include: { category: true }
  });

  return { transaction, budgetAlert };
}

export async function updateTransaction(userId, id, data) {
  const existing = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!existing) throw new Error('Transação não encontrada.');

  await ensureCategoryOwnership(userId, data.categoryId);
  const budgetAlert = await calculateBudgetAlert(userId, data, id);

  const transaction = await prisma.transaction.update({
    where: { id },
    data: {
      categoryId: data.categoryId,
      type: data.type,
      title: data.title,
      description: data.description,
      amount: data.amount,
      transactionDate: new Date(data.transactionDate)
    },
    include: { category: true }
  });

  return { transaction, budgetAlert };
}

export async function removeTransaction(userId, id) {
  const existing = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!existing) throw new Error('Transação não encontrada.');

  await prisma.transaction.delete({ where: { id } });
}
