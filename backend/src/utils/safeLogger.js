import { logger } from '../config/logger.js';

export function logSanitizedError(message, error, meta = {}) {
  // Ensure we never log full error objects that may contain secrets
  const payload = {
    error: error?.message || String(error),
    stack: error?.stack,
    ...meta
  };
  logger.error(message, payload);
}

export function logSanitizedWarn(message, error, meta = {}) {
  const payload = {
    error: error?.message || String(error),
    stack: error?.stack,
    ...meta
  };
  logger.warn(message, payload);
}