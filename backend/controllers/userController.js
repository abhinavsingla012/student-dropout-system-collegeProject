import { assignStudentToCounselor, listStaff } from '../services/userService.js';
import { sendSuccess } from '../utils/response.js';

export async function getStaff(req, res, next) {
  try {
    const staff = await listStaff();
    return sendSuccess(req, res, { data: staff, message: 'staff fetched' });
  } catch (error) {
    next(error);
  }
}

export async function assignStudent(req, res, next) {
  try {
    const result = await assignStudentToCounselor({
      currentUser: req.user,
      studentId: req.body.studentId,
      counselorId: req.body.counselorId,
      io: req.app.get('io'),
    });

    if (req.apiMode === 'versioned') {
      return sendSuccess(req, res, {
        data: {
          previousCounselorId: result.previousCounselorId,
          student: result.student,
        },
        message: 'assignment updated successfully',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Assignment updated successfully',
      previousCounselorId: result.previousCounselorId,
      student: result.student,
    });
  } catch (error) {
    next(error);
  }
}
