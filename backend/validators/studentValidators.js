import { param, query } from 'express-validator';

export const listStudentsValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('sort').optional().isString().trim(),
  query('search').optional().isString().trim(),
  query('area').optional().isString().trim(),
  query('economicStatus').optional().isString().trim(),
  query('assignedCounselorId').optional().isInt({ min: 1 }).withMessage('assignedCounselorId must be a positive integer'),
  query('grade').optional().isInt({ min: 1 }).withMessage('grade must be a positive integer'),
  query('attendanceMin').optional().isFloat({ min: 0, max: 100 }).withMessage('attendanceMin must be between 0 and 100'),
  query('attendanceMax').optional().isFloat({ min: 0, max: 100 }).withMessage('attendanceMax must be between 0 and 100'),
  query('gpaMin').optional().isFloat({ min: 0, max: 10 }).withMessage('gpaMin must be between 0 and 10'),
  query('gpaMax').optional().isFloat({ min: 0, max: 10 }).withMessage('gpaMax must be between 0 and 10'),
];

export const studentIdParamValidator = [
  param('id').isInt({ min: 1 }).withMessage('Student id must be a positive integer'),
];
