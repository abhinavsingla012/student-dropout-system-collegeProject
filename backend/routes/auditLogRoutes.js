import express from 'express';
import { getAuditLogs } from '../controllers/auditLogController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { listAuditLogsValidator } from '../validators/auditLogValidators.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('admin'));

router.get('/', listAuditLogsValidator, validateRequest, getAuditLogs);

export default router;
