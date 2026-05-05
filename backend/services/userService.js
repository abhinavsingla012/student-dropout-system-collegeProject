import { User } from '../models/User.js';
import { Student } from '../models/Student.js';
import { AppError } from '../middleware/errorMiddleware.js';
import { logInfo } from '../utils/logger.js';
import { logAuditEvent } from './auditLogService.js';
import { Notification } from '../models/Notification.js';
import { Counter, getNextSequence } from '../models/Counter.js';

export async function createStaff({ currentUser, payload }) {
  const { name, email, password, role = 'counselor' } = payload;

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('A user with this email already exists', 400);
  }

  // Ensure counter is synced with the highest existing user ID
  const maxUser = await User.findOne().sort({ id: -1 }).select('id').lean();
  const maxId = maxUser?.id ?? 0;
  await Counter.findOneAndUpdate(
    { key: 'user_id', value: { $lt: maxId } },
    { $set: { value: maxId } },
    { upsert: true }
  );

  // Get next numeric ID (now guaranteed to be above all existing IDs)
  const id = await getNextSequence('user_id');

  // Create user (Password will be hashed by Mongoose pre-save hook)
  const newUser = await User.create({
    id,
    name,
    email,
    password, 
    role,
  });

  await logAuditEvent({
    actor: currentUser,
    action: 'USER_CREATED',
    entityType: 'user',
    entityId: id,
    metadata: { email, role },
  });

  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
  };
}

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

  if (counselor) {
    const notification = await Notification.create({
      recipient: counselor._id,
      sender: currentUser?._id || null,
      type: 'ASSIGNMENT',
      title: 'New Student Assigned',
      message: `${student.name} has been added to your roster.`,
      data: { studentId: student.id },
    });
    
    if (io) {
      io.to(`user:${counselor.id}`).emit('notification_received', notification);
      io.to(`counselor:${counselor.id}`).emit('student_assigned', {
        studentId: student.id,
        studentName: student.name,
        counselorId: counselor.id,
        counselorName: counselor.name,
        assignedBy: currentUser.id,
        at: new Date().toISOString(),
      });
    }
  }

  if (previousCounselorId && previousCounselorId !== parsedCounselorId) {
    // Also notify old counselor of removal
    const oldCounselor = await User.findOne({ id: previousCounselorId });
    if (oldCounselor) {
      const removalNote = await Notification.create({
        recipient: oldCounselor._id,
        sender: currentUser?._id || null,
        type: 'ASSIGNMENT',
        title: 'Student Reassigned',
        message: `${student.name} was moved off your roster.`,
        data: { studentId: student.id },
      });
      if (io) {
        io.to(`user:${oldCounselor.id}`).emit('notification_received', removalNote);
      }
    }

    if (io) {
      io.to(`counselor:${previousCounselorId}`).emit('student_unassigned', {
        studentId: student.id,
        studentName: student.name,
        counselorId: previousCounselorId,
        updatedBy: currentUser.id,
        at: new Date().toISOString(),
      });
    }
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
