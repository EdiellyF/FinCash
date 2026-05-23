import { getRedisClient } from '../config/redisClient.js';
import { logger } from '../config/logger.js';

/**
 * Middleware de rate limiting por usuário
 * Limite: 5 requisições por minuto por usuário
 */
export function rateLimiter(maxRequests = 5, windowMs = 60000) {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id || req.ip;
      const key = `ratelimit:${userId}`;

      const redis = getRedisClient();
      const current = await redis.incr(key);

      if (current === 1) {
        // Primeira requisição, definir expiração
        await redis.expire(key, Math.ceil(windowMs / 1000));
      }

      if (current > maxRequests) {
        const ttl = await redis.ttl(key);
        logger.warn('Rate limit exceeded', { userId, key, current, maxRequests });
        res.setHeader('Retry-After', ttl);
        return res.status(429).json({
          message: 'Muitas requisições. Tente novamente em breve.',
          retryAfter: ttl,
        });
      }

      // Adicionar headers de rate limit
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - current));
      res.setHeader('X-RateLimit-Reset', ttl);

      next();
    } catch (error) {
      logger.error('Rate limiter error', { error: error.message, userId: req.user?.id });
      // Em caso de erro no Redis, permitir a requisição (fail-open)
      next();
    }
  };
}