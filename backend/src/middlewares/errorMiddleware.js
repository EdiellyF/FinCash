import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  NotFoundError
} from '../utils/errors.js';

/**
 * Enhanced error middleware with detailed error responses
 */
export function errorMiddleware(err, req, res, next) {
  // Log error for debugging
  logger.error('Error occurred', {
    message: err.message,
    statusCode: err.statusCode || 500,
    code: err.code || 'INTERNAL_ERROR',
    path: req.path,
    method: req.method,
    userId: req.user?.id || 'anonymous',
    timestamp: new Date().toISOString()
  });

  // Handle custom application errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      ...(err.details && { details: err.details }),
      ...(env.nodeEnv === 'development' && { stack: err.stack })
    });
  }

  if (err.code === 'INVALID_PDF' || err.statusCode === 400) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Arquivo inválido.',
      code: 'VALIDATION_ERROR',
      ...(env.nodeEnv === 'development' && { stack: err.stack })
    });
  }

  if (err.name === 'MulterError') {
    const multerMessageMap = {
      LIMIT_FILE_SIZE: 'Arquivo PDF muito grande. Envie um arquivo menor que 20MB.',
      LIMIT_UNEXPECTED_FILE: 'Envie apenas um arquivo PDF.',
      LIMIT_FILE_COUNT: 'Só é permitido enviar um arquivo por vez.',
      LIMIT_PART_COUNT: 'Upload inválido.',
      LIMIT_FIELD_KEY: 'Campo de upload inválido.',
      LIMIT_FIELD_VALUE: 'Valor do campo de upload inválido.',
      LIMIT_FIELD_COUNT: 'Muitos campos enviados.'
    };

    return res.status(400).json({
      success: false,
      message: multerMessageMap[err.code] || 'Arquivo inválido.',
      code: 'FILE_UPLOAD_ERROR',
      ...(env.nodeEnv === 'development' && { stack: err.stack })
    });
  }

  // Handle Prisma errors
  if (err.code && err.code.startsWith('P')) {
    return handlePrismaError(err, res);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      code: 'TOKEN_EXPIRED'
    });
  }

  // Handle validation errors (Zod)
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
  }

  // Handle unexpected errors
  return res.status(500).json({
    success: false,
    message: env.nodeEnv === 'development' ? err.message : 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(env.nodeEnv === 'development' && { stack: err.stack })
  });
}

/**
 * Handle Prisma-specific errors
 */
function handlePrismaError(err, res) {
  const prismaErrorMap = {
    P2002: {
      statusCode: 409,
      message: 'A record with this unique field already exists',
      code: 'DUPLICATE_ENTRY'
    },
    P2025: {
      statusCode: 404,
      message: 'Record not found',
      code: 'NOT_FOUND'
    },
    P2003: {
      statusCode: 400,
      message: 'Foreign key constraint failed',
      code: 'FOREIGN_KEY_ERROR'
    },
    P2014: {
      statusCode: 400,
      message: 'The change would violate a required relation',
      code: 'RELATION_ERROR'
    }
  };

  const errorInfo = prismaErrorMap[err.code] || {
    statusCode: 500,
    message: 'Database error',
    code: 'DATABASE_ERROR'
  };

  return res.status(errorInfo.statusCode).json({
    success: false,
    message: errorInfo.message,
    code: errorInfo.code,
    ...(env.nodeEnv === 'development' && {
      details: {
        prismaCode: err.code,
        meta: err.meta
      }
    })
  });
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req, res) {
  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
    ip: req.ip
  });
  
  return res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    code: 'ROUTE_NOT_FOUND'
  });
}