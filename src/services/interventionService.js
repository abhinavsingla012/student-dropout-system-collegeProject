// ── In-memory intervention store ──
// keyed by student id so lookups are O(1)
const store = {};

export function saveIntervention({ studentId, studentName, type, note }) {
  if (!store[studentId]) store[studentId] = [];
  store[studentId].push({
    id:          Date.now(),
    studentId,
    studentName,
    type,
    note,
    date:        new Date().toLocaleDateString('en-IN', {
                   day: '2-digit', month: 'short', year: 'numeric'
                 }),
  });
}

export function getInterventionsForStudent(studentId) {
  return store[studentId] || [];
}

export function getAllInterventions() {
  return Object.values(store).flat()
    .sort((a, b) => b.id - a.id);   // newest first
}