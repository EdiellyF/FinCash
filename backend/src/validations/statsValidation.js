import { z } from 'zod';

export const getUserStatsSchema = z.object({
  period: z.enum(['7d', '30d', '90d', '365d']).optional()
});

export const getUsageHistorySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional()
});
