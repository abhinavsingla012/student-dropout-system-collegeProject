import {
  calculateRiskScore,
  getRiskStatus,
  getRiskFactors,
  calculateDropoutProbability,
  generateRiskTrend
} from '../utils/riskCalculator.js';
import { handleUnauthorized } from './authSession.js';
import { API_BASE_URL } from '../config/api.js';

const API_BASE = API_BASE_URL;

// ── Enrich a raw student object with computed risk data ──
export function enrichStudent(student) {
  const riskScore  = calculateRiskScore(student);
  const status     = getRiskStatus(riskScore);
  const riskFactors = getRiskFactors(student);
  const dropoutProbability = calculateDropoutProbability(riskScore);
  const riskTrend  = generateRiskTrend(riskScore);

  return {
    ...student,
    riskScore,
    status,
    riskFactors,
    dropoutProbability,
    riskTrend
  };
}

// ── Fetch all students (enriched) ──
export async function getAllStudents() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/students`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (handleUnauthorized(res)) {
    throw new Error('Session expired. Please log in again.');
  }
  if (!res.ok) throw new Error(`Failed to fetch students: ${res.statusText}`);
  const raw = await res.json();
  return raw.map(enrichStudent);
}

// ── Fetch single student by ID (enriched) ──
export async function getStudentById(id) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/students/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (handleUnauthorized(res)) {
    throw new Error('Session expired. Please log in again.');
  }
  if (!res.ok) return null;
  const raw = await res.json();
  return enrichStudent(raw);
}

// ── Filter students (client-side filtering on enriched data) ──
export async function filterStudents({ status = 'all', area = 'all', search = '' } = {}) {
  const students = await getAllStudents();
  return students.filter(s => {
    const matchStatus = status === 'all' || s.status === status;
    const matchArea   = area   === 'all' || s.area   === area;
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchArea && matchSearch;
  });
}

// ── Analytics helpers (all async) ──
export async function countByStatus() {
  const students = await getAllStudents();
  return {
    high:   students.filter(s => s.status === 'high').length,
    medium: students.filter(s => s.status === 'medium').length,
    low:    students.filter(s => s.status === 'low').length,
  };
}

export async function countByArea() {
  const students = await getAllStudents();
  const areas = {};
  students.forEach(s => {
    areas[s.area] = (areas[s.area] || 0) + 1;
  });
  return areas;
}

export async function countByEconomicStatus() {
  const students = await getAllStudents();
  const eco = { low: 0, mid: 0, high: 0 };
  students.forEach(s => eco[s.economicStatus]++);
  return eco;
}

export async function avgAttendanceByArea() {
  const students = await getAllStudents();
  const sums = {}, counts = {};
  students.forEach(s => {
    sums[s.area]   = (sums[s.area]   || 0) + s.attendance;
    counts[s.area] = (counts[s.area] || 0) + 1;
  });
  const result = {};
  Object.keys(sums).forEach(a => result[a] = Math.round(sums[a] / counts[a]));
  return result;
}

export async function topRiskFactors() {
  const students = await getAllStudents();
  const tally = {};
  students.forEach(s => {
    s.riskFactors.forEach(f => {
      tally[f.label] = (tally[f.label] || 0) + 1;
    });
  });
  return Object.entries(tally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
}
