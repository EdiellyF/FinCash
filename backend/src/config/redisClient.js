import Redis from 'ioredis';
import { env } from './env.js';

let redisClient = null;

/**
 * Obtém ou cria a conexão com Redis
 */
export function getRedisClient() {
  if (!redisClient) {
    const redisUrl = env.redisUrl || 'redis://localhost:6379';
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redisClient.on('error', (err) => {
      console.error('[Redis] Erro de conexão:', err.message);
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Conectado com sucesso');
    });
  }

  return redisClient;
}

/**
 * Fecha a conexão com Redis
 */
export async function closeRedisClient() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

/**
 * Gera chave de cache baseada em parâmetros
 */
export function generateCacheKey(userId, messageHash, period = '30d') {
  return `fincash:ai:${userId}:${period}:${messageHash}`;
}

/**
 * Obtém resposta do cache
 */
export async function getCachedResponse(key) {
  try {
    const client = getRedisClient();
    const cached = await client.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('[Redis] Erro ao obter cache:', error.message);
    return null;
  }
}

/**
 * Salva resposta no cache
 */
export async function setCachedResponse(key, response, ttl = 3600) {
  try {
    const client = getRedisClient();
    await client.setex(key, ttl, JSON.stringify(response));
    return true;
  } catch (error) {
    console.error('[Redis] Erro ao salvar cache:', error.message);
    return false;
  }
}

/**
 * Remove entrada do cache
 */
export async function deleteCachedResponse(key) {
  try {
    const client = getRedisClient();
    await client.del(key);
    return true;
  } catch (error) {
    console.error('[Redis] Erro ao deletar cache:', error.message);
    return false;
  }
}

/**
 * Limpa todo o cache de um usuário
 */
export async function clearUserCache(userId) {
  try {
    const client = getRedisClient();
    const pattern = `fincash:ai:${userId}:*`;
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
    return keys.length;
  } catch (error) {
    console.error('[Redis] Erro ao limpar cache do usuário:', error.message);
    return 0;
  }
}
