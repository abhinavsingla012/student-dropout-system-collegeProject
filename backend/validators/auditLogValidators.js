import { query } from 'express-validator';

export const listAuditLogsValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('sort').optional().isString().trim(),
  query('action').optional().isString().trim(),
  query('entityType').optional().isString().trim(),
  query('status').optional().isIn(['success', 'failure']).withMessage('status must be success or failure'),
  query('actorId').optional().isInt({ min: 1 }).withMessage('actorId must be a positive integer'),
];
