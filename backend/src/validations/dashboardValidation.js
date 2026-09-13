import { z } from 'zod';

export const getDashboardSchema = z.object({
  // Dashboard doesn't require query parameters, but we can add optional filters
  startDate: z.string().optional(),
  endDate: z.string().optional()
});
