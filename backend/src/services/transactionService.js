import { prisma } from '../config/db.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../config/logger.js';

async function ensureCategoryOwnership(userId, categoryId) {
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      OR: [{ userId }, { isDefault: true }]
    }
  });

  if (!category) {
    logger.warn('Invalid category access attempt', { userId, categoryId });
    throw new ValidationError('Categoria inválida ou não pertence ao usuário.');
  }
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
    logger.warn('Budget limit exceeded', { 
      userId, 
      categoryId: payload.categoryId, 
      category: budget.category.name,
      limit, 
      projected,
      exceededBy: projected - limit 
    });
    
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
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 50;
  const skip = (page - 1) * limit;

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

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { transactionDate: 'desc' },
      skip,
      take: limit
    }),
    prisma.transaction.count({ where })
  ]);

  logger.info('Transactions listed with pagination', { 
    userId, 
    page, 
    limit, 
    total,
    returned: transactions.length 
  });

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
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

  logger.info('Transaction created in database', { 
    userId, 
    transactionId: transaction.id,
    type: transaction.type,
    amount: transaction.amount,
    budgetAlert: !!budgetAlert 
  });

  return { transaction, budgetAlert };
}

export async function updateTransaction(userId, id, data) {
  const existing = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!existing) {
    logger.warn('Update attempt for non-existent transaction', { userId, transactionId: id });
    throw new NotFoundError('Transação não encontrada.');
  }

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

  logger.info('Transaction updated in database', { 
    userId, 
    transactionId: id,
    budgetAlert: !!budgetAlert 
  });

  return { transaction, budgetAlert };
}

export async function removeTransaction(userId, id) {
  const existing = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!existing) {
    logger.warn('Delete attempt for non-existent transaction', { userId, transactionId: id });
    throw new NotFoundError('Transação não encontrada.');
  }

  await prisma.transaction.delete({ where: { id } });
  
  logger.info('Transaction deleted from database', { userId, transactionId: id });
}