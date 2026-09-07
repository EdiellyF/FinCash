import { logger } from '../config/logger.js';

// Store simples em memória para rate limiting
const rateLimitStore = new Map();

/**
 * Middleware de rate limiting por usuário
 * Limite: 5 requisições por minuto por usuário
 */
export function rateLimiter(maxRequests = 5, windowMs = 60000) {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id || req.ip;
      const key = `ratelimit:${userId}`;
      const now = Date.now();

      // Limpar entradas expiradas
      cleanExpiredEntries(now);

      // Obter ou criar entrada para este usuário
      let entry = rateLimitStore.get(key);
      if (!entry) {
        entry = { count: 0, resetTime: now + windowMs };
        rateLimitStore.set(key, entry);
      }

      // Verificar se a janela de tempo expirou
      if (now > entry.resetTime) {
        entry.count = 0;
        entry.resetTime = now + windowMs;
      }

      // Incrementar contador
      entry.count++;

      // Verificar se excedeu o limite
      if (entry.count > maxRequests) {
        const ttl = Math.ceil((entry.resetTime - now) / 1000);
        logger.warn('Rate limit exceeded', { userId, key, current: entry.count, maxRequests });
        res.setHeader('Retry-After', ttl);
        return res.status(429).json({
          message: 'Muitas requisições. Tente novamente em breve.',
          retryAfter: ttl,
        });
      }

      // Adicionar headers de rate limit
      const ttl = Math.ceil((entry.resetTime - now) / 1000);
      const remaining = Math.max(0, maxRequests - entry.count);
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', ttl);

      next();
    } catch (error) {
      logger.error('Rate limiter error', { error: error.message, userId: req.user?.id });
     
      next();
    }
  };
}

/**
 * Limpa entradas expiradas do store em memória
 */
function cleanExpiredEntries(now) {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}