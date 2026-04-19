import { calculateRiskScore, getRiskStatus } from './riskCalculator.js';

const DRIVER_RULES = [
  {
    key: 'attendance',
    label: 'Low attendance',
    description: 'Attendance below 75%',
    severity: 'high',
    test: student => student.attendance < 75,
  },
  {
    key: 'academics',
    label: 'Low academic performance',
    description: 'GPA below 6.5',
    severity: 'high',
    test: student => student.gpa < 6.5,
  },
  {
    key: 'economic',
    label: 'Economic vulnerability',
    description: 'Low-income household',
    severity: 'medium',
    test: student => student.economicStatus === 'low',
  },
  {
    key: 'commute',
    label: 'Long commute burden',
    description: 'Distance above 15 km',
    severity: 'medium',
    test: student => student.distanceFromSchool > 15,
  },
  {
    key: 'history',
    label: 'Past academic failure',
    description: 'One or more previous failures',
    severity: 'high',
    test: student => student.previousFailures > 0,
  },
  {
    key: 'parental',
    label: 'Low parent education',
    description: 'Parent education at primary level or none',
    severity: 'medium',
    test: student =>
      student.parentEducation === 'none' || student.parentEducation === 'primary',
  },
];

function toPercent(value, total) {
  return total ? Math.round((value / total) * 100) : 0;
}

function avg(values) {
  return values.length
    ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    : 0;
}

function cap(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

export function getDriverMatches(student) {
  return DRIVER_RULES.filter(rule => rule.test(student)).map(rule => ({
    key: rule.key,
    label: rule.label,
    description: rule.description,
    severity: rule.severity,
  }));
}

export function filterData(students, filters) {
  return students.filter(student => {
    if (filters.area !== 'all' && student.area !== filters.area) return false;
    if (
      filters.economicStatus !== 'all' &&
      student.economicStatus !== filters.economicStatus
    ) return false;
    if (filters.riskLevel !== 'all' && student.status !== filters.riskLevel) return false;
    return true;
  });
}

export function computeKPIs(students) {
  const total = students.length;
  const high = students.filter(student => student.status === 'high').length;
  const medium = students.filter(student => student.status === 'medium').length;
  const low = students.filter(student => student.status === 'low').length;
  const avgAtt = total
    ? Math.round(students.reduce((sum, student) => sum + student.attendance, 0) / total)
    : 0;
  const avgRisk = total
    ? Math.round(students.reduce((sum, student) => sum + student.riskScore, 0) / total)
    : 0;

  return {
    total,
    high,
    medium,
    low,
    avgAtt,
    avgRisk,
    highRate: toPercent(high, total),
    mediumRate: toPercent(medium, total),
  };
}

export function riskByArea(students) {
  const areas = {};
  students.forEach(student => {
    if (!areas[student.area]) {
      areas[student.area] = { high: 0, medium: 0, low: 0 };
    }
    areas[student.area][student.status]++;
  });
  return areas;
}

export function attendanceByArea(students) {
  const sums = {};
  const counts = {};

  students.forEach(student => {
    sums[student.area] = (sums[student.area] || 0) + student.attendance;
    counts[student.area] = (counts[student.area] || 0) + 1;
  });

  const result = {};
  Object.keys(sums).forEach(area => {
    result[area] = Math.round(sums[area] / counts[area]);
  });
  return result;
}

export function economicCounts(students) {
  const eco = { low: 0, mid: 0, high: 0 };
  students.forEach(student => {
    if (eco[student.economicStatus] !== undefined) {
      eco[student.economicStatus]++;
    }
  });
  return eco;
}

export function topFactors(students) {
  const tally = {};

  students.forEach(student => {
    getDriverMatches(student).forEach(driver => {
      tally[driver.label] = (tally[driver.label] || 0) + 1;
    });
  });

  return Object.entries(tally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
}

export function riskDrivers(students) {
  const focusGroup = students.filter(student => student.status === 'high');
  const baseline = focusGroup.length ? focusGroup : students;

  return DRIVER_RULES.map(rule => {
    const affected = baseline.filter(rule.test);
    return {
      key: rule.key,
      label: rule.label,
      description: rule.description,
      severity: rule.severity,
      count: affected.length,
      share: toPercent(affected.length, baseline.length),
    };
  })
    .sort((a, b) => b.share - a.share || b.count - a.count)
    .slice(0, 5);
}

export function radarByArea(students) {
  const areas = {};

  students.forEach(student => {
    if (!areas[student.area]) {
      areas[student.area] = {
        attendance: 0,
        gpa: 0,
        distance: 0,
        failures: 0,
        economicRisk: 0,
        n: 0,
      };
    }

    const area = areas[student.area];
    area.attendance += student.attendance;
    area.gpa += student.gpa;
    area.distance += student.distanceFromSchool;
    area.failures += student.previousFailures;
    area.economicRisk +=
      student.economicStatus === 'low'
        ? 3
        : student.economicStatus === 'mid'
          ? 2
          : 1;
    area.n++;
  });

  const result = {};
  Object.entries(areas).forEach(([key, value]) => {
    result[key] = {
      attendance: Math.round(value.attendance / value.n),
      gpa: +(value.gpa / value.n).toFixed(1),
      distance: +(value.distance / value.n).toFixed(1),
      failures: +(value.failures / value.n).toFixed(2),
      economicRisk: +(value.economicRisk / value.n).toFixed(1),
    };
  });

  return result;
}

export function gradeRiskDistribution(students) {
  const grades = {};

  students.forEach(student => {
    const label = `Grade ${student.grade}`;
    if (!grades[label]) {
      grades[label] = {
        high: 0,
        medium: 0,
        low: 0,
        total: 0,
        avgRisk: 0,
      };
    }

    grades[label][student.status]++;
    grades[label].total++;
    grades[label].avgRisk += student.riskScore;
  });

  Object.values(grades).forEach(grade => {
    grade.avgRisk = Math.round(grade.avgRisk / grade.total);
  });

  return grades;
}

export function areaPressureIndex(students) {
  const grouped = {};

  students.forEach(student => {
    if (!grouped[student.area]) grouped[student.area] = [];
    grouped[student.area].push(student);
  });

  return Object.entries(grouped)
    .map(([area, group]) => {
      const high = group.filter(student => student.status === 'high').length;
      const medium = group.filter(student => student.status === 'medium').length;
      const avgRisk = avg(group.map(student => student.riskScore));
      const avgAttendance = avg(group.map(student => student.attendance));
      const pressureScore = Math.round(
        avgRisk * 0.55 +
        toPercent(high, group.length) * 0.3 +
        toPercent(medium, group.length) * 0.15
      );

      return {
        area,
        total: group.length,
        high,
        medium,
        avgRisk,
        avgAttendance,
        highRate: toPercent(high, group.length),
        pressureScore,
      };
    })
    .sort((a, b) => b.pressureScore - a.pressureScore);
}

export function interventionPriorities(students) {
  return areaPressureIndex(students)
    .slice(0, 3)
    .map(item => {
      const group = students.filter(student => student.area === item.area);
      const topDriver = riskDrivers(group)[0];
      const recommendedAction =
        topDriver?.key === 'attendance'
          ? 'Strengthen attendance tracking and parent follow-up.'
          : topDriver?.key === 'academics'
            ? 'Add remedial support and subject mentoring.'
            : topDriver?.key === 'economic'
              ? 'Review scholarships and aid eligibility.'
              : topDriver?.key === 'commute'
                ? 'Provide transport or locality-based support.'
                : 'Review previous failures and assign academic counselling.';

      return {
        ...item,
        title: `${cap(item.area)} intervention cluster`,
        driver: topDriver?.label || 'Multiple factors',
        recommendedAction,
      };
    });
}

export function buildCohortNarrative(students) {
  const kpis = computeKPIs(students);
  const drivers = riskDrivers(students);
  const hotspots = areaPressureIndex(students);
  const topDriver = drivers[0];
  const topHotspot = hotspots[0];

  return {
    headline: topHotspot
      ? `${cap(topHotspot.area)} students show the highest dropout pressure.`
      : 'Cohort overview is ready.',
    detail: topDriver
      ? `${topDriver.share}% of the focus cohort is affected by ${topDriver.label.toLowerCase()}.`
      : 'No dominant risk driver was found for the current filters.',
    support: `${kpis.high} high-risk and ${kpis.medium} medium-risk students need monitoring.`,
  };
}

export function simulateAttendance(students, improvementPct) {
  const before = computeKPIs(students);
  const simulated = students.map(student => {
    const updatedAttendance = Math.min(100, student.attendance + improvementPct);
    const updatedStudent = { ...student, attendance: updatedAttendance };
    const riskScore = calculateRiskScore(updatedStudent);
    return {
      ...updatedStudent,
      riskScore,
      status: getRiskStatus(riskScore),
    };
  });
  const after = computeKPIs(simulated);
  return { before, after };
}

export function generateInsights(students) {
  const insights = [];
  const priorities = interventionPriorities(students);
  const drivers = riskDrivers(students);
  const gradeMap = gradeRiskDistribution(students);
  const grades = Object.entries(gradeMap)
    .map(([grade, value]) => ({
      grade,
      highRate: toPercent(value.high, value.total),
      avgRisk: value.avgRisk,
    }))
    .sort((a, b) => b.highRate - a.highRate || b.avgRisk - a.avgRisk);

  if (priorities[0]) {
    insights.push({
      icon: 'Target',
      severity: 'high',
      text: `${priorities[0].title} should be prioritized first with ${priorities[0].highRate}% high-risk concentration.`,
      filter: { area: priorities[0].area },
    });
  }

  if (drivers[0]) {
    insights.push({
      icon: 'Cause',
      severity: 'high',
      text: `${drivers[0].share}% of the focus cohort is affected by ${drivers[0].label.toLowerCase()}.`,
      filter: { riskLevel: 'high' },
    });
  }

  if (grades[0]) {
    insights.push({
      icon: 'Grade',
      severity: 'medium',
      text: `${grades[0].grade} currently has the highest high-risk concentration at ${grades[0].highRate}%.`,
      filter: { riskLevel: 'high' },
    });
  }

  const lowIncomeHigh = students.filter(
    student => student.status === 'high' && student.economicStatus === 'low'
  ).length;
  const highRiskCount = students.filter(student => student.status === 'high').length;
  const lowIncomeShare = toPercent(lowIncomeHigh, highRiskCount);

  if (lowIncomeShare >= 30) {
    insights.push({
      icon: 'Equity',
      severity: 'medium',
      text: `${lowIncomeShare}% of high-risk students are from low-income households, suggesting financial support should remain a core intervention.`,
      filter: { economicStatus: 'low', riskLevel: 'high' },
    });
  }

  return insights.slice(0, 4);
}
