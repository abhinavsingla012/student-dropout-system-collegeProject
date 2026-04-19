import Chart from 'chart.js/auto';
import {
  areaPressureIndex,
  buildCohortNarrative,
  computeKPIs,
  interventionPriorities,
  riskDrivers,
} from '../utils/analyticsEngine.js';
import { getAllStudents } from '../services/studentService.js';
import { getAllInterventions } from '../services/interventionService.js';

const TYPE_LABEL = {
  counselling: 'Counselling',
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

function cap(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function getTheme() {
  const styles = getComputedStyle(document.body);
  return {
    textPrimary: styles.getPropertyValue('--text-primary').trim() || '#ffffff',
    textSecondary: styles.getPropertyValue('--text-secondary').trim() || '#a1a1a1',
    textMuted: styles.getPropertyValue('--text-muted').trim() || '#717171',
    cardBorder: styles.getPropertyValue('--card-border').trim() || 'rgba(255,255,255,0.08)',
    appBg: styles.getPropertyValue('--app-bg').trim() || '#030303',
    accentPurple: styles.getPropertyValue('--accent-purple').trim() || '#818cf8',
    accentRed: styles.getPropertyValue('--accent-red').trim() || '#fb7185',
    accentAmber: styles.getPropertyValue('--accent-amber').trim() || '#fbbf24',
    accentGreen: styles.getPropertyValue('--accent-green').trim() || '#34d399',
    accentBlue: styles.getPropertyValue('--accent-blue').trim() || '#38bdf8',
  };
}

function tooltipConfig(theme) {
  return {
    backgroundColor: theme.appBg,
    borderColor: theme.cardBorder,
    borderWidth: 1,
    titleColor: theme.textPrimary,
    bodyColor: theme.textSecondary,
    titleFont: { family: 'Inter', weight: '700', size: 13 },
    bodyFont: { family: 'Inter', size: 12 },
    padding: 12,
    cornerRadius: 10,
    displayColors: false,
  };
}

function scaleConfig(theme) {
  return {
    grid: { color: theme.cardBorder },
    ticks: {
      color: theme.textMuted,
      font: { family: 'Inter', size: 10 },
    },
  };
}

function renderPressureChart(pressure) {
  const canvas = document.getElementById('dashboardPressureChart');
  if (!canvas) return;
  const theme = getTheme();
  const scales = scaleConfig(theme);

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: pressure.map(item => cap(item.area)),
      datasets: [
        {
          label: 'Pressure index',
          data: pressure.map(item => item.pressureScore),
          backgroundColor: [theme.accentRed, theme.accentAmber, theme.accentBlue],
          borderRadius: 12,
          borderSkipped: false,
        },
      ],
    },
    options: {
      plugins: {
        legend: { display: false },
        tooltip: tooltipConfig(theme),
      },
      scales: {
        x: scales,
        y: { ...scales, beginAtZero: true, max: 100 },
      },
    },
  });
}

function renderDriverChart(drivers) {
  const canvas = document.getElementById('dashboardDriverChart');
  if (!canvas) return;
  const theme = getTheme();
  const scales = scaleConfig(theme);

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: drivers.map(driver => driver.label),
      datasets: [
        {
          label: 'Affected share',
          data: drivers.map(driver => driver.share),
          backgroundColor: [theme.accentPurple, theme.accentBlue, theme.accentAmber, theme.accentGreen],
          borderRadius: 10,
          borderSkipped: false,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: tooltipConfig(theme),
      },
      scales: {
        x: {
          ...scales,
          beginAtZero: true,
          max: 100,
          ticks: { ...scales.ticks, callback: value => `${value}%` },
        },
        y: scales,
      },
    },
  });
}

