import Chart from 'chart.js/auto';
import {
  students,
  countByStatus,
  countByArea,
  countByEconomicStatus,
  avgAttendanceByArea,
  topRiskFactors,
} from '../services/studentService.js';

export function renderAnalytics() {
  const { high, medium, low } = countByStatus();

  document.getElementById('app').innerHTML = `
    <section class="page">

      <div class="page-header">
        <div class="page-title-group">
          <h1 class="page-title">Analytics</h1>
          <p class="page-subtitle">
            Key factors contributing to student dropout risk.
          </p>
        </div>
      </div>

      <!-- ── Summary Strip ── -->
      <div class="analytics-summary">
        <div class="asummary-item">
          <span class="asummary-value" style="color:var(--risk-high)">
            ${high}
          </span>
          <span class="asummary-label">High Risk Students</span>
        </div>
        <div class="asummary-divider"></div>
        <div class="asummary-item">
          <span class="asummary-value" style="color:var(--risk-med)">
            ${medium}
          </span>
          <span class="asummary-label">Medium Risk Students</span>
        </div>
        <div class="asummary-divider"></div>
        <div class="asummary-item">
          <span class="asummary-value" style="color:var(--risk-low)">
            ${low}
          </span>
          <span class="asummary-label">Low Risk Students</span>
        </div>
        <div class="asummary-divider"></div>
        <div class="asummary-item">
          <span class="asummary-value" style="color:var(--blue-400)">
            ${Math.round(high / students.length * 100)}%
          </span>
          <span class="asummary-label">At High Risk Rate</span>
        </div>
      </div>

      <!-- ── Charts Grid ── -->
      <div class="analytics-grid">

        <!-- Top Risk Factors — full width -->
        <div class="chart-card wide">
          <p class="chart-title">Top Risk Factors</p>
          <p class="chart-sub">
            Most common factors driving dropout risk
          </p>
          <div id="factorBars" class="factor-bars"></div>
        </div>

        <!-- Risk Distribution -->
        <div class="chart-card">
          <p class="chart-title">Risk Distribution</p>
          <p class="chart-sub">Students by risk level</p>
          <div class="chart-wrap">
            <canvas id="riskChart"></canvas>
          </div>
        </div>

        <!-- Students by Area -->
        <div class="chart-card">
          <p class="chart-title">Students by Area</p>
          <p class="chart-sub">Rural vs semi-urban vs urban</p>
          <div class="chart-wrap">
            <canvas id="areaChart"></canvas>
          </div>
        </div>

        <!-- Economic Status -->
        <div class="chart-card">
          <p class="chart-title">Economic Status</p>
          <p class="chart-sub">Income distribution</p>
          <div class="chart-wrap">
            <canvas id="ecoChart"></canvas>
          </div>
        </div>

        <!-- Avg Attendance -->
        <div class="chart-card">
          <p class="chart-title">Avg Attendance by Area</p>
          <p class="chart-sub">Attendance % across locations</p>
          <div class="chart-wrap">
            <canvas id="attendanceChart"></canvas>
          </div>
        </div>

      </div>
    </section>
  `;

  buildFactorBars();
  buildRiskChart();
  buildAreaChart();
  buildEcoChart();
  buildAttendanceChart();
}

// ── Shared Chart.js defaults ──
const CHART_DEFAULTS = {
  plugins: {
    legend: {
      labels: {
        color: '#8899aa',
        font: { size: 12 },
        padding: 16,
      }
    },
    tooltip: {
      backgroundColor: '#0f1729',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      titleColor: '#f0f6ff',
      bodyColor: '#8899aa',
      padding: 12,
    }
  }
};

const SCALE_DEFAULTS = {
  x: {
    grid:  { color: 'rgba(255,255,255,0.04)' },
    ticks: { color: '#8899aa', font: { size: 11 } },
  },
  y: {
    grid:  { color: 'rgba(255,255,255,0.04)' },
    ticks: { color: '#8899aa', font: { size: 11 } },
  }
};

