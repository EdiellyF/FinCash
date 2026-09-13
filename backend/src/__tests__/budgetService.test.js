import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config/db.js', () => {
  const findMany = vi.fn();
  const groupBy = vi.fn();
  return {
    prisma: {
      budget: { findMany },
      transaction: { groupBy }
    }
  };
});

import { prisma } from '../config/db.js';
import { listBudgets } from '../services/budgetService.js';

const userId = 'user-1';
const foodId = 'cat-food';
const transportId = 'cat-transport';

function budgetRow(overrides = {}) {
  return {
    id: 'budget-1',
    userId,
    categoryId: foodId,
    month: 3,
    year: 2026,
    limitAmount: 500,
    category: { id: foodId, name: 'Alimentação' },
    ...overrides
  };
}

beforeEach(() => {
  prisma.budget.findMany.mockReset();
  prisma.transaction.groupBy.mockReset();
});

describe('listBudgets', () => {
  it('returns spentAmount equal to the sum of matching expense transactions', async () => {
    prisma.budget.findMany.mockResolvedValue([budgetRow()]);
    prisma.transaction.groupBy.mockResolvedValue([
      { categoryId: foodId, _sum: { amount: 150.5 } }
    ]);

    const result = await listBudgets(userId);

    expect(result).toHaveLength(1);
    expect(result[0].spentAmount).toBe(150.5);
    expect(prisma.transaction.groupBy).toHaveBeenCalledTimes(1);
    expect(prisma.transaction.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['categoryId'],
        where: expect.objectContaining({
          userId,
          type: 'expense',
          categoryId: { in: [foodId] },
          transactionDate: {
            gte: new Date(Date.UTC(2026, 2, 1)),
            lt: new Date(Date.UTC(2026, 3, 1))
          }
        }),
        _sum: { amount: true }
      })
    );
  });

  it('does not include other months, other categories, or income in spentAmount', async () => {
    prisma.budget.findMany.mockResolvedValue([budgetRow()]);
    prisma.transaction.groupBy.mockResolvedValue([
      { categoryId: foodId, _sum: { amount: 80 } }
    ]);

    const result = await listBudgets(userId);

    expect(result[0].spentAmount).toBe(80);

    const where = prisma.transaction.groupBy.mock.calls[0][0].where;
    expect(where.type).toBe('expense');
    expect(where.categoryId).toEqual({ in: [foodId] });
    expect(where.transactionDate).toEqual({
      gte: new Date(Date.UTC(2026, 2, 1)),
      lt: new Date(Date.UTC(2026, 3, 1))
    });
    expect(where.type).not.toBe('income');
  });

  it('returns spentAmount = 0 when there are no matching transactions', async () => {
    prisma.budget.findMany.mockResolvedValue([budgetRow()]);
    prisma.transaction.groupBy.mockResolvedValue([]);

    const result = await listBudgets(userId);

    expect(result[0].spentAmount).toBe(0);
  });

  it('includes spentAmount on every item in the format expected by the frontend', async () => {
    prisma.budget.findMany.mockResolvedValue([
      budgetRow({ id: 'b1', categoryId: foodId, month: 3, year: 2026 }),
      budgetRow({
        id: 'b2',
        categoryId: transportId,
        month: 4,
        year: 2026,
        category: { id: transportId, name: 'Transporte' }
      })
    ]);
    prisma.transaction.groupBy
      .mockResolvedValueOnce([{ categoryId: foodId, _sum: { amount: 200 } }])
      .mockResolvedValueOnce([]);

    const result = await listBudgets(userId);

    expect(result.every((row) => Object.hasOwn(row, 'spentAmount'))).toBe(true);
    expect(result.find((row) => row.id === 'b1').spentAmount).toBe(200);
    expect(result.find((row) => row.id === 'b2').spentAmount).toBe(0);
    expect(prisma.transaction.groupBy).toHaveBeenCalledTimes(2);
  });

  it('does not query transactions when the user has no budgets', async () => {
    prisma.budget.findMany.mockResolvedValue([]);

    const result = await listBudgets(userId);

    expect(result).toEqual([]);
    expect(prisma.transaction.groupBy).not.toHaveBeenCalled();
  });
});
