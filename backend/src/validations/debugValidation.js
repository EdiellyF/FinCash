import { z } from 'zod';

export const echoSchema = z.object({
  test: z.string().optional()
});
