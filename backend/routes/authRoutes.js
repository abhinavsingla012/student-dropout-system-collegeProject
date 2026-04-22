import express from 'express';
import bcrypt from 'bcryptjs';
import { readJSON, USERS_FILE } from '../utils/db.js';
import { generateToken } from '../middleware/authMiddleware.js';
import { AppError } from '../middleware/errorMiddleware.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Please provide email and password', 400);
    }

    // 1. Find user
    const users = await readJSON(USERS_FILE);
    const user = users.find(u => u.email === email);

    // 2. Check if user exists and password is correct
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError('Incorrect email or password', 401);
    }

    // 3. Generate Token
    const token = generateToken(user.id);

    // 4. Send response
    res.status(200).json({
      status: 'success',
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
