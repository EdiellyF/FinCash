import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT || 5000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'change_this_secret',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
};
