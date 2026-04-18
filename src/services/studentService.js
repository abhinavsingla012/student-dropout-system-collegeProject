import { students as rawStudents } from '../data/students.js';

// Enrich once at startup
export const students = rawStudents.map(enrichStudent);

// ── Filter ──
export function filterStudents({ status = 'all', area = 'all', search = '' }) {
  return students.filter(s => {
    const matchStatus = status === 'all' || s.status === status;
    const matchArea   = area   === 'all' || s.area   === area;
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchArea && matchSearch;
  });
}

// ── Single student lookup ──
export function getStudentById(id) {
  return students.find(s => s.id === Number(id)) || null;
}

// ── Analytics helpers ──
export function countByStatus() {
  return {
    high:   students.filter(s => s.status === 'high').length,
    medium: students.filter(s => s.status === 'medium').length,
    low:    students.filter(s => s.status === 'low').length,
  };
}

export function countByArea() {
  const areas = {};
  students.forEach(s => {
    areas[s.area] = (areas[s.area] || 0) + 1;
  });
  return areas;
}

export function countByEconomicStatus() {
  const eco = { low: 0, mid: 0, high: 0 };
  students.forEach(s => eco[s.economicStatus]++);
  return eco;
}

export function avgAttendanceByArea() {
  const sums = {}, counts = {};
  students.forEach(s => {
    sums[s.area]   = (sums[s.area]   || 0) + s.attendance;
    counts[s.area] = (counts[s.area] || 0) + 1;
  });
  const result = {};
  Object.keys(sums).forEach(a => result[a] = Math.round(sums[a] / counts[a]));
  return result;
}

export function topRiskFactors() {
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
import {
  calculateRiskScore,
  getRiskStatus,
  getRiskFactors,
  calculateDropoutProbability,
  generateRiskTrend
} from '../utils/riskCalculator.js';

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