import { getStudentById, listStudents, updateStudent } from '../services/studentService.js';
import { sendSuccess } from '../utils/response.js';

export async function patchStudent(req, res, next) {
  try {
    const student = await updateStudent({
      currentUser: req.user,
      id: Number(req.params.id),
      payload: req.body,
      io: req.app.get('io'),
    });
    return sendSuccess(req, res, { data: student, message: 'student updated successfully' });
  } catch (error) {
    next(error);
  }
}

export async function getStudents(req, res, next) {
  try {
    const { items, meta } = await listStudents({
      currentUser: req.user,
      query: req.query,
      apiMode: req.apiMode,
    });
    return sendSuccess(req, res, { data: items, meta, message: 'students fetched' });
  } catch (error) {
    next(error);
  }
}

export async function getStudent(req, res, next) {
  try {
    const student = await getStudentById({ currentUser: req.user, id: Number(req.params.id) });
    return sendSuccess(req, res, { data: student, message: 'student fetched' });
  } catch (error) {
    next(error);
  }
}
