import { Student } from '../models/Student.js';
import { AppError } from '../middleware/errorMiddleware.js';
import { buildPaginationMeta, parseListOptions } from '../utils/queryBuilder.js';
import { Notification } from '../models/Notification.js';
import { logInfo } from '../utils/logger.js';

// ... existing sort fields ...

export async function updateStudent({ currentUser, id, payload, io }) {
  const student = await Student.findOne({ id });
  if (!student) {
    throw new AppError('Student not found', 404);
  }

  // Check if attendance/GPA dropped below 50% (The "Risk Trigger")
  const oldAttendance = student.attendance;
  const oldGpa = student.gpa;
  
  // Apply updates
  if (payload.attendance !== undefined) student.attendance = Number(payload.attendance);
  if (payload.gpa !== undefined) student.gpa = Number(payload.gpa);
  if (payload.grade !== undefined) student.grade = Number(payload.grade);
  
  await student.save();

  // Logic: Trigger notification if it crossed the "halfway" mark downward
  const isNowCritical = student.attendance < 50 || student.gpa < 5.0;
  const wasPreviouslyCritical = oldAttendance < 50 || oldGpa < 5.0;

  if (isNowCritical && !wasPreviouslyCritical && student.assignedCounselor) {
    const alert = await Notification.create({
      recipient: student.assignedCounselor,
      type: 'RISK_ALERT',
      title: 'CRITICAL: High Risk Alert',
      message: `${student.name} has dropped below the 50% threshold (Attendance: ${student.attendance}%, GPA: ${student.gpa}). Immediate intervention recommended.`,
      data: { studentId: student.id },
    });

    if (io) {
      io.to(`user:${student.assignedCounselorId}`).emit('notification_received', alert);
    }
    
    logInfo('Risk alert triggered', { studentId: student.id, counselorId: student.assignedCounselorId });
  }

  return student.toJSON();
}

const STUDENT_SORT_FIELDS = new Set([
  'id',
  'name',
  'grade',
  'attendance',
  'gpa',
  'area',
  'economicStatus',
  'assignedCounselorId',
  'createdAt',
  'updatedAt',
]);

export async function listStudents({ currentUser, query, apiMode = 'legacy' }) {
  const filters = {};
  const options = parseListOptions(query, STUDENT_SORT_FIELDS, 'id');
  const shouldDisablePagination = apiMode === 'legacy' && !query.page && !query.limit;

  if (currentUser?.role === 'counselor') {
    filters.assignedCounselor = currentUser._id;
  }
  if (query.area && query.area !== 'all') filters.area = String(query.area);
  if (query.economicStatus && query.economicStatus !== 'all') filters.economicStatus = String(query.economicStatus);
  if (query.assignedCounselorId && query.assignedCounselorId !== 'all') filters.assignedCounselorId = Number(query.assignedCounselorId);
  if (query.grade) filters.grade = Number(query.grade);
  if (query.search) filters.name = { $regex: String(query.search), $options: 'i' };
  if (query.attendanceMin || query.attendanceMax) {
    filters.attendance = {};
    if (query.attendanceMin) filters.attendance.$gte = Number(query.attendanceMin);
    if (query.attendanceMax) filters.attendance.$lte = Number(query.attendanceMax);
  }
  if (query.gpaMin || query.gpaMax) {
    filters.gpa = {};
    if (query.gpaMin) filters.gpa.$gte = Number(query.gpaMin);
    if (query.gpaMax) filters.gpa.$lte = Number(query.gpaMax);
  }

  const [items, total] = await Promise.all([
    Student.find(filters)
      .sort(options.sort)
      .skip(shouldDisablePagination ? 0 : options.skip)
      .limit(shouldDisablePagination ? 1000 : options.limit)
      .lean(),
    Student.countDocuments(filters),
  ]);

  return {
    items,
    meta: buildPaginationMeta(total, options),
  };
}

export async function getStudentById({ currentUser, id }) {
  const student = await Student.findOne({ id }).lean();

  if (!student) {
    throw new AppError('Student not found', 404);
  }
  if (currentUser?.role === 'counselor' && String(student.assignedCounselor) !== String(currentUser._id)) {
    throw new AppError('You are not authorized to access this student', 403);
  }

  return student;
}
