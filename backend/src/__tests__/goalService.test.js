import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config/db.js', () => {
  const findMany = vi.fn();
  const create = vi.fn();
  const findFirst = vi.fn();
  const update = vi.fn();
  const del = vi.fn();
  return {
    prisma: {
      goal: { findMany, create, findFirst, update, delete: del }
    }
  };
});

import { prisma } from '../config/db.js';
import { listGoals, createGoal, updateGoal } from '../services/goalService.js';
import { NotFoundError } from '../utils/errors.js';

beforeEach(() => {
  prisma.goal.findMany.mockReset();
  prisma.goal.create.mockReset();
  prisma.goal.findFirst.mockReset();
  prisma.goal.update.mockReset();
});

describe('goalService', () => {
  it('computes progress and caps at 100%', async () => {
    prisma.goal.findMany.mockResolvedValue([
      { id: 1, title: 'A', targetAmount: 100, currentAmount: 120 }
    ]);

    const result = await listGoals(1);

    expect(result[0].progress).toBe(100);
  });

  it('returns 0 progress when target is 0 (division by zero safe)', async () => {
    prisma.goal.findMany.mockResolvedValue([
      { id: 2, title: 'B', targetAmount: 0, currentAmount: 50 }
    ]);

    const result = await listGoals(1);

    expect(result[0].progress).toBe(0);
  });

  it('throws on update when goal not found', async () => {
    prisma.goal.findFirst.mockResolvedValue(null);

    await expect(updateGoal(1, 999, { title: 'x', targetAmount: 100 })).rejects.toBeInstanceOf(NotFoundError);
  });
});
