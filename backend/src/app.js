import 'dotenv/config';
import 'express-async-errors';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import transactionExtractionRoutes from './routes/transactionExtractionRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import legalRoutes from './routes/legalRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import categorizationRoutes from './routes/categorizationRoutes.js';
import debugRoutes from './routes/debugRoutes.js';
import { errorMiddleware, notFoundHandler } from './middlewares/errorMiddleware.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swaggerConfig.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: env.frontendUrl,
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

app.get('/api/health', (req, res) => res.json({ message: 'API online' }));

// Swagger API Documentation
if (env.nodeEnv !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
} else {
  // Hide Swagger UI in production
  app.get('/api-docs', (req, res) => res.status(404).json({ message: 'Not found' }));
}

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/transactions', transactionExtractionRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/legal', legalRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/categorization', categorizationRoutes);

// Debug routes (only enabled in non-production)
if (env.nodeEnv !== 'production') {
  app.use('/api/debug', debugRoutes);
} else {
  // In production, keep the endpoint hidden
  app.get('/api/debug', (req, res) => res.status(404).json({ message: 'Not found' }));
}

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(errorMiddleware);

export default app;
