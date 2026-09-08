import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger.js';

const prisma = new PrismaClient();

/**
 * Start a periodic job to clean up used or expired PasswordResetToken records.
 *
 * Options:
 *  - intervalMs: how often to run the cleanup (default 3600000 ms = 1 hour)
 *
 * Returns a function to stop the interval when called.
 */
export function startPasswordResetTokenCleanup({ intervalMs = 3600000 } = {}) {
  let intervalId = null;

  const cleanup = async () => {
    try {
      const now = new Date();
      const where = {
        OR: [
          { usedAt: { not: null } },
          { expiresAt: { lt: now } }
        ]
      };

      const result = await prisma.passwordResetToken.deleteMany({ where });
      const deleted = result?.count ?? 0;
      if (deleted > 0) {
        logger.info('Cleaned up password reset tokens', { deleted });
      }
    } catch (err) {
      // log sanitized to avoid leaking sensitive nested fields
      logger.error('Failed to clean up password reset tokens', { error: err?.message, stack: err?.stack });
    }
  };

  // Run once immediately, then schedule
  cleanup().catch(() => {});
  intervalId = setInterval(() => { cleanup().catch(() => {}); }, intervalMs);

  return () => {
    if (intervalId) clearInterval(intervalId);
  };
}
