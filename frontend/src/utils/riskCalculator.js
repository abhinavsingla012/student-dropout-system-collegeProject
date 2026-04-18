// ── Calculate risk score from student data ──
export function calculateRiskScore(student) {
  let score = 0;

  if      (student.attendance < 60) score += 35;
  else if (student.attendance < 75) score += 20;
  else if (student.attendance < 85) score += 10;

  if      (student.gpa < 5.0) score += 25;
  else if (student.gpa < 6.5) score += 15;
  else if (student.gpa < 7.5) score += 5;

  if      (student.economicStatus === 'low') score += 15;
  else if (student.economicStatus === 'mid') score += 5;

  if      (student.distanceFromSchool > 20) score += 10;
  else if (student.distanceFromSchool > 10) score += 6;
  else if (student.distanceFromSchool > 5)  score += 3;

  score += Math.min(student.previousFailures * 4, 10);

  if      (student.parentEducation === 'none')    score += 5;
  else if (student.parentEducation === 'primary') score += 3;

  if (student.hasScholarship) score = Math.max(score - 5, 0);

  return Math.min(Math.round(score), 100);
}


// ── Risk Status ──
export function getRiskStatus(score) {
  if (score >= 65) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}


// ── Risk Factors ──
export function getRiskFactors(student) {
  const factors = [];

  if (student.attendance < 75)
    factors.push({ label: `Low attendance (${student.attendance}%)`, severity: 'high' });

  if (student.gpa < 6.5)
    factors.push({ label: `Low GPA (${student.gpa}/10)`, severity: 'medium' });

  if (student.economicStatus === 'low')
    factors.push({ label: 'Low family income', severity: 'high' });

  if (student.distanceFromSchool > 15)
    factors.push({ label: `Long commute (${student.distanceFromSchool}km)`, severity: 'medium' });

  if (student.previousFailures > 0)
    factors.push({ label: `${student.previousFailures} previous failures`, severity: 'medium' });

  return factors;
}


// ── Dropout Probability ──
export function calculateDropoutProbability(riskScore) {
  const k = 0.08;
  const midpoint = 50;

  const probability =
    1 / (1 + Math.exp(-k * (riskScore - midpoint)));

  return Math.round(probability * 100);
}


// ── Risk Trend ──
export function generateRiskTrend(baseRisk) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun"];

  let current = baseRisk - Math.floor(Math.random() * 15);

  return months.map(month => {
    current += Math.floor(Math.random() * 8 - 2);
    current = Math.max(10, Math.min(100, current));

    return { month, score: current };
  });
}