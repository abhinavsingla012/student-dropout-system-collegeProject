import { validationResult } from 'express-validator';
import { AppError } from './errorMiddleware.js';

export function validateRequest(req, _res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array().map((item) => item.msg).join(', '), 400));
  }
  return next();
}
