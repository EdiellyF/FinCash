import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { socketAuthMiddleware } from '../utils/socketAuth.js';

describe('socketAuthMiddleware', () => {
  it('rejects connection without token', () => {
    const socket = { handshake: {} };
    const next = vi.fn();

    socketAuthMiddleware(socket, next);

    expect(next).toHaveBeenCalled();
    const arg = next.mock.calls[0][0];
    expect(arg).toBeInstanceOf(Error);
  });

  it('accepts valid token and sets socket.userId', () => {
    const payload = { userId: 'u123' };
    const token = jwt.sign(payload, env.jwtSecret);
    const socket = { handshake: { auth: { token } } };
    const next = vi.fn();

    socketAuthMiddleware(socket, next);

    expect(next).toHaveBeenCalledWith();
    expect(socket.userId).toBe('u123');
  });
});

// Test chatController check for socket ownership
vi.mock('@prisma/client', () => {
  return {
    PrismaClient: function() {
      return {
        chatMessage: {
          findMany: async () => [],
          create: async () => ({ id: 'm1', createdAt: new Date() })
        },
        transaction: { findMany: async () => [] },
        goal: { findMany: async () => [] },
        budget: { findMany: async () => [] },
        $transaction: async (fn) => ({})
      };
    }
  };
});

import * as chatController from '../controllers/chatController.js';

describe('chatController sendMessageStream socket authorization', () => {
  it('returns 403 if socket does not belong to requesting user', async () => {
    const req = { user: { id: 'userA' }, body: { message: 'hi', socketId: 'sock1' } };
    const res = { status: vi.fn(() => res), json: vi.fn() };

    // mock global.io
    global.io = { sockets: { sockets: new Map([['sock1', { id: 'sock1', userId: 'otherUser' }]]) } };

    await chatController.sendMessageStream(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Não autorizado.' });
  });
});