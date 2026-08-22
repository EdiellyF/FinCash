import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config/db.js', () => {
  const findMany = vi.fn();
  return {
    prisma: {
      transaction: { findMany }
    }
  };
});

import { prisma } from '../config/db.js';
import { getDashboardData } from '../services/dashboardService.js';

beforeEach(() => {
  prisma.transaction.findMany.mockReset();
});

describe('dashboardService', () => {
  it('calculates totals and groups correctly', async () => {
    const transactions = [
      { id: 1, type: 'income', amount: 1000, transactionDate: '2026-08-01', category: { name: 'Salary' }, userId: 1 },
      { id: 2, type: 'expense', amount: 200, transactionDate: '2026-08-02', category: { name: 'Food' }, userId: 1 },
      { id: 3, type: 'expense', amount: 50, transactionDate: '2026-07-15', category: { name: 'Transport' }, userId: 1 }
    ];

    prisma.transaction.findMany.mockResolvedValue(transactions);

    const result = await getDashboardData(1);

    expect(result.totalIncome).toBe(1000);
    expect(result.totalExpense).toBe(250);
    expect(result.balance).toBe(750);
    expect(result.expensesByCategory.some(c => c.name === 'Food' && c.value === 200)).toBeTruthy();
    expect(result.recentTransactions.length).toBeGreaterThan(0);
  });

  it('handles empty transaction list', async () => {
    prisma.transaction.findMany.mockResolvedValue([]);

    const result = await getDashboardData(1);

    expect(result.totalIncome).toBe(0);
    expect(result.totalExpense).toBe(0);
    expect(result.balance).toBe(0);
    expect(result.expensesByCategory).toEqual([]);
    expect(result.monthlyMovement).toEqual([]);
  });
});
