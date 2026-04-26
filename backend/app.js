import './config/env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import interventionRoutes from './routes/interventionRoutes.js';
import auditLogRoutes from './routes/auditLogRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { protect } from './middleware/authMiddleware.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { notFoundHandler } from './middleware/notFoundMiddleware.js';
import { appConfig } from './config/appConfig.js';

function buildCorsOptions() {
  if (!appConfig.frontendOrigin || appConfig.frontendOrigin === '*') {
    return {};
  }

  const allowedOrigins = new Set(
    appConfig.frontendOrigin
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  );

  for (const origin of Array.from(allowedOrigins)) {
    try {
      const parsed = new URL(origin);
      if (parsed.hostname === 'localhost') {
        allowedOrigins.add(`${parsed.protocol}//127.0.0.1${parsed.port ? `:${parsed.port}` : ''}`);
      }
      if (parsed.hostname === '127.0.0.1') {
        allowedOrigins.add(`${parsed.protocol}//localhost${parsed.port ? `:${parsed.port}` : ''}`);
      }
    } catch {
      // Ignore malformed development origins and keep the configured value only.
    }
  }

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
  };
}

function setApiMode(mode) {
  return (req, _res, next) => {
    req.apiMode = mode;
    next();
  };
}

const authRateLimiter = rateLimit({
  windowMs: appConfig.authRateLimitWindowMs,
  max: appConfig.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    status: 'error',
    error: 'Too many login attempts. Please try again later.',
  },
});

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors(buildCorsOptions()));
  app.use(express.json({ limit: appConfig.jsonLimit }));

  app.use('/api/v1/auth', setApiMode('versioned'), authRateLimiter, authRoutes);
  app.use('/api/auth', setApiMode('legacy'), authRateLimiter, authRoutes);

  app.use('/api/v1/users', setApiMode('versioned'), userRoutes);
  app.use('/api/users', setApiMode('legacy'), userRoutes);

  app.use('/api/v1/students', setApiMode('versioned'), protect, studentRoutes);
  app.use('/api/students', setApiMode('legacy'), protect, studentRoutes);

  app.use('/api/v1/interventions', setApiMode('versioned'), protect, interventionRoutes);
  app.use('/api/interventions', setApiMode('legacy'), protect, interventionRoutes);

  app.use('/api/v1/audit-logs', setApiMode('versioned'), auditLogRoutes);
  app.use('/api/audit-logs', setApiMode('legacy'), auditLogRoutes);

  app.use('/api/v1/notifications', setApiMode('versioned'), notificationRoutes);
  app.use('/api/notifications', setApiMode('legacy'), notificationRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
