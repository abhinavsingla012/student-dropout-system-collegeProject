import express from 'express';
import { getStudent, getStudents, patchStudent } from '../controllers/studentController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { listStudentsValidator, studentIdParamValidator } from '../validators/studentValidators.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', listStudentsValidator, validateRequest, getStudents);
router.get('/:id', studentIdParamValidator, validateRequest, getStudent);
router.patch('/:id', restrictTo('admin'), studentIdParamValidator, validateRequest, patchStudent);

export default router;
