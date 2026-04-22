import { Student } from '../models/Student.js';
import { AppError } from '../middleware/errorMiddleware.js';
import { buildPaginationMeta, parseListOptions } from '../utils/queryBuilder.js';

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
