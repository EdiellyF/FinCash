import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function socketAuthMiddleware(socket, next) {
  try {
    const token = socket.handshake?.auth?.token;
    if (!token) return next(new Error('Unauthorized'));

    const payload = jwt.verify(token, env.jwtSecret);
    socket.userId = payload.userId;
    return next();
  } catch (err) {
    return next(new Error('Unauthorized'));
  }
}