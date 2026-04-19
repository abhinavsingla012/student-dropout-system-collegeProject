import Chart from 'chart.js/auto';
import { getDriverMatches } from '../utils/analyticsEngine.js';
import { getStudentById } from '../services/studentService.js';
import { getInterventionsForStudent, saveIntervention } from '../services/interventionService.js';

const TYPE_LABEL = {
  counselling: 'Counselling Session',
  parent_meeting: 'Parent Meeting',
  academic_support: 'Academic Support',
  financial_aid: 'Financial Aid',
  mentorship: 'Mentorship',
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return map[character];
  });
}

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function buildActionPlan(student, interventions) {
  const drivers = getDriverMatches(student);
  const actionPlan = [];

  if (student.attendance < 75) {
    actionPlan.push('Start weekly attendance monitoring and immediate parent follow-up.');
  }
  if (student.gpa < 6.5 || student.previousFailures > 0) {
    actionPlan.push('Assign remedial academic support and track progress by subject.');
  }
  if (student.economicStatus === 'low') {
    actionPlan.push('Review scholarship, fee support, or financial-aid eligibility.');
  }
  if (student.distanceFromSchool > 15) {
    actionPlan.push('Assess transport burden and provide locality-based support.');
  }
  if (!actionPlan.length) {
    actionPlan.push('Maintain preventive mentoring and monitor for early warning signs.');
  }

  return {
    drivers,
    lastAction:
      interventions[0]
        ? `${TYPE_LABEL[interventions[0].type] || interventions[0].type} recorded on ${interventions[0].date}.`
        : 'No intervention recorded yet for this student.',
    nextStep: actionPlan[0],
    recommendedTypes: Array.from(
      new Set(
        [
          student.attendance < 75 ? 'parent_meeting' : null,
          student.gpa < 6.5 || student.previousFailures > 0 ? 'academic_support' : null,
          student.economicStatus === 'low' ? 'financial_aid' : null,
          student.status === 'high' ? 'counselling' : 'mentorship',
        ].filter(Boolean)
      )
    ),
  };
}

function buildInterventionTimeline(interventions) {
  if (!interventions.length) {
    return '<div class="empty-state"><span class="empty-state-icon">Plan</span>No intervention actions have been logged yet.</div>';
  }

  return interventions
    .map(
      intervention => `
        <article class="intervention-item intervention-item-detailed">
          <div class="intervention-header">
            <strong>${escapeHtml(TYPE_LABEL[intervention.type] || intervention.type)}</strong>
            <span class="intervention-date">${escapeHtml(intervention.date)}</span>
          </div>
          <span class="intervention-type-tag">${escapeHtml(intervention.studentName)}</span>
          <p class="intervention-note">${escapeHtml(intervention.note)}</p>
        </article>
      `
    )
    .join('');
}

function buildDriverCards(drivers) {
  if (!drivers.length) {
    return '<div class="empty-state"><span class="empty-state-icon">Stable</span>No major dropout drivers are active for this student right now.</div>';
  }

  return drivers
    .map(
      driver => `
        <article class="driver-insight-card ${escapeHtml(driver.severity)}">
          <span class="driver-insight-label">${escapeHtml(driver.label)}</span>
          <p class="driver-insight-copy">${escapeHtml(driver.description)}</p>
        </article>
      `
    )
    .join('');
}

function buildRecommendedOptions(student, actionPlan) {
  return Object.entries(TYPE_LABEL)
    .map(([value, label]) => {
      const recommended = actionPlan.recommendedTypes.includes(value) ? 'Recommended' : 'Optional';
      const selected = value === actionPlan.recommendedTypes[0] ? 'selected' : '';
      return `<option value="${value}" ${selected}>${escapeHtml(label)} (${recommended})</option>`;
    })
    .join('');
}

function renderTrendChart(student) {
  const canvas = document.getElementById('trendChart');
  if (!canvas || !student.riskTrend) return;

  const color =
    student.status === 'high'
      ? '#ff5c72'
      : student.status === 'medium'
        ? '#f5a623'
        : '#0dca73';

  new Chart(canvas, {
    type: 'line',
    data: {
      labels: student.riskTrend.map(point => point.month),
      datasets: [
        {
          label: 'Risk score',
          data: student.riskTrend.map(point => point.score),
          borderColor: color,
          backgroundColor: `${color}14`,
          tension: 0.35,
          fill: true,
          pointBackgroundColor: color,
          pointBorderColor: '#0a0a0a',
          pointBorderWidth: 2,
          pointRadius: 3,
        },
      ],
    },
    options: {
      scales: {
        y: {
          min: 0,
          max: 100,
          grid: { color: 'rgba(255,255,255,.06)' },
          ticks: { color: '#666', font: { family: 'Inter', size: 10 } },
        },
        x: {
          grid: { color: 'rgba(255,255,255,.04)' },
          ticks: { color: '#666', font: { family: 'Inter', size: 10 } },
        },
      },
      plugins: {
        legend: { labels: { color: '#888', font: { family: 'Inter' } } },
        tooltip: {
          backgroundColor: '#141414',
          borderColor: 'rgba(255,255,255,.1)',
          borderWidth: 1,
          titleColor: '#ededed',
          bodyColor: '#888',
          cornerRadius: 7,
        },
      },
    },
  });
}

export async function renderStudentDetail(id) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <section class="page">
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading student case review...</p>
      </div>
    </section>
  `;

  try {
    const student = await getStudentById(id);
    if (!student) {
      app.innerHTML = `<section class="page"><a href="#/students" class="back-link">Back to Students</a><h1 class="page-title">Student not found</h1></section>`;
      return;
    }

    await renderDetail(app, student);
  } catch (error) {
    app.innerHTML = `
      <section class="page">
        <a href="#/students" class="back-link">Back to Students</a>
        <div class="loading-state">
          <h2>Failed to load student</h2>
          <p>${escapeHtml(error.message)}</p>
        </div>
      </section>
    `;
  }
}

async function renderDetail(app, student) {
  const interventions = await getInterventionsForStudent(student.id);
  const actionPlan = buildActionPlan(student, interventions);
  const intensityLabel =
    student.status === 'high'
      ? 'Immediate intervention required'
      : student.status === 'medium'
        ? 'Active monitoring required'
        : 'Preventive support recommended';

  app.innerHTML = `
    <section class="page">
      <a href="#/students" class="back-link">Back to Students</a>

      <section class="detail-narrative">
        <div class="narrative-kicker">Student Case Review</div>
        <h2 class="narrative-title">${escapeHtml(student.name)} requires ${escapeHtml(intensityLabel.toLowerCase())}.</h2>
        <p class="narrative-copy">${escapeHtml(actionPlan.lastAction)} ${escapeHtml(actionPlan.nextStep)}</p>
        <p class="narrative-support">Current risk score: ${student.riskScore} | Dropout probability: ${student.dropoutProbability}% | Area: ${escapeHtml(capitalize(student.area))}</p>
      </section>

      <div class="profile-header ${student.status}">
        <div class="profile-header-band"></div>
        <div class="profile-header-main">
          <h1 class="profile-name">${escapeHtml(student.name)}</h1>
          <div class="profile-meta">
            <span>Grade ${student.grade}</span>
            <span>${escapeHtml(capitalize(student.area))}</span>
            <span>${escapeHtml(capitalize(student.gender))}</span>
            <span>${escapeHtml(capitalize(student.economicStatus))} income</span>
            <span>${student.distanceFromSchool} km from school</span>
            ${student.hasScholarship ? '<span class="badge-scholarship">Scholarship support active</span>' : ''}
          </div>
        </div>
        <div class="profile-risk-panel">
          <span class="risk-label">Risk Score</span>
          <span class="risk-score-big ${student.status}">${student.riskScore}</span>
          <span class="risk-badge ${student.status}">${escapeHtml(student.status)} risk</span>
          <span class="dropout-prob">${student.dropoutProbability}% dropout probability</span>
        </div>
      </div>

      <div class="metrics-grid metrics-grid-expanded">
        <div class="metric-card">
          <span class="metric-value ${student.attendance < 75 ? 'text-danger' : ''}">${student.attendance}%</span>
          <span class="metric-label">Attendance</span>
          <div class="mini-bar-bg"><div class="mini-bar-fill ${student.status}" style="width:${student.attendance}%"></div></div>
        </div>
        <div class="metric-card">
          <span class="metric-value ${student.gpa < 6.0 ? 'text-danger' : ''}">${student.gpa}/10</span>
          <span class="metric-label">GPA</span>
          <div class="mini-bar-bg"><div class="mini-bar-fill ${student.status}" style="width:${student.gpa * 10}%"></div></div>
        </div>
        <div class="metric-card">
          <span class="metric-value">${student.distanceFromSchool} km</span>
          <span class="metric-label">Commute</span>
        </div>
        <div class="metric-card">
          <span class="metric-value ${student.previousFailures > 0 ? 'text-danger' : ''}">${student.previousFailures}</span>
          <span class="metric-label">Previous Failures</span>
        </div>
        <div class="metric-card metric-card-highlight">
          <span class="metric-value">${interventions.length}</span>
          <span class="metric-label">Interventions Logged</span>
        </div>
      </div>

      <div class="student-case-grid">
        <div class="detail-section">
          <h2 class="section-heading">Primary Dropout Drivers</h2>
          <div class="driver-insight-grid">${buildDriverCards(actionPlan.drivers)}</div>
        </div>

        <div class="detail-section">
          <h2 class="section-heading">Suggested Retention Strategy</h2>
          <div class="strategy-stack">
            <div class="strategy-card">
              <span class="strategy-label">Recommended next step</span>
              <p class="strategy-copy">${escapeHtml(actionPlan.nextStep)}</p>
            </div>
            <div class="strategy-card">
              <span class="strategy-label">Intervention intensity</span>
              <p class="strategy-copy">${escapeHtml(intensityLabel)}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h2 class="section-heading">Risk Trend</h2>
        <canvas id="trendChart"></canvas>
      </div>

      <div class="student-case-grid">
        <div class="detail-section">
          <h2 class="section-heading">Intervention Timeline</h2>
          <div id="interventionHistory">${buildInterventionTimeline(interventions)}</div>
        </div>

        <div class="detail-section">
          <h2 class="section-heading">Log New Intervention</h2>
          <div class="form-card">
            <div class="form-group">
              <label for="interventionType">Recommended intervention</label>
              <select id="interventionType">
                <option value="">Select intervention type</option>
                ${buildRecommendedOptions(student, actionPlan)}
              </select>
            </div>
            <div class="form-group">
              <label for="interventionNote">Case note</label>
              <textarea id="interventionNote" placeholder="Record the action taken, response from student or parent, and the next follow-up step."></textarea>
            </div>
            <button class="btn btn-primary" id="saveIntervention">Save Intervention</button>
            <div id="formMessage"></div>
          </div>
        </div>
      </div>
    </section>
  `;

  renderTrendChart(student);

  document.getElementById('saveIntervention').addEventListener('click', async () => {
    const type = document.getElementById('interventionType').value;
    const note = document.getElementById('interventionNote').value.trim();
    const message = document.getElementById('formMessage');

    if (!type || !note) {
      message.innerHTML = '<div class="form-message error">Please complete the intervention type and case note.</div>';
      return;
    }

    try {
      await saveIntervention({
        studentId: student.id,
        studentName: student.name,
        type,
        note,
      });
      await renderDetail(app, student);
    } catch (error) {
      message.innerHTML = `<div class="form-message error">Failed to save intervention: ${escapeHtml(error.message)}</div>`;
    }
  });
}
