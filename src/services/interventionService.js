const API_BASE = 'http://localhost:3000/api';

// ── Save a new intervention via POST ──
export async function saveIntervention({ studentId, studentName, type, note }) {
  const res = await fetch(`${API_BASE}/interventions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, studentName, type, note }),
  });

  if (!res.ok) throw new Error(`Failed to save intervention: ${res.statusText}`);
  return res.json();
}

// ── Fetch interventions for a specific student ──
export async function getInterventionsForStudent(studentId) {
  const res = await fetch(`${API_BASE}/interventions?studentId=${studentId}`);
  if (!res.ok) throw new Error(`Failed to fetch interventions: ${res.statusText}`);
  return res.json();
}

// ── Fetch all interventions (newest first) ──
export async function getAllInterventions() {
  const res = await fetch(`${API_BASE}/interventions`);
  if (!res.ok) throw new Error(`Failed to fetch interventions: ${res.statusText}`);
  return res.json();
}