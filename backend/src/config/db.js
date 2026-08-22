import { PrismaClient } from '@prisma/client';
import { env } from './env.js';
import { logger } from './logger.js';

// Configure Prisma Client with connection pooling and performance optimizations
export const prisma = new PrismaClient({
  log: env.nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: env.databaseUrl
    }
  }
});


process.on('beforeExit', async () => {
  await prisma.$disconnect();
});


prisma.$connect()
  .then(() => {
    logger.info('Database connected successfully');
  })
  .catch((error) => {
    logger.error('Failed to connect to database:', error);
    process.exit(1);
  });