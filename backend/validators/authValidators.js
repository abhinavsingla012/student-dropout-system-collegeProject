import { body } from 'express-validator';

export const loginValidator = [
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').isString().isLength({ min: 6 }).withMessage('Password is required'),
];
