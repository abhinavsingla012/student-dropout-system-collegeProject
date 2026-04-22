import { logError } from '../utils/logger.js';

// Error handling middleware (Unit II: Error Handling)
export const errorHandler = (err, req, res, next) => {
  logError('Unhandled request error', {
    method: req.method,
    path: req.originalUrl,
    statusCode: err.statusCode || 500,
    message: err.message
  });

  const statusCode = err.statusCode || 500;
  const message    = err.message    || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

// Helper to create errors with status codes
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}
