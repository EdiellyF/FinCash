import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

const prisma = new PrismaClient();

/**
 * Start a periodic job to clean up used or expired PasswordResetToken records.
 *
 * Reads configuration from environment via backend/src/config/env.js:
 *  - env.passwordResetCleanupEnabled (boolean, default true)
 *  - env.passwordResetCleanupIntervalMs (number, default 3600000)
 *
 * Options (overrides env):
 *  - intervalMs: how often to run the cleanup (ms)
 *
 * Returns a function to stop the interval when called.
 */
export function startPasswordResetTokenCleanup({ intervalMs } = {}) {
  // In test environment, default to disabled unless explicitly enabled via env var
  if (env.nodeEnv === 'test' && typeof process.env.PASSWORD_RESET_CLEANUP_ENABLED === 'undefined') {
    logger.info('Password reset token cleanup job disabled in test environment (override with PASSWORD_RESET_CLEANUP_ENABLED=true)');
    return () => {};
  }

  // Respect explicit env-based enable flag
  const enabled = (typeof env.passwordResetCleanupEnabled !== 'undefined') ? env.passwordResetCleanupEnabled : true;
  if (!enabled) {
    logger.info('Password reset token cleanup job is disabled via env');
    return () => {};
  }

  const effectiveIntervalMs = intervalMs ?? env.passwordResetCleanupIntervalMs ?? 3600000;

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
  intervalId = setInterval(() => { cleanup().catch(() => {}); }, effectiveIntervalMs);

  return () => {
    if (intervalId) clearInterval(intervalId);
  };
}
