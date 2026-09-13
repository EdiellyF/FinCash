import { describe, expect, it, vi } from 'vitest';

vi.mock('../config/db.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn()
    },
    refreshToken: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn()
    }
  }
}));

import authRoutes from '../routes/authRoutes.js';
import { notFoundHandler } from '../middlewares/errorMiddleware.js';

function routePaths(router) {
  return router.stack
    .filter((layer) => layer.route)
    .flatMap((layer) => Object.keys(layer.route.methods).map((method) => `${method.toUpperCase()} ${layer.route.path}`));
}

function createResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

describe('auth routes', () => {
  it('does not expose the old forgot-password email reset route', async () => {
    expect(routePaths(authRoutes)).not.toContain('POST /forgot-password');

    const response = createResponse();
    notFoundHandler({ method: 'POST', path: '/api/auth/forgot-password', ip: '127.0.0.1' }, response);

    expect(response.statusCode).toBe(404);
    expect(response.body.code).toBe('ROUTE_NOT_FOUND');
  });

  it('does not expose the old reset-password email reset route', async () => {
    expect(routePaths(authRoutes)).not.toContain('POST /reset-password');

    const response = createResponse();
    notFoundHandler({ method: 'POST', path: '/api/auth/reset-password', ip: '127.0.0.1' }, response);

    expect(response.statusCode).toBe(404);
    expect(response.body.code).toBe('ROUTE_NOT_FOUND');
  });
});
