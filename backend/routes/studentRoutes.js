import express from 'express';
import { readJSON, STUDENTS_FILE } from '../utils/db.js';
import { AppError } from '../middleware/errorMiddleware.js';

const router = express.Router();

// GET /api/students — all students (optional query filters)
router.get('/', async (req, res, next) => {
  try {
    let students = await readJSON(STUDENTS_FILE);

    // Optional query-string filtering
    const { status, area, search, economicStatus } = req.query;

    if (status && status !== 'all') {
      students = students.filter(s => s.status === status);
    }
    if (area && area !== 'all') {
      students = students.filter(s => s.area === area);
    }
    if (economicStatus && economicStatus !== 'all') {
      students = students.filter(s => s.economicStatus === economicStatus);
    }
    if (search) {
      const q = search.toLowerCase();
      students = students.filter(s => s.name.toLowerCase().includes(q));
    }

    res.json(students);
  } catch (error) {
    next(error);
  }
});

// GET /api/students/:id — single student
router.get('/:id', async (req, res, next) => {
  try {
    const students = await readJSON(STUDENTS_FILE);
    const student  = students.find(s => s.id === Number(req.params.id));

    if (!student) {
      throw new AppError('Student not found', 404);
    }

    res.json(student);
  } catch (error) {
    next(error);
  }
});

export default router;
