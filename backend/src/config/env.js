import 'dotenv/config';

const nodeEnv = process.env.NODE_ENV || 'development';

function sanitizeApiKey(value) {
  if (typeof value !== 'string') return undefined;

  const cleaned = value.trim();
  if (!cleaned) return undefined;

  const placeholderPatterns = [
    /^sua?_/i,
    /^your_/i,
    /^example_/i,
    /^placeholder_/i,
    /_aqui$/i,
    /seu[_-]api[_-]key/i,
    /your[_-]api[_-]key/i
  ];

  const isPlaceholder = placeholderPatterns.some((pattern) => pattern.test(cleaned));
  if (isPlaceholder) {
    return undefined;
  }

  return cleaned;
}

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
  geminiApiKey: sanitizeApiKey(process.env.GEMINI_API_KEY),
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-pro',
  groqApiKey: sanitizeApiKey(process.env.GROQ_API_KEY),
  resendApiKey: sanitizeApiKey(process.env.RESEND_API_KEY),
  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  smtpFrom: process.env.SMTP_FROM,
  // Comma-separated provider priority, e.g. 'groq,gemini'
  aiProviderPriority: process.env.AI_PROVIDER_PRIORITY || 'groq,gemini',

  nodeEnv
};
