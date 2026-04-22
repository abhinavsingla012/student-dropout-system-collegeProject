import { AuditLog } from '../models/AuditLog.js';
import { buildPaginationMeta, parseListOptions } from '../utils/queryBuilder.js';

const AUDIT_SORT_FIELDS = new Set(['createdAt', 'updatedAt', 'action', 'entityType', 'status', 'actorId']);

export async function logAuditEvent({
  actor = null,
  action,
  entityType,
  entityId = null,
  status = 'success',
  metadata = {},
}) {
  await AuditLog.create({
    actor: actor?._id || null,
    actorId: actor?.id || null,
    actorName: actor?.name || null,
    actorRole: actor?.role || null,
    action,
    entityType,
    entityId: entityId === null || entityId === undefined ? null : String(entityId),
    status,
    metadata,
  });
}

export async function listAuditLogs(query) {
  const options = parseListOptions(query, AUDIT_SORT_FIELDS, '-createdAt');
  const filters = {};

  if (query.action) filters.action = String(query.action);
  if (query.entityType) filters.entityType = String(query.entityType);
  if (query.status) filters.status = String(query.status);
  if (query.actorId) filters.actorId = Number(query.actorId);

  const [items, total] = await Promise.all([
    AuditLog.find(filters)
      .sort(options.sort)
      .skip(options.skip)
      .limit(options.limit)
      .lean(),
    AuditLog.countDocuments(filters),
  ]);

  return {
    items,
    meta: buildPaginationMeta(total, options),
  };
}
