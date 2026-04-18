import { calculateRiskScore, getRiskStatus } from './riskCalculator.js';

// ── Filter students by criteria ──
export function filterData(students, filters) {
  return students.filter(s => {
    if (filters.area !== 'all' && s.area !== filters.area) return false;
    if (filters.economicStatus !== 'all' && s.economicStatus !== filters.economicStatus) return false;
    if (filters.riskLevel !== 'all' && s.status !== filters.riskLevel) return false;
    return true;
  });
}

// ── KPI computations ──
export function computeKPIs(students) {
  const total = students.length;
  const high = students.filter(s => s.status === 'high').length;
  const medium = students.filter(s => s.status === 'medium').length;
  const low = students.filter(s => s.status === 'low').length;
  const avgAtt = total ? Math.round(students.reduce((a, s) => a + s.attendance, 0) / total) : 0;
  return { total, high, medium, low, avgAtt, highRate: total ? Math.round(high / total * 100) : 0 };
}

// ── Risk counts by area (for stacked bar) ──
export function riskByArea(students) {
  const areas = {};
  students.forEach(s => {
    if (!areas[s.area]) areas[s.area] = { high: 0, medium: 0, low: 0 };
    areas[s.area][s.status]++;
  });
  return areas;
}

// ── Attendance by area ──
export function attendanceByArea(students) {
  const sums = {}, counts = {};
  students.forEach(s => {
    sums[s.area] = (sums[s.area] || 0) + s.attendance;
    counts[s.area] = (counts[s.area] || 0) + 1;
  });
  const result = {};
  Object.keys(sums).forEach(a => result[a] = Math.round(sums[a] / counts[a]));
  return result;
}

// ── Economic status counts ──
export function economicCounts(students) {
  const eco = { low: 0, mid: 0, high: 0 };
  students.forEach(s => { if (eco[s.economicStatus] !== undefined) eco[s.economicStatus]++; });
  return eco;
}

// ── Top risk factors ──
export function topFactors(students) {
  const tally = {};
  students.forEach(s => {
    (s.riskFactors || []).forEach(f => { tally[f.label] = (tally[f.label] || 0) + 1; });
  });
  return Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 6);
}

// ── Radar: avg metrics by area ──
export function radarByArea(students) {
  const areas = {};
  students.forEach(s => {
    if (!areas[s.area]) areas[s.area] = { att: 0, gpa: 0, dist: 0, fail: 0, eco: 0, n: 0 };
    const a = areas[s.area];
    a.att += s.attendance; a.gpa += s.gpa; a.dist += s.distanceFromSchool;
    a.fail += s.previousFailures; a.eco += (s.economicStatus === 'low' ? 3 : s.economicStatus === 'mid' ? 2 : 1);
    a.n++;
  });
  const result = {};
  Object.entries(areas).forEach(([k, v]) => {
    result[k] = {
      attendance: Math.round(v.att / v.n),
      gpa: +(v.gpa / v.n).toFixed(1),
      distance: +(v.dist / v.n).toFixed(1),
      failures: +(v.fail / v.n).toFixed(2),
      economicRisk: +(v.eco / v.n).toFixed(1),
    };
  });
  return result;
}

// ── What-If Simulator ──
export function simulateAttendance(students, improvementPct) {
  const before = computeKPIs(students);
  const simulated = students.map(s => {
    const newAtt = Math.min(100, s.attendance + improvementPct);
    const clone = { ...s, attendance: newAtt };
    const newScore = calculateRiskScore(clone);
    return { ...clone, riskScore: newScore, status: getRiskStatus(newScore) };
  });
  const after = computeKPIs(simulated);
  return { before, after };
}

// ── Smart Insights ──
export function generateInsights(students) {
  const insights = [];
  const highRisk = students.filter(s => s.status === 'high');

  // 1. Highest risk area
  const areaCounts = {};
  highRisk.forEach(s => { areaCounts[s.area] = (areaCounts[s.area] || 0) + 1; });
  const topArea = Object.entries(areaCounts).sort((a, b) => b[1] - a[1])[0];
  if (topArea) {
    const pct = Math.round(topArea[1] / highRisk.length * 100);
    insights.push({
      icon: '📍', severity: 'high',
      text: `${pct}% of high-risk students are in ${topArea[0]} areas.`,
      filter: { area: topArea[0] }
    });
  }

  // 2. Common factor in high-risk
  const factorTally = {};
  highRisk.forEach(s => (s.riskFactors || []).forEach(f => { factorTally[f.label] = (factorTally[f.label] || 0) + 1; }));
  const topFactor = Object.entries(factorTally).sort((a, b) => b[1] - a[1])[0];
  if (topFactor && highRisk.length) {
    const pct = Math.round(topFactor[1] / highRisk.length * 100);
    insights.push({
      icon: '⚡', severity: 'high',
      text: `${pct}% of high-risk students share "${topFactor[0].split('(')[0].trim()}" as a factor.`,
      filter: { riskLevel: 'high' }
    });
  }

  // 3. Attendance gap
  const attByArea = attendanceByArea(students);
  const attEntries = Object.entries(attByArea);
  if (attEntries.length >= 2) {
    attEntries.sort((a, b) => a[1] - b[1]);
    const gap = attEntries[attEntries.length - 1][1] - attEntries[0][1];
    if (gap > 3) {
      insights.push({
        icon: '📊', severity: 'medium',
        text: `${gap}% attendance gap between ${attEntries[attEntries.length - 1][0]} (${attEntries[attEntries.length - 1][1]}%) and ${attEntries[0][0]} (${attEntries[0][1]}%).`,
        filter: { area: attEntries[0][0] }
      });
    }
  }

  // 4. Economic correlation
  const lowEcoHigh = highRisk.filter(s => s.economicStatus === 'low').length;
  if (highRisk.length) {
    const pct = Math.round(lowEcoHigh / highRisk.length * 100);
    if (pct > 30) {
      insights.push({
        icon: '💰', severity: 'medium',
        text: `${pct}% of high-risk students come from low-income families.`,
        filter: { economicStatus: 'low', riskLevel: 'high' }
      });
    }
  }

  return insights.slice(0, 4);
}
