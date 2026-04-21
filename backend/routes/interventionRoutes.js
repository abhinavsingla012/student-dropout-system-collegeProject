import express from 'express';
import { body, validationResult } from 'express-validator';
import { readJSON, writeJSON, INTERVENTIONS_FILE } from '../utils/db.js';
import { AppError } from '../middleware/errorMiddleware.js';

const router = express.Router();

// GET /api/interventions — all interventions (newest first)
router.get('/', async (req, res, next) => {
  try {
    let interventions = await readJSON(INTERVENTIONS_FILE);

    const { studentId } = req.query;
    if (studentId) {
      interventions = interventions.filter(
        i => i.studentId === Number(studentId)
      );
    }

    interventions.sort((a, b) => b.id - a.id);
    res.json(interventions);
  } catch (error) {
    next(error);
  }
});

// POST /api/interventions — create new intervention (with Validation)
router.post(
  '/',
  [
    body('studentId').isNumeric().withMessage('Student ID must be a number'),
    body('type').notEmpty().withMessage('Intervention type is required'),
    body('note').isLength({ min: 10 }).withMessage('Note must be at least 10 characters long'),
  ],
  async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { studentId, studentName, type, note } = req.body;
      const interventions = await readJSON(INTERVENTIONS_FILE);

      const newIntervention = {
        id: Date.now(),
        studentId: Number(studentId),
        studentName: studentName || '',
        type,
        note,
        date: new Date().toLocaleDateString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric'
        }),
      };

      interventions.push(newIntervention);
      await writeJSON(INTERVENTIONS_FILE, interventions);

      res.status(201).json(newIntervention);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/interventions/:id — delete an intervention
router.delete('/:id', async (req, res, next) => {
  try {
    let interventions = await readJSON(INTERVENTIONS_FILE);
    const id    = Number(req.params.id);
    const index = interventions.findIndex(i => i.id === id);

    if (index === -1) {
      throw new AppError('Intervention not found', 404);
    }

    interventions.splice(index, 1);
    await writeJSON(INTERVENTIONS_FILE, interventions);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
