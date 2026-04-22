import jwt from 'jsonwebtoken';
import { AppError } from './errorMiddleware.js';
import { User } from '../models/User.js';
import { appConfig } from '../config/appConfig.js';

const JWT_SECRET = appConfig.jwtSecret;
const JWT_EXPIRES_IN = appConfig.jwtExpiresIn;

export const extractBearerToken = (authorizationHeader) => {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return null;
  }
  return authorizationHeader.split(' ')[1];
};

export const verifyAuthToken = (token) => jwt.verify(token, JWT_SECRET);

export const protect = async (req, res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      throw new AppError('You are not logged in! Please log in to get access.', 401);
    }

    const decoded = verifyAuthToken(token);
    const currentUser = await User.findOne({ id: decoded.id }).lean();

    if (!currentUser) {
      throw new AppError('The user belonging to this token no longer exists.', 401);
    }

    req.user = currentUser;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
    return next(new AppError('Authentication service unavailable.', 500));
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

export const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};
