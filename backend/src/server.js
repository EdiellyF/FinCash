import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: env.frontendUrl,
    credentials: true,
  },
});

// Tornar io disponível globalmente para uso em controllers
global.io = io;

io.on('connection', (socket) => {
  logger.info(`WebSocket client connected`, { socketId: socket.id });

  socket.on('disconnect', () => {
    logger.info(`WebSocket client disconnected`, { socketId: socket.id });
  });
});

const port = process.env.PORT || env.port || 5000;

httpServer.listen(port, '0.0.0.0', () => {
  logger.info(`Server running on http://0.0.0.0:${port}`);
  logger.info(`WebSocket enabled`);
});
