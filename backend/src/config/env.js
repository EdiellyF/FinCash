import 'dotenv/config';

const nodeEnv = process.env.NODE_ENV || 'development';


if (nodeEnv === 'production' && !process.env.JWT_SECRET) {
  throw new Error('Missing required environment variable: JWT_SECRET (required in production)');
}

if (nodeEnv === 'production' && !process.env.JWT_REFRESH_SECRET) {
  throw new Error('Missing required environment variable: JWT_REFRESH_SECRET (required in production)');
}

export const env = {
  port: Number(process.env.PORT || 5000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'dev_only_secret_do_not_use_in_production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_only_refresh_secret_do_not_use_in_production',
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTokenDays: Number(process.env.REFRESH_TOKEN_DAYS || 7),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  frontendOrigins: (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  geminiApiKey: process.env.GEMINI_API_KEY,
  groqApiKey: process.env.GROQ_API_KEY,
  resendApiKey: process.env.RESEND_API_KEY,
  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  smtpFrom: process.env.SMTP_FROM,
  ollamaApiUrl: process.env.OLLAMA_API_URL || 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'llama3.2',
  // Comma-separated provider priority, e.g. 'groq,gemini,ollama'
  aiProviderPriority: process.env.AI_PROVIDER_PRIORITY || 'groq,gemini,ollama',
  
  nodeEnv
};
