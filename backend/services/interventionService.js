import { Intervention } from '../models/Intervention.js';
import { Student } from '../models/Student.js';
import { AppError } from '../middleware/errorMiddleware.js';
import { buildPaginationMeta, parseListOptions } from '../utils/queryBuilder.js';
import { logInfo } from '../utils/logger.js';
import { logAuditEvent } from './auditLogService.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';

const INTERVENTION_SORT_FIELDS = new Set([
  'id',
  'studentId',
  'type',
  'createdById',
  'createdAt',
  'updatedAt',
  'date',
]);

export async function listInterventions({ currentUser, query, apiMode = 'legacy' }) {
  const filters = {};
  const options = parseListOptions(query, INTERVENTION_SORT_FIELDS, '-id');
  const shouldDisablePagination = apiMode === 'legacy' && !query.page && !query.limit;

  if (query.studentId) filters.studentId = Number(query.studentId);
  if (query.type) filters.type = String(query.type);
  if (query.createdById) filters.createdById = Number(query.createdById);

  if (currentUser?.role === 'counselor') {
    const allowedStudentIds = await Student.find({ assignedCounselor: currentUser._id }).distinct('id');
    filters.studentId = filters.studentId
      ? allowedStudentIds.includes(filters.studentId) ? filters.studentId : -1
      : { $in: allowedStudentIds };
  }

  const [items, total] = await Promise.all([
    Intervention.find(filters)
      .sort(options.sort)
      .skip(shouldDisablePagination ? 0 : options.skip)
      .limit(shouldDisablePagination ? 1000 : options.limit)
      .lean(),
    Intervention.countDocuments(filters),
  ]);

  return {
    items,
    meta: buildPaginationMeta(total, options),
  };
}

export async function createIntervention({ currentUser, payload, io }) {
  const parsedStudentId = Number(payload.studentId);
  const student = await Student.findOne({ id: parsedStudentId });

  if (!student) {
    throw new AppError('Student not found', 404);
  }
  if (currentUser?.role === 'counselor' && String(student.assignedCounselor) !== String(currentUser._id)) {
    throw new AppError('You are not authorized to log interventions for this student', 403);
  }

  const newIntervention = await Intervention.create({
    student: student._id,
    studentId: parsedStudentId,
    studentName: payload.studentName || student.name,
    createdBy: currentUser?._id || null,
    createdById: currentUser?.id || null,
    createdByName: currentUser?.name || null,
    type: payload.type.trim(),
    note: payload.note.trim(),
    date: new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
  });

  student.interventions.push(newIntervention._id);
  await student.save();

  const interventionPayload = newIntervention.toJSON();

  // Notify Admins
  const admins = await User.find({ role: 'admin' });
  const adminNotifications = await Promise.all(
    admins.map((admin) =>
      Notification.create({
        recipient: admin._id,
        sender: currentUser?._id || null,
        type: 'INTERVENTION',
        title: 'New Intervention Logged',
        message: `${currentUser?.name || 'A counselor'} logged a ${interventionPayload.type} for ${interventionPayload.studentName}.`,
        data: {
          studentId: interventionPayload.studentId,
          interventionId: interventionPayload.id,
        },
      })
    )
  );

  if (io) {
    const socketPayload = {
      ...interventionPayload,
      createdBy: currentUser?.id || null,
      at: new Date().toISOString(),
    };

    // Live update for notifications
    adminNotifications.forEach((note, idx) => {
      io.to(`user:${admins[idx].id}`).emit('notification_received', note);
    });

    if (student.assignedCounselorId) {
      io.to(`counselor:${student.assignedCounselorId}`).emit('intervention_logged', socketPayload);
    }
    io.to('role:admin').emit('intervention_logged', socketPayload);
  }

  logInfo('Intervention logged', {
    interventionId: interventionPayload.id,
    studentId: interventionPayload.studentId,
    createdBy: currentUser?.id,
  });

  await logAuditEvent({
    actor: currentUser,
    action: 'INTERVENTION_CREATED',
    entityType: 'intervention',
    entityId: interventionPayload.id,
    metadata: {
      studentId: interventionPayload.studentId,
      studentName: interventionPayload.studentName,
      type: interventionPayload.type,
    },
  });

  return interventionPayload;
}

export async function deleteIntervention({ currentUser, id }) {
  const deleted = await Intervention.findOneAndDelete({ id });
  if (!deleted) {
    throw new AppError('Intervention not found', 404);
  }

  await Student.updateOne({ _id: deleted.student }, { $pull: { interventions: deleted._id } });

  await logAuditEvent({
    actor: currentUser,
    action: 'INTERVENTION_DELETED',
    entityType: 'intervention',
    entityId: id,
    metadata: {
      studentId: deleted.studentId,
      studentName: deleted.studentName,
      type: deleted.type,
    },
  });
}
