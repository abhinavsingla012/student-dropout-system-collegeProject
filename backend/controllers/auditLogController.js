import { listAuditLogs } from '../services/auditLogService.js';
import { sendSuccess } from '../utils/response.js';

export async function getAuditLogs(req, res, next) {
  try {
    const { items, meta } = await listAuditLogs(req.query);
    return sendSuccess(req, res, { data: items, meta, message: 'audit logs fetched' });
  } catch (error) {
    next(error);
  }
}
