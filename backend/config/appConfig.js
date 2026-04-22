export const appConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sdas',
  jwtSecret: process.env.JWT_SECRET || 'dev_only_super_secret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  authRateLimitWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  jsonLimit: process.env.JSON_LIMIT || '1mb',
};
