import { prisma } from '../config/db.js';

export async function getMonthlyTransactions(userId, month, year) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  return prisma.transaction.findMany({
    where: {
      userId,
      transactionDate: {
        gte: start,
        lte: end
      }
    },
    include: { category: true },
    orderBy: { transactionDate: 'desc' }
  });
}

export async function getCategorySummary(userId) {
  const rows = await prisma.transaction.findMany({
    where: { userId, type: 'expense' },
    include: { category: true }
  });

  const map = {};
  rows.forEach((item) => {
    const key = item.category?.name || 'Sem categoria';
    map[key] = (map[key] || 0) + Number(item.amount);
  });

  return Object.entries(map).map(([category, total]) => ({ category, total }));
}