export async function renderDashboard() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <section class="page">
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Preparing dashboard briefing...</p>
      </div>
    </section>
  `;

  try {
    const [students, interventions] = await Promise.all([
      getAllStudents(),
      getAllInterventions(),
    ]);

    const kpis = computeKPIs(students);
    const narrative = buildCohortNarrative(students);
    const priorities = interventionPriorities(students);
    const pressure = areaPressureIndex(students).slice(0, 3);
    const drivers = riskDrivers(students).slice(0, 4);
    const urgentStudents = [...students]
      .sort((a, b) => b.riskScore - a.riskScore || a.attendance - b.attendance)
      .slice(0, 4);
    const recentInterventions = interventions.slice(0, 5);
    const primaryCluster = priorities[0];
    const followupCluster = priorities[1];

    app.innerHTML = `
      <section class="page dashboard-page">
        <header class="page-header dashboard-header-unique">
          <div>
            <p class="dashboard-overline">Daily Briefing</p>
            <h1 class="page-title">Retention Operations Dashboard</h1>
            <p class="page-subtitle">A fast decision layer for school staff: what needs attention now, where to focus next, and which interventions are already moving.</p>
          </div>
          <div class="status-pill">
            <span class="dot-pulse"></span>
            Monitoring Live
          </div>
        </header>

        <section class="dashboard-briefing-band">
          <div class="dashboard-briefing-main">
            <span class="dashboard-briefing-label">Today’s Brief</span>
            <h2>${escapeHtml(narrative.headline)}</h2>
            <p>${escapeHtml(narrative.detail)}</p>
          </div>
          <div class="dashboard-briefing-side">
            <div class="dashboard-brief-stat">
              <span>Immediate watchlist</span>
              <strong>${kpis.high}</strong>
            </div>
            <div class="dashboard-brief-stat">
              <span>Average attendance</span>
              <strong>${kpis.avgAtt}%</strong>
            </div>
          </div>
        </section>

        <section class="dashboard-metric-ribbon">
          <article class="dashboard-ribbon-card">
            <span class="dashboard-ribbon-label">Students</span>
            <strong class="dashboard-ribbon-value">${kpis.total}</strong>
            <p class="dashboard-ribbon-note">Total monitored in the system</p>
          </article>
          <article class="dashboard-ribbon-card">
            <span class="dashboard-ribbon-label">High Risk</span>
            <strong class="dashboard-ribbon-value danger">${kpis.high}</strong>
            <p class="dashboard-ribbon-note">${kpis.highRate}% of the cohort</p>
          </article>
          <article class="dashboard-ribbon-card">
            <span class="dashboard-ribbon-label">Average Risk</span>
            <strong class="dashboard-ribbon-value warning">${kpis.avgRisk}</strong>
            <p class="dashboard-ribbon-note">Composite risk score</p>
          </article>
          <article class="dashboard-ribbon-card">
            <span class="dashboard-ribbon-label">Interventions</span>
            <strong class="dashboard-ribbon-value accent">${interventions.length}</strong>
            <p class="dashboard-ribbon-note">Logged support actions</p>
          </article>
        </section>

        <section class="dashboard-story-grid">
          <article class="dashboard-panel dashboard-panel-priority">
            <div class="dashboard-panel-head">
              <div>
                <span class="dashboard-panel-kicker">Primary Focus Zone</span>
                <h3 class="dashboard-panel-title">${escapeHtml(primaryCluster?.title || 'No hotspot cluster')}</h3>
              </div>
              <span class="dashboard-priority-badge">${primaryCluster?.pressureScore ?? 0}</span>
            </div>
            <div class="dashboard-priority-meta">
              <span>${primaryCluster?.highRate ?? 0}% high-risk concentration</span>
              <span>${escapeHtml(primaryCluster?.driver || 'No dominant driver')}</span>
            </div>
            <p class="dashboard-priority-copy">${escapeHtml(primaryCluster?.recommendedAction || 'Continue observing the current cohort.')}</p>
            <div class="dashboard-followup-row">
              <div class="dashboard-followup-card">
                <span class="dashboard-followup-label">Secondary cluster</span>
                <strong>${escapeHtml(followupCluster?.title || 'No secondary cluster')}</strong>
              </div>
              <div class="dashboard-followup-card">
                <span class="dashboard-followup-label">System note</span>
                <strong>${escapeHtml(narrative.support)}</strong>
              </div>
            </div>
          </article>

          <article class="dashboard-panel dashboard-panel-queue">
            <div class="dashboard-panel-head">
              <div>
                <span class="dashboard-panel-kicker">Urgent Watchlist</span>
                <h3 class="dashboard-panel-title">Students needing attention</h3>
              </div>
            </div>
            <div class="dashboard-watchlist">
              ${urgentStudents
                .map(
                  student => `
                    <button class="dashboard-watch-item" onclick="window.location.hash='#/student/${student.id}'">
                      <div>
                        <span class="dashboard-watch-name">${escapeHtml(student.name)}</span>
                        <span class="dashboard-watch-meta">Grade ${student.grade} | ${escapeHtml(cap(student.area))} | ${student.attendance}% attendance</span>
                      </div>
                      <span class="dashboard-watch-score">${student.riskScore}</span>
                    </button>
                  `
                )
                .join('')}
            </div>
          </article>
        </section>

        <section class="dashboard-analysis-grid">
          <article class="dashboard-panel dashboard-panel-chart">
            <div class="dashboard-panel-head">
              <div>
                <span class="dashboard-panel-kicker">Regional Signal</span>
                <h3 class="dashboard-panel-title">Pressure by area</h3>
              </div>
            </div>
            <div class="dashboard-chart-frame">
              <canvas id="dashboardPressureChart"></canvas>
            </div>
          </article>

          <article class="dashboard-panel dashboard-panel-chart">
            <div class="dashboard-panel-head">
              <div>
                <span class="dashboard-panel-kicker">Root Causes</span>
                <h3 class="dashboard-panel-title">Top dropout drivers</h3>
              </div>
            </div>
            <div class="dashboard-chart-frame">
              <canvas id="dashboardDriverChart"></canvas>
            </div>
          </article>
        </section>

        <section class="dashboard-timeline-grid">
          <article class="dashboard-panel dashboard-panel-log">
            <div class="dashboard-panel-head">
              <div>
                <span class="dashboard-panel-kicker">Recent Movement</span>
                <h3 class="dashboard-panel-title">Intervention timeline</h3>
              </div>
            </div>
            <div class="dashboard-timeline-list">
              ${recentInterventions.length
                ? recentInterventions
                    .map(
                      intervention => `
                        <article class="dashboard-timeline-item">
                          <div class="dashboard-timeline-dot"></div>
                          <div class="dashboard-timeline-content">
                            <div class="dashboard-timeline-head">
                              <strong>${escapeHtml(intervention.studentName)}</strong>
                              <span>${escapeHtml(intervention.date)}</span>
                            </div>
                            <p class="dashboard-timeline-type">${escapeHtml(TYPE_LABEL[intervention.type] || intervention.type)}</p>
                            <p class="dashboard-timeline-note">${escapeHtml(intervention.note)}</p>
                          </div>
                        </article>
                      `
                    )
                    .join('')
                : '<p class="widget-desc">No recent intervention records available.</p>'}
            </div>
          </article>

          <article class="dashboard-panel dashboard-panel-summary">
            <div class="dashboard-panel-head">
              <div>
                <span class="dashboard-panel-kicker">Operational Summary</span>
                <h3 class="dashboard-panel-title">Key drivers at a glance</h3>
              </div>
            </div>
            <div class="dashboard-driver-stack">
              ${drivers
                .map(
                  driver => `
                    <div class="dashboard-driver-card">
                      <div>
                        <strong>${escapeHtml(driver.label)}</strong>
                        <p>${escapeHtml(driver.description)}</p>
                      </div>
                      <span>${driver.share}%</span>
                    </div>
                  `
                )
                .join('')}
            </div>
          </article>
        </section>
      </section>
    `;

    renderPressureChart(pressure);
    renderDriverChart(drivers);
  } catch (error) {
    app.innerHTML = `
      <section class="page">
        <div class="loading-state">
          <h2>Error initializing dashboard</h2>
          <p>${escapeHtml(error.message)}</p>
        </div>
      </section>
    `;
  }
}
