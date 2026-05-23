import winston from 'winston';
import { env } from './env.js';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

// Tell winston about the colors
winston.addColors(colors);

// Define the format based on NODE_ENV
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define which transports to use
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}${
          info.stack ? '\n' + info.stack : ''
        }${info.userId ? ' (User: ' + info.userId + ')' : ''}${
          info.path ? ' (Path: ' + info.path + ')' : ''
        }`
      )
    )
  }),
  
  // File transport for all logs
  new winston.transports.File({
    filename: 'logs/all.log',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
  
  // File transport for error logs
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  })
];

// Create the logger
export const logger = winston.createLogger({
  level: env.nodeEnv === 'development' ? 'debug' : 'info',
  levels,
  format,
  transports,
  exitOnError: false
});

// Create a stream object for Morgan HTTP logger
export const stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};