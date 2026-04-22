import { body, param, query } from 'express-validator';

export const listInterventionsValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('sort').optional().isString().trim(),
  query('studentId').optional().isInt({ min: 1 }).withMessage('studentId must be a positive integer'),
  query('createdById').optional().isInt({ min: 1 }).withMessage('createdById must be a positive integer'),
  query('type').optional().isString().trim(),
];

export const createInterventionValidator = [
  body('studentId').isInt({ min: 1 }).withMessage('Student ID must be a positive integer'),
  body('type').trim().notEmpty().withMessage('Intervention type is required'),
  body('note')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Note must be between 10 and 2000 characters'),
  body('studentName')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('studentName must be a valid string'),
];

export const interventionIdParamValidator = [
  param('id').isInt({ min: 1 }).withMessage('Intervention id must be a positive integer'),
];
