import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

// Configure Prisma Client with connection pooling and performance optimizations
export const prisma = new PrismaClient({
  log: env.nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: env.databaseUrl
    }
  }
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Handle connection errors
prisma.$connect()
  .then(() => {
    console.log('Database connected successfully');
  })
  .catch((error) => {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  });