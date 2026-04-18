// ─────────────────────────────────────────────
// Express API Server — Student Dropout Analysis System
// ─────────────────────────────────────────────
import express from 'express';
import cors    from 'cors';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const app  = express();
const PORT = 3000;

// ── Middleware ──
app.use(cors());
app.use(express.json());

// ── Data file paths ──
const STUDENTS_FILE      = join(__dirname, 'data', 'students.json');
const INTERVENTIONS_FILE = join(__dirname, 'data', 'interventions.json');

// ── Helper: read / write JSON ──
function readJSON(filePath) {
  try {
    const raw = readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeJSON(filePath, data) {
  writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ═══════════════════════════════════════════════
//  STUDENTS
// ═══════════════════════════════════════════════

// GET /api/students — all students (optional query filters)
app.get('/api/students', (req, res) => {
  let students = readJSON(STUDENTS_FILE);

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
});

// GET /api/students/:id — single student
app.get('/api/students/:id', (req, res) => {
  const students = readJSON(STUDENTS_FILE);
  const student  = students.find(s => s.id === Number(req.params.id));

  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  res.json(student);
});

// ═══════════════════════════════════════════════
//  INTERVENTIONS
// ═══════════════════════════════════════════════

// GET /api/interventions — all interventions (newest first)
app.get('/api/interventions', (req, res) => {
  let interventions = readJSON(INTERVENTIONS_FILE);

  // Optional: filter by studentId
  const { studentId } = req.query;
  if (studentId) {
    interventions = interventions.filter(
      i => i.studentId === Number(studentId)
    );
  }

  // Sort newest first
  interventions.sort((a, b) => b.id - a.id);
  res.json(interventions);
});

// POST /api/interventions — create new intervention
app.post('/api/interventions', (req, res) => {
  const { studentId, studentName, type, note } = req.body;

  if (!studentId || !type || !note) {
    return res.status(400).json({
      error: 'Missing required fields: studentId, type, note'
    });
  }

  const interventions = readJSON(INTERVENTIONS_FILE);

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
  writeJSON(INTERVENTIONS_FILE, interventions);

  res.status(201).json(newIntervention);
});

// DELETE /api/interventions/:id — delete an intervention
app.delete('/api/interventions/:id', (req, res) => {
  let interventions = readJSON(INTERVENTIONS_FILE);
  const id    = Number(req.params.id);
  const index = interventions.findIndex(i => i.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Intervention not found' });
  }

  interventions.splice(index, 1);
  writeJSON(INTERVENTIONS_FILE, interventions);
  res.json({ success: true });
});

// ── Start server ──
app.listen(PORT, () => {
  console.log(`🚀 SDAS API running at http://localhost:${PORT}`);
});
