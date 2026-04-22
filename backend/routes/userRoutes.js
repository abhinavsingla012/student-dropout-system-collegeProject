import express from 'express';
import { assignStudent, getStaff } from '../controllers/userController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { assignStudentValidator } from '../validators/userValidators.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('admin'));

router.get('/staff', getStaff);
router.patch('/assign', assignStudentValidator, validateRequest, assignStudent);

export default router;
