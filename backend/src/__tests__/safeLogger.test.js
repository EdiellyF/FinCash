import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '../config/logger.js';
import { logSanitizedError } from '../utils/safeLogger.js';

describe('safeLogger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does not leak headers or config when logging errors', () => {
    const spy = vi.spyOn(logger, 'error').mockImplementation(() => {});

    const err = new Error('Provider failed');
    // Attach sensitive-like structure
    err.config = { headers: { Authorization: 'SECRET_KEY' } };

    logSanitizedError('Test error', err, { userId: 'u1' });

    expect(spy).toHaveBeenCalled();
    const payload = spy.mock.calls[0][1];
    expect(payload.error).toBe('Provider failed');
    expect(payload.stack).toBeDefined();
    // sensitive fields must not be present
    expect(payload.config).toBeUndefined();
    expect(payload.headers).toBeUndefined();
    expect(JSON.stringify(payload)).not.toContain('SECRET_KEY');
  });
});