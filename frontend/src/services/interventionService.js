import { handleUnauthorized } from './authSession.js';
import { API_BASE_URL } from '../config/api.js';

const API_BASE = API_BASE_URL;

// ── Save a new intervention via POST ──
export async function saveIntervention({ studentId, studentName, type, note }) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/interventions`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ studentId, studentName, type, note }),
  });

  if (handleUnauthorized(res)) {
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) {
    // Try to parse the error message from the backend (Unit II: express-validator)
    let errorMessage = res.statusText;
    try {
      const errorData = await res.json();
      if (errorData.errors && errorData.errors.length > 0) {
        errorMessage = errorData.errors[0].msg;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch (e) {}
    throw new Error(errorMessage);
  }
  
  return res.json();
}

// ── Fetch interventions for a specific student ──
export async function getInterventionsForStudent(studentId) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/interventions?studentId=${studentId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (handleUnauthorized(res)) {
    throw new Error('Session expired. Please log in again.');
  }
  if (!res.ok) throw new Error(`Failed to fetch interventions: ${res.statusText}`);
  return res.json();
}

// ── Fetch all interventions (newest first) ──
export async function getAllInterventions() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/interventions`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (handleUnauthorized(res)) {
    throw new Error('Session expired. Please log in again.');
  }
  if (!res.ok) throw new Error(`Failed to fetch interventions: ${res.statusText}`);
  return res.json();
}
