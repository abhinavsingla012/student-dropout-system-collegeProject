import { User } from '../models/User.js';
import { Student } from '../models/Student.js';
import { AppError } from '../middleware/errorMiddleware.js';
import { logInfo } from '../utils/logger.js';
import { logAuditEvent } from './auditLogService.js';

export async function listStaff() {
  return User.find({ role: 'counselor' }).select('id name email').lean();
}

export async function assignStudentToCounselor({ currentUser, studentId, counselorId, io }) {
  const parsedStudentId = Number(studentId);
  const parsedCounselorId = counselorId ? Number(counselorId) : null;

  const student = await Student.findOne({ id: parsedStudentId });
  if (!student) {
    throw new AppError('Student not found', 404);
  }

  const previousCounselorId = student.assignedCounselorId ?? null;
  if (previousCounselorId === parsedCounselorId) {
    throw new AppError('Student is already assigned to this counselor', 400);
  }

  let counselor = null;
  if (parsedCounselorId !== null) {
    counselor = await User.findOne({ id: parsedCounselorId, role: 'counselor' });
    if (!counselor) {
      throw new AppError('Counselor not found', 404);
    }
  }

  student.assignedCounselor = counselor?._id || null;
  student.assignedCounselorId = counselor?.id || null;
  await student.save();

  if (io && counselor) {
    io.to(`counselor:${counselor.id}`).emit('student_assigned', {
      studentId: student.id,
      studentName: student.name,
      counselorId: counselor.id,
      counselorName: counselor.name,
      assignedBy: currentUser.id,
      at: new Date().toISOString(),
    });
  }
  if (io && previousCounselorId && previousCounselorId !== parsedCounselorId) {
    io.to(`counselor:${previousCounselorId}`).emit('student_unassigned', {
      studentId: student.id,
      studentName: student.name,
      counselorId: previousCounselorId,
      updatedBy: currentUser.id,
      at: new Date().toISOString(),
    });
  }

  logInfo('Student assignment updated', {
    studentId: student.id,
    counselorId: parsedCounselorId,
    assignedBy: currentUser.id,
  });

  await logAuditEvent({
    actor: currentUser,
    action: 'STUDENT_ASSIGNMENT_UPDATED',
    entityType: 'student',
    entityId: student.id,
    metadata: {
      previousCounselorId,
      nextCounselorId: parsedCounselorId,
    },
  });

  return {
    previousCounselorId,
    student: student.toJSON(),
  };
}