// ── Factor Bars (custom HTML) ──
function buildFactorBars() {
  const factors = topRiskFactors();
  const max     = factors[0]?.[1] || 1;
  const total   = students.length;

  document.getElementById('factorBars').innerHTML =
    factors.map(([label, count], i) => `
      <div class="factor-row">
        <span class="factor-label">${label}</span>
        <div class="factor-bar-bg">
          <div class="factor-bar-fill"
               style="width:${(count / max) * 100}%;
                      opacity:${1 - i * 0.1}">
          </div>
        </div>
        <span class="factor-count">${count}/${total}</span>
      </div>
    `).join('');
}

// ── Risk Distribution Doughnut ──
function buildRiskChart() {
  const { high, medium, low } = countByStatus();
  new Chart(document.getElementById('riskChart'), {
    type: 'doughnut',
    data: {
      labels: ['High Risk', 'Medium Risk', 'Low Risk'],
      datasets: [{
        data:            [high, medium, low],
        backgroundColor: ['#f87171', '#fb923c', '#4ade80'],
        borderColor:     '#0f1729',
        borderWidth:     3,
        hoverOffset:     6,
      }],
    },
    options: {
      cutout: '68%',
      ...CHART_DEFAULTS,
      plugins: {
        ...CHART_DEFAULTS.plugins,
        legend: {
          ...CHART_DEFAULTS.plugins.legend,
          position: 'bottom',
        }
      }
    },
  });
}

// ── Area Bar Chart ──
function buildAreaChart() {
  const areas = countByArea();
  new Chart(document.getElementById('areaChart'), {
    type: 'bar',
    data: {
      labels: Object.keys(areas).map(
        a => a.charAt(0).toUpperCase() + a.slice(1)
      ),
      datasets: [{
        label:           'Students',
        data:            Object.values(areas),
        backgroundColor: ['#3b82f6', '#4ade80', '#fb923c'],
        borderColor:     ['#2563eb', '#22c55e', '#ea580c'],
        borderWidth:     1,
        borderRadius:    6,
        borderSkipped:   false,
      }],
    },
    options: {
      ...CHART_DEFAULTS,
      plugins: {
        ...CHART_DEFAULTS.plugins,
        legend: { display: false }
      },
      scales: {
        ...SCALE_DEFAULTS,
        y: {
          ...SCALE_DEFAULTS.y,
          beginAtZero: true,
          ticks: {
            ...SCALE_DEFAULTS.y.ticks,
            stepSize: 10,
          }
        }
      },
    },
  });
}

// ── Economic Status Pie ──
function buildEcoChart() {
  const eco = countByEconomicStatus();
  new Chart(document.getElementById('ecoChart'), {
    type: 'pie',
    data: {
      labels: ['Low Income', 'Mid Income', 'High Income'],
      datasets: [{
        data:            [eco.low, eco.mid, eco.high],
        backgroundColor: ['#f87171', '#fb923c', '#4ade80'],
        borderColor:     '#0f1729',
        borderWidth:     3,
        hoverOffset:     6,
      }],
    },
    options: {
      ...CHART_DEFAULTS,
      plugins: {
        ...CHART_DEFAULTS.plugins,
        legend: {
          ...CHART_DEFAULTS.plugins.legend,
          position: 'bottom',
        }
      }
    },
  });
}

// ── Attendance by Area Bar ──
function buildAttendanceChart() {
  const data = avgAttendanceByArea();
  new Chart(document.getElementById('attendanceChart'), {
    type: 'bar',
    data: {
      labels: Object.keys(data).map(
        a => a.charAt(0).toUpperCase() + a.slice(1)
      ),
      datasets: [{
        label:           'Avg Attendance %',
        data:            Object.values(data),
        backgroundColor: ['#3b82f6', '#4ade80', '#fb923c'],
        borderColor:     ['#2563eb', '#22c55e', '#ea580c'],
        borderWidth:     1,
        borderRadius:    6,
        borderSkipped:   false,
      }],
    },
    options: {
      ...CHART_DEFAULTS,
      plugins: {
        ...CHART_DEFAULTS.plugins,
        legend: { display: false }
      },
      scales: {
        ...SCALE_DEFAULTS,
        y: {
          ...SCALE_DEFAULTS.y,
          min: 50,
          max: 100,
          ticks: {
            ...SCALE_DEFAULTS.y.ticks,
            callback: v => v + '%',
          }
        }
      },
    },
  });
}