import jwt from 'jsonwebtoken';
import { readJSON, USERS_FILE } from '../utils/db.js';
import { AppError } from './errorMiddleware.js';

const JWT_SECRET = 'your_super_secret_sdas_key_123'; // Unit III: Use environment variables in production

export const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('You are not logged in! Please log in to get access.', 401);
    }

    // 2. Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // 3. Check if user still exists
    const users = await readJSON(USERS_FILE);
    const currentUser = users.find(u => u.id === decoded.id);

    if (!currentUser) {
      throw new AppError('The user belonging to this token no longer exists.', 401);
    }

    // 4. Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    next(new AppError('Invalid token. Please log in again.', 401));
  }
};

export const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};
