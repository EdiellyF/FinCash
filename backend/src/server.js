import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import jwt from 'jsonwebtoken';

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: env.frontendUrl,
    credentials: true,
  },
});

import { socketAuthMiddleware } from './utils/socketAuth.js';

io.use(socketAuthMiddleware);

global.io = io;
// Start periodic cleanup job for expired/used password reset tokens
import { startPasswordResetTokenCleanup } from './jobs/cleanupPasswordResetTokens.js';
// Start cleanup with configuration from env (startPasswordResetTokenCleanup reads env)
startPasswordResetTokenCleanup();


io.on('connection', (socket) => {
  logger.info(`WebSocket client connected`, { socketId: socket.id, userId: socket.userId });

  socket.on('disconnect', () => {
    logger.info(`WebSocket client disconnected`, { socketId: socket.id, userId: socket.userId });
  });
});

httpServer.listen(env.port, '0.0.0.0', () => {
  logger.info(`Server running on http://0.0.0.0:${env.port}`);
  logger.info(`WebSocket enabled`);
});