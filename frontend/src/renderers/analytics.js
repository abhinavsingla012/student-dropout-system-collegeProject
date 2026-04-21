import Chart from 'chart.js/auto';
import { getAllStudents } from '../services/studentService.js';
import {
  areaPressureIndex,
  attendanceByArea,
  buildCohortNarrative,
  computeKPIs,
  economicCounts,
  filterData,
  generateInsights,
  gradeRiskDistribution,
  interventionPriorities,
  radarByArea,
  riskByArea,
  riskDrivers,
  simulateAttendance,
  topFactors,
} from '../utils/analyticsEngine.js';

let state = {
  all: [],
  filters: { area: 'all', economicStatus: 'all', riskLevel: 'all' },
  charts: {},
  drillDown: null,
};

function getTheme() {
  const styles = getComputedStyle(document.body);
  return {
    textPrimary: styles.getPropertyValue('--text-primary').trim() || '#ffffff',
    textSecondary: styles.getPropertyValue('--text-secondary').trim() || '#a1a1a1',
    textMuted: styles.getPropertyValue('--text-muted').trim() || '#717171',
    cardBorder: styles.getPropertyValue('--card-border').trim() || 'rgba(255,255,255,0.08)',
    appBg: styles.getPropertyValue('--app-bg').trim() || '#030303',
    cardBg: styles.getPropertyValue('--card-bg').trim() || 'rgba(13,13,13,0.8)',
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
    displayColors: true,
    boxPadding: 4,
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

function cap(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

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

function destroyCharts() {
  Object.values(state.charts).forEach(chart => {
    try {
      chart.destroy();
    } catch {}
  });
  state.charts = {};
}

function getFiltered() {
  let data = filterData(state.all, state.filters);
  if (state.drillDown) {
    const { type, value } = state.drillDown;
    data = data.filter(student => student[type] === value);
  }
  return data;
}

function animateValue(element, endValue) {
  const startValue = parseInt(element.textContent, 10) || 0;
  const duration = 600;
  const startedAt = performance.now();
  const suffix = element.dataset.suffix || '';

  function tick(now) {
    const progress = Math.min((now - startedAt) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = `${Math.round(startValue + (endValue - startValue) * eased)}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

function updateKPIs(data) {
  const kpis = computeKPIs(data);
  const pressure = areaPressureIndex(data)[0];
  const drivers = riskDrivers(data);

  const values = {
    kpiTotal: kpis.total,
    kpiHigh: kpis.high,
    kpiRisk: kpis.avgRisk,
    kpiAtt: kpis.avgAtt,
  };

  Object.entries(values).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) animateValue(element, value);
  });

  const hotspotLabel = document.getElementById('kpiHotspot');
  if (hotspotLabel) {
    hotspotLabel.textContent = pressure ? cap(pressure.area) : 'None';
  }

  const driverLabel = document.getElementById('kpiDriver');
  if (driverLabel) {
    driverLabel.textContent = drivers[0] ? drivers[0].label : 'No dominant driver';
  }
}

function updateNarrative(data) {
  const narrative = buildCohortNarrative(data);
  const root = document.getElementById('analyticsNarrative');
  if (!root) return;

  root.innerHTML = `
    <div class="narrative-kicker">Risk Analysis</div>
    <h2 class="narrative-title">${escapeHtml(narrative.headline)}</h2>
    <p class="narrative-copy">${escapeHtml(narrative.detail)}</p>
    <p class="narrative-support">${escapeHtml(narrative.support)}</p>
  `;
}

function updatePriorityList(data) {
  const priorities = interventionPriorities(data);
  const root = document.getElementById('priorityList');
  if (!root) return;

  if (!priorities.length) {
    root.innerHTML = '<p class="widget-desc">No intervention priorities available for the current filters.</p>';
    return;
  }

  root.innerHTML = priorities
    .map(
      priority => `
        <article class="priority-card">
          <div class="priority-head">
            <div>
              <h4 class="priority-title">${escapeHtml(priority.title)}</h4>
              <p class="priority-meta">${priority.highRate}% high risk | Avg risk ${priority.avgRisk}</p>
            </div>
            <span class="priority-score">${priority.pressureScore}</span>
          </div>
          <p class="priority-driver">Primary driver: <strong>${escapeHtml(priority.driver)}</strong></p>
          <p class="priority-action">${escapeHtml(priority.recommendedAction)}</p>
        </article>
      `
    )
    .join('');
}

function updateDriverTable(data) {
  const drivers = riskDrivers(data);
  const root = document.getElementById('driverTable');
  if (!root) return;

  root.innerHTML = drivers
    .map(
      driver => `
        <div class="driver-row">
          <div>
            <div class="driver-label">${escapeHtml(driver.label)}</div>
            <div class="driver-desc">${escapeHtml(driver.description)}</div>
          </div>
          <div class="driver-metric">
            <strong>${driver.share}%</strong>
            <span>${driver.count} students</span>
          </div>
        </div>
      `
    )
    .join('');
}

function updateFactorBars(data) {
  const factors = topFactors(data);
  const max = factors[0]?.[1] || 1;
  const total = data.length;
  const root = document.getElementById('factorBarsContainer');
  if (!root) return;

  root.innerHTML = factors.length
    ? factors
        .map(
          ([label, count], index) => `
            <div class="factor-row">
              <span class="factor-label">${escapeHtml(label)}</span>
              <div class="factor-bar-bg">
                <div class="factor-bar-fill" style="width:${(count / max) * 100}%;opacity:${1 - index * 0.07}"></div>
              </div>
              <span class="factor-count">${count}/${total}</span>
            </div>
          `
        )
        .join('')
    : '<p class="widget-desc">No factor data available for the current filters.</p>';
}

function updateInsights(data) {
  const insights = generateInsights(data);
  const root = document.getElementById('insightsContainer');
  if (!root) return;

  root.innerHTML = insights
    .map(
      (insight, index) => `
        <div class="insight-card" data-insight="${index}" style="--i:${index}">
          <span class="insight-icon">${escapeHtml(insight.icon)}</span>
          <p class="insight-text">${escapeHtml(insight.text)}</p>
          <span class="insight-action">Apply filter</span>
        </div>
      `
    )
    .join('');

  root.querySelectorAll('.insight-card').forEach((card, index) => {
    card.addEventListener('click', () => {
      const insight = insights[index];
      if (!insight?.filter) return;

      Object.entries(insight.filter).forEach(([key, value]) => {
        state.filters[key] = value;
      });
      syncFilterUI();
      onFilterChange();
    });
  });
}

function updateSimulator() {
  const slider = document.getElementById('simSlider');
  if (!slider) return;

  const value = parseInt(slider.value, 10);
  const data = getFiltered();
  const { before, after } = simulateAttendance(data, value);
  const total = before.total || 1;

  document.getElementById('simValue').textContent = `+${value}%`;
  const projectedShift = after.high - before.high;
  document.getElementById('simOutcome').textContent =
    projectedShift < 0
      ? `${Math.abs(projectedShift)} fewer students remain at risk.`
      : projectedShift > 0
        ? `${projectedShift} more students remain at risk.`
        : 'No change in high-risk count at the current threshold.';

  const renderBar = (id, beforeValue, afterValue, color) => {
    const root = document.getElementById(id);
    if (!root) return;

    root.innerHTML = `
      <div class="sim-bar-track">
        <div class="sim-bar-fill" style="width:${(beforeValue / total) * 100}%;background:${color}"></div>
        <div class="sim-bar-ghost" style="width:${(afterValue / total) * 100}%;border-color:${color}"></div>
      </div>
      <div class="sim-bar-labels">
        <span>${beforeValue} now</span>
        <span class="sim-predicted">to ${afterValue} projected</span>
      </div>
    `;
  };

  renderBar('simHigh', before.high, after.high, '#ff5c72');
  renderBar('simMed', before.medium, after.medium, '#f5a623');
  renderBar('simLow', before.low, after.low, '#0dca73');
}

function setDrillDown(type, value) {
  if (state.drillDown && state.drillDown.type === type && state.drillDown.value === value) {
    state.drillDown = null;
  } else {
    state.drillDown = { type, value };
  }
  updateAllCharts();
}

function updateDrillBanner() {
  const root = document.getElementById('drillBanner');
  if (!root) return;

  if (state.drillDown) {
    root.innerHTML = `
      <span>Focusing on ${escapeHtml(cap(state.drillDown.value))} ${escapeHtml(state.drillDown.type)}</span>
      <button id="drillExit" class="drill-exit">Reset</button>
    `;
    root.classList.add('active');
    document.getElementById('drillExit')?.addEventListener('click', () => {
      state.drillDown = null;
      updateAllCharts();
    });
  } else {
    root.classList.remove('active');
    root.innerHTML = '';
  }
}

function syncFilterUI() {
  ['area', 'economicStatus', 'riskLevel'].forEach(key => {
    const select = document.getElementById(`filter_${key}`);
    if (select) select.value = state.filters[key];
  });

  const pills = document.getElementById('filterPills');
  if (!pills) return;

  const active = Object.entries(state.filters).filter(([, value]) => value !== 'all');
  pills.innerHTML = active
    .map(
      ([key, value]) => `
        <span class="filter-chip">
          ${escapeHtml(cap(value))}
          <button data-key="${escapeHtml(key)}" class="chip-x">x</button>
        </span>
      `
    )
    .join('');

  pills.querySelectorAll('.chip-x').forEach(button => {
    button.addEventListener('click', () => {
      state.filters[button.dataset.key] = 'all';
      syncFilterUI();
      onFilterChange();
    });
  });
}

function updateRiskChart(data) {
  const kpis = computeKPIs(data);
  const theme = getTheme();

  if (state.charts.risk) {
    state.charts.risk.data.datasets[0].data = [kpis.high, kpis.medium, kpis.low];
    state.charts.risk.update('active');
    return;
  }

  state.charts.risk = new Chart(document.getElementById('chRisk'), {
    type: 'doughnut',
    data: {
      labels: ['High', 'Medium', 'Low'],
      datasets: [
        {
          data: [kpis.high, kpis.medium, kpis.low],
          backgroundColor: [theme.accentRed, theme.accentAmber, theme.accentGreen],
          borderColor: theme.appBg,
          borderWidth: 3,
          hoverOffset: 8,
        },
      ],
    },
    options: {
      cutout: '72%',
      animation: { animateRotate: true, duration: 800 },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: theme.textSecondary, font: { family: 'Inter', size: 11 }, padding: 14 },
        },
        tooltip: tooltipConfig(theme),
      },
      onClick: (_, elements) => {
        if (!elements.length) return;
        const level = ['high', 'medium', 'low'][elements[0].index];
        setDrillDown('status', level);
      },
    },
  });
}

function updateAreaChart(data) {
  const areas = riskByArea(data);
  const labels = Object.keys(areas).map(cap);
  const theme = getTheme();
  const scales = scaleConfig(theme);

  if (state.charts.area) {
    state.charts.area.data.labels = labels;
    state.charts.area.data.datasets[0].data = Object.values(areas).map(value => value.high);
    state.charts.area.data.datasets[1].data = Object.values(areas).map(value => value.medium);
    state.charts.area.data.datasets[2].data = Object.values(areas).map(value => value.low);
    state.charts.area.update('active');
    return;
  }

  state.charts.area = new Chart(document.getElementById('chArea'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'High', data: Object.values(areas).map(value => value.high), backgroundColor: theme.accentRed, borderRadius: 4, borderSkipped: false },
        { label: 'Medium', data: Object.values(areas).map(value => value.medium), backgroundColor: theme.accentAmber, borderRadius: 4, borderSkipped: false },
        { label: 'Low', data: Object.values(areas).map(value => value.low), backgroundColor: theme.accentGreen, borderRadius: 4, borderSkipped: false },
      ],
    },
    options: {
      animation: { duration: 800 },
      scales: {
        x: { ...scales, stacked: true },
        y: { ...scales, stacked: true, beginAtZero: true },
      },
      plugins: {
        legend: { labels: { color: theme.textSecondary, font: { family: 'Inter', size: 11 }, padding: 14 } },
        tooltip: tooltipConfig(theme),
      },
      onClick: (_, elements) => {
        if (!elements.length) return;
        const area = Object.keys(areas)[elements[0].index];
        setDrillDown('area', area);
      },
    },
  });
}

function updateDriverChart(data) {
  const drivers = riskDrivers(data);
  const theme = getTheme();
  const scales = scaleConfig(theme);

  if (state.charts.driver) {
    state.charts.driver.data.labels = drivers.map(driver => driver.label);
    state.charts.driver.data.datasets[0].data = drivers.map(driver => driver.share);
    state.charts.driver.update('active');
    return;
  }

  state.charts.driver = new Chart(document.getElementById('chDrivers'), {
    type: 'bar',
    data: {
      labels: drivers.map(driver => driver.label),
      datasets: [
        {
          label: 'Affected %',
          data: drivers.map(driver => driver.share),
          backgroundColor: [
            theme.accentPurple,
            theme.accentBlue,
            theme.accentAmber,
            theme.accentGreen,
            theme.accentRed,
          ],
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      animation: { duration: 800 },
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

function updateGradeChart(data) {
  const grades = gradeRiskDistribution(data);
  const labels = Object.keys(grades);
  const theme = getTheme();
  const scales = scaleConfig(theme);

  if (state.charts.grade) {
    state.charts.grade.data.labels = labels;
    state.charts.grade.data.datasets[0].data = Object.values(grades).map(value => value.high);
    state.charts.grade.data.datasets[1].data = Object.values(grades).map(value => value.medium);
    state.charts.grade.data.datasets[2].data = Object.values(grades).map(value => value.low);
    state.charts.grade.update('active');
    return;
  }

  state.charts.grade = new Chart(document.getElementById('chGrade'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'High', data: Object.values(grades).map(value => value.high), backgroundColor: theme.accentRed, borderRadius: 4, borderSkipped: false },
        { label: 'Medium', data: Object.values(grades).map(value => value.medium), backgroundColor: theme.accentAmber, borderRadius: 4, borderSkipped: false },
        { label: 'Low', data: Object.values(grades).map(value => value.low), backgroundColor: theme.accentGreen, borderRadius: 4, borderSkipped: false },
      ],
    },
    options: {
      animation: { duration: 800 },
      plugins: {
        legend: { labels: { color: theme.textSecondary, font: { family: 'Inter', size: 11 }, padding: 14 } },
        tooltip: tooltipConfig(theme),
      },
      scales: {
        x: scales,
        y: { ...scales, beginAtZero: true },
      },
    },
  });
}

function updatePressureChart(data) {
  const pressure = areaPressureIndex(data);
  const theme = getTheme();
  const scales = scaleConfig(theme);

  if (state.charts.pressure) {
    state.charts.pressure.data.labels = pressure.map(item => cap(item.area));
    state.charts.pressure.data.datasets[0].data = pressure.map(item => item.pressureScore);
    state.charts.pressure.update('active');
    return;
  }

  state.charts.pressure = new Chart(document.getElementById('chPressure'), {
    type: 'line',
    data: {
      labels: pressure.map(item => cap(item.area)),
      datasets: [
        {
          label: 'Risk Level',
          data: pressure.map(item => item.pressureScore),
          borderColor: theme.accentPurple,
          backgroundColor: `${theme.accentPurple}20`,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: theme.accentPurple,
          pointRadius: 4,
        },
      ],
    },
    options: {
      animation: { duration: 800 },
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

function updateRadarChart(data) {
  const radar = radarByArea(data);
  const theme = getTheme();
  const colors = {
    rural: theme.accentRed,
    urban: theme.accentPurple,
    'semi-urban': theme.accentGreen,
  };

  const labels = ['Attendance', 'GPA x10', 'Distance', 'Failures x20', 'Economic risk x30'];
  const datasets = Object.keys(radar).map(area => {
    const value = radar[area];
    const color = colors[area] || theme.accentBlue;
    return {
      label: cap(area),
      data: [
        value.attendance,
        value.gpa * 10,
        value.distance,
        value.failures * 20,
        value.economicRisk * 30,
      ],
      backgroundColor: `${color}22`,
      borderColor: color,
      borderWidth: 2,
      pointBackgroundColor: color,
      pointRadius: 4,
    };
  });

  if (state.charts.radar) {
    state.charts.radar.data.datasets = datasets;
    state.charts.radar.update('active');
    return;
  }

  state.charts.radar = new Chart(document.getElementById('chRadar'), {
    type: 'radar',
    data: { labels, datasets },
    options: {
      animation: { duration: 800 },
      scales: {
        r: {
          angleLines: { color: theme.cardBorder },
          grid: { color: theme.cardBorder },
          pointLabels: { color: theme.textSecondary, font: { family: 'Inter', size: 10 } },
          ticks: { display: false },
        },
      },
      plugins: {
        legend: { labels: { color: theme.textSecondary, font: { family: 'Inter', size: 11 }, padding: 14 } },
        tooltip: tooltipConfig(theme),
      },
    },
  });
}

function updateEconomicChart(data) {
  const economics = economicCounts(data);
  const theme = getTheme();

  if (state.charts.economic) {
    state.charts.economic.data.datasets[0].data = [economics.low, economics.mid, economics.high];
    state.charts.economic.update('active');
    return;
  }

  state.charts.economic = new Chart(document.getElementById('chEco'), {
    type: 'pie',
    data: {
      labels: ['Low income', 'Mid income', 'High income'],
      datasets: [
        {
          data: [economics.low, economics.mid, economics.high],
          backgroundColor: [theme.accentRed, theme.accentAmber, theme.accentGreen],
          borderColor: theme.appBg,
          borderWidth: 3,
          hoverOffset: 8,
        },
      ],
    },
    options: {
      animation: { duration: 800 },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: theme.textSecondary, font: { family: 'Inter', size: 11 }, padding: 14 },
        },
        tooltip: tooltipConfig(theme),
      },
      onClick: (_, elements) => {
        if (!elements.length) return;
        const value = ['low', 'mid', 'high'][elements[0].index];
        setDrillDown('economicStatus', value);
      },
    },
  });
}

function updateAttendanceChart(data) {
  const attendance = attendanceByArea(data);
  const theme = getTheme();
  const scales = scaleConfig(theme);

  if (state.charts.attendance) {
    state.charts.attendance.data.labels = Object.keys(attendance).map(cap);
    state.charts.attendance.data.datasets[0].data = Object.values(attendance);
    state.charts.attendance.update('active');
    return;
  }

  state.charts.attendance = new Chart(document.getElementById('chAtt'), {
    type: 'bar',
    data: {
      labels: Object.keys(attendance).map(cap),
      datasets: [
        {
          label: 'Avg attendance %',
          data: Object.values(attendance),
          backgroundColor: [theme.accentPurple, theme.accentGreen, theme.accentBlue],
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    },
    options: {
      animation: { duration: 800 },
      plugins: {
        legend: { display: false },
        tooltip: tooltipConfig(theme),
      },
      scales: {
        x: scales,
        y: {
          ...scales,
          min: 40,
          max: 100,
          ticks: { ...scales.ticks, callback: value => `${value}%` },
        },
      },
    },
  });
}

function updateAllCharts() {
  const data = getFiltered();
  updateKPIs(data);
  updateNarrative(data);
  updatePriorityList(data);
  updateDriverTable(data);
  updateRiskChart(data);
  updateAreaChart(data);
  updateDriverChart(data);
  updateGradeChart(data);
  updatePressureChart(data);
  updateRadarChart(data);
  updateEconomicChart(data);
  updateAttendanceChart(data);
  updateFactorBars(data);
  updateInsights(data);
  updateSimulator();
  updateDrillBanner();
}

function onFilterChange() {
  destroyCharts();
  updateAllCharts();
}

export async function renderAnalytics() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <section class="page">
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading student support info...</p>
      </div>
    </section>
  `;

  try {
    state.all = await getAllStudents();
    state.filters = { area: 'all', economicStatus: 'all', riskLevel: 'all' };
    state.drillDown = null;
    destroyCharts();

    const areas = [...new Set(state.all.map(student => student.area))];
    const economicStatuses = [...new Set(state.all.map(student => student.economicStatus))];

    app.innerHTML = `
      <section class="page analytics-lab">
        <div class="page-header analytics-header">
          <div>
            <h1 class="page-title">Student Support Center</h1>
            <p class="page-subtitle">Find where help is needed, locate students needing support, and identify support priorities for student retention.</p>
          </div>
        </div>

        <section class="analytics-narrative" id="analyticsNarrative"></section>

        <div id="drillBanner" class="drill-banner"></div>

        <div class="analytics-filter-bar">
          <div class="filter-group">
            <label>Area</label>
            <select id="filter_area" class="filter-select-analytics">
              <option value="all">All areas</option>
              ${areas.map(area => `<option value="${escapeHtml(area)}">${escapeHtml(cap(area))}</option>`).join('')}
            </select>
          </div>
          <div class="filter-group">
            <label>Economic</label>
            <select id="filter_economicStatus" class="filter-select-analytics">
              <option value="all">All groups</option>
              ${economicStatuses.map(status => `<option value="${escapeHtml(status)}">${escapeHtml(cap(status))}</option>`).join('')}
            </select>
          </div>
          <div class="filter-group">
            <label>Risk level</label>
            <select id="filter_riskLevel" class="filter-select-analytics">
              <option value="all">All levels</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <button id="resetFilters" class="filter-reset-btn">Reset</button>
          <div id="filterPills" class="filter-pills"></div>
        </div>

        <div class="analytics-summary analytics-summary-expanded">
          <div class="asummary-item" style="--i:0">
            <span class="asummary-value" id="kpiTotal" style="color:var(--accent-purple)">0</span>
            <span class="asummary-label">Students in view</span>
          </div>
          <div class="asummary-item" style="--i:1">
            <span class="asummary-value" id="kpiHigh" style="color:var(--accent-red)">0</span>
            <span class="asummary-label">High risk students</span>
          </div>
          <div class="asummary-item" style="--i:2">
            <span class="asummary-value" id="kpiRisk" style="color:var(--accent-amber)">0</span>
            <span class="asummary-label">Average risk score</span>
          </div>
          <div class="asummary-item" style="--i:3">
            <span class="asummary-value" id="kpiAtt" data-suffix="%" style="color:var(--accent-green)">0</span>
            <span class="asummary-label">Average attendance</span>
          </div>
          <div class="asummary-item analytics-mini-card" style="--i:4">
            <span class="analytics-mini-label">Primary hotspot</span>
            <strong id="kpiHotspot">None</strong>
          </div>
          <div class="asummary-item analytics-mini-card" style="--i:5">
            <span class="analytics-mini-label">Leading driver</span>
            <strong id="kpiDriver">No dominant driver</strong>
          </div>
        </div>

        <div class="chart-card wide simulator-card" style="--i:6">
          <p class="chart-title">Attendance Helper Tool</p>
          <p class="chart-sub">Estimate how attendance improvement could shift students out of high-risk status.</p>
          <div class="sim-controls">
            <label class="sim-label">Target attendance improvement <strong id="simValue">+0%</strong></label>
            <input type="range" id="simSlider" class="sim-slider" min="0" max="30" value="0" step="1" />
            <p class="sim-outcome" id="simOutcome"></p>
          </div>
          <div class="sim-results">
            <div class="sim-row"><span class="sim-row-label" style="color:#ff5c72">High risk</span><div id="simHigh" class="sim-bar-container"></div></div>
            <div class="sim-row"><span class="sim-row-label" style="color:#f5a623">Medium</span><div id="simMed" class="sim-bar-container"></div></div>
            <div class="sim-row"><span class="sim-row-label" style="color:#0dca73">Low</span><div id="simLow" class="sim-bar-container"></div></div>
          </div>
        </div>

        <div class="analytics-grid analytics-grid-rich">
          <div class="chart-card" style="--i:7">
            <p class="chart-title">Risk Distribution</p>
            <p class="chart-sub">Click a segment to focus on a risk band.</p>
            <div class="chart-compact"><canvas id="chRisk"></canvas></div>
          </div>

          <div class="chart-card" style="--i:8">
            <p class="chart-title">Support Priority Areas</p>
            <p class="chart-sub">Areas where action is most urgent.</p>
            <div id="priorityList" class="priority-list"></div>
          </div>

          <div class="chart-card" style="--i:9">
            <p class="chart-title">Risk by Area</p>
            <p class="chart-sub">Stacked breakdown of high, medium, and low risk.</p>
            <canvas id="chArea"></canvas>
          </div>

          <div class="chart-card" style="--i:10">
            <p class="chart-title">Common Dropout Reasons</p>
            <p class="chart-sub">What is most affecting the focus cohort right now.</p>
            <canvas id="chDrivers"></canvas>
          </div>

          <div class="chart-card wide" style="--i:11">
            <p class="chart-title">Issues Table</p>
            <p class="chart-sub">Detailed view of the strongest contributing factors.</p>
            <div id="driverTable" class="driver-table"></div>
          </div>

          <div class="chart-card" style="--i:12">
            <p class="chart-title">Risk by Grade</p>
            <p class="chart-sub">Which classes show the heaviest concentration of risk.</p>
            <canvas id="chGrade"></canvas>
          </div>

          <div class="chart-card" style="--i:13">
            <p class="chart-title">Area Risk Level</p>
            <p class="chart-sub">Composite pressure score by location group.</p>
            <canvas id="chPressure"></canvas>
          </div>

          <div class="chart-card" style="--i:14">
            <p class="chart-title">Area Risk Comparison</p>
            <p class="chart-sub">Compare attendance, academics, commute, and failure burden.</p>
            <canvas id="chRadar"></canvas>
          </div>

          <div class="chart-card" style="--i:15">
            <p class="chart-title">Financial Status</p>
            <p class="chart-sub">Click a segment to focus on one economic group.</p>
            <div class="chart-compact"><canvas id="chEco"></canvas></div>
          </div>

          <div class="chart-card" style="--i:16">
            <p class="chart-title">Attendance by Area</p>
            <p class="chart-sub">Average attendance level across location groups.</p>
            <canvas id="chAtt"></canvas>
          </div>

          <div class="chart-card wide" style="--i:17">
            <p class="chart-title">Main Risk Factors</p>
            <p class="chart-sub">Most common causes of dropout pressure in the selected cohort.</p>
            <div id="factorBarsContainer" class="factor-bars"></div>
          </div>
        </div>

        <div class="chart-card wide insights-section" style="--i:18">
          <p class="chart-title">System Advice</p>
          <p class="chart-sub">Auto-generated guidance from current cohort patterns. Click an insight to apply its suggested filter.</p>
          <div id="insightsContainer" class="insights-grid"></div>
        </div>
      </section>
    `;

    ['area', 'economicStatus', 'riskLevel'].forEach(key => {
      document.getElementById(`filter_${key}`)?.addEventListener('change', event => {
        state.filters[key] = event.target.value;
        state.drillDown = null;
        syncFilterUI();
        onFilterChange();
      });
    });

    document.getElementById('resetFilters')?.addEventListener('click', () => {
      state.filters = { area: 'all', economicStatus: 'all', riskLevel: 'all' };
      state.drillDown = null;
      syncFilterUI();
      onFilterChange();
    });

    document.getElementById('simSlider')?.addEventListener('input', updateSimulator);

    syncFilterUI();
    updateAllCharts();
  } catch (error) {
    app.innerHTML = `
      <section class="page">
        <div class="loading-state">
          <h2>Failed to load analytics</h2>
          <p>${escapeHtml(error.message)}</p>
        </div>
      </section>
    `;
  }
}

window.addEventListener('themeToggled', () => {
  if (!Object.keys(state.charts).length) return;

  const theme = getTheme();
  Object.values(state.charts).forEach(chart => {
    if (chart.options.plugins?.legend?.labels) {
      chart.options.plugins.legend.labels.color = theme.textSecondary;
    }
    if (chart.options.plugins?.tooltip) {
      Object.assign(chart.options.plugins.tooltip, {
        backgroundColor: theme.appBg,
        borderColor: theme.cardBorder,
        titleColor: theme.textPrimary,
        bodyColor: theme.textSecondary,
      });
    }
    if (chart.options.scales?.x) {
      chart.options.scales.x.grid.color = theme.cardBorder;
      chart.options.scales.x.ticks.color = theme.textMuted;
    }
    if (chart.options.scales?.y) {
      chart.options.scales.y.grid.color = theme.cardBorder;
      chart.options.scales.y.ticks.color = theme.textMuted;
    }
    if (chart.options.scales?.r) {
      chart.options.scales.r.grid.color = theme.cardBorder;
      chart.options.scales.r.angleLines.color = theme.cardBorder;
      chart.options.scales.r.pointLabels.color = theme.textSecondary;
    }
    if (chart.config.type === 'doughnut' || chart.config.type === 'pie') {
      chart.data.datasets[0].borderColor = theme.appBg;
    }
    chart.update();
  });
});
