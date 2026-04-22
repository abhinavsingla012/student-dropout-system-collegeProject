import { body } from 'express-validator';

export const assignStudentValidator = [
  body('studentId').isInt({ min: 1 }).withMessage('studentId must be a positive integer'),
  body('counselorId')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 })
    .withMessage('counselorId must be a positive integer'),
];
