import express from 'express';
import { getStudent, getStudents } from '../controllers/studentController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { listStudentsValidator, studentIdParamValidator } from '../validators/studentValidators.js';

const router = express.Router();

router.get('/', listStudentsValidator, validateRequest, getStudents);
router.get('/:id', studentIdParamValidator, validateRequest, getStudent);

export default router;
