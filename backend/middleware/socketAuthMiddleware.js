import { extractBearerToken, verifyAuthToken } from './authMiddleware.js';
import { User } from '../models/User.js';

export const socketAuthMiddleware = async (socket, next) => {
  try {
    const authHeader = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
    const token = extractBearerToken(authHeader) || authHeader;

    if (!token) {
      return next(new Error('Authentication token missing.'));
    }

    const decoded = verifyAuthToken(token);
    const currentUser = await User.findOne({ id: decoded.id }).lean();

    if (!currentUser) {
      return next(new Error('User no longer exists.'));
    }

    socket.user = {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    };
    next();
  } catch (error) {
    next(new Error('Socket authentication failed.'));
  }
};
