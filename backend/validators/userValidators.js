import { body } from 'express-validator';

export const assignStudentValidator = [
  body('studentId').isInt({ min: 1 }).withMessage('studentId must be a positive integer'),
  body('counselorId')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 })
    .withMessage('counselorId must be a positive integer'),
];

export const createStaffValidator = [
  body('name').notEmpty().trim().withMessage('Full name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid institutional email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('role').optional().isIn(['admin', 'counselor']).withMessage('Invalid role specified'),
];
