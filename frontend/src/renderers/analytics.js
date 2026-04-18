import Chart from 'chart.js/auto';
import { getAllStudents } from '../services/studentService.js';
import {
  filterData, computeKPIs, riskByArea, attendanceByArea,
  economicCounts, topFactors, radarByArea, simulateAttendance, generateInsights
} from '../utils/analyticsEngine.js';

let state = { all: [], filters: { area: 'all', economicStatus: 'all', riskLevel: 'all' }, charts: {}, drillDown: null };

function getTheme() {
  const s = getComputedStyle(document.body);
  return {
    t1: s.getPropertyValue('--t1').trim() || '#fff',
    t2: s.getPropertyValue('--t2').trim() || '#a1a1a1',
    t3: s.getPropertyValue('--t3').trim() || '#717171',
    b1: s.getPropertyValue('--b1').trim() || 'rgba(255,255,255,0.08)',
    bg: s.getPropertyValue('--bg').trim() || '#030303',
    bgR: s.getPropertyValue('--bg-raised').trim() || '#1a1a1a',
  };
}

function tooltipConfig(c) {
  return { backgroundColor: c.bgR, borderColor: c.b1, borderWidth: 1, titleColor: c.t1, bodyColor: c.t2, titleFont: { family: 'Plus Jakarta Sans', weight: '700', size: 13 }, bodyFont: { family: 'Inter', size: 12 }, padding: 12, cornerRadius: 8, displayColors: true, boxPadding: 4 };
}

function scaleConfig(c) {
  return { grid: { color: c.b1 }, ticks: { color: c.t3, font: { family: 'Inter', size: 10 } } };
}

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

function destroyCharts() {
  Object.values(state.charts).forEach(c => { try { c.destroy(); } catch(e){} });
  state.charts = {};
}

function getFiltered() {
  let data = filterData(state.all, state.filters);
  if (state.drillDown) {
    const { type, value } = state.drillDown;
    data = data.filter(s => s[type] === value);
  }
  return data;
}

// ── Animated counter ──
function animateValue(el, end) {
  const start = parseInt(el.textContent) || 0;
  const dur = 600;
  const t0 = performance.now();
  const suffix = el.dataset.suffix || '';
  function tick(now) {
    const p = Math.min((now - t0) / dur, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(start + (end - start) * ease) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function updateKPIs(data) {
  const k = computeKPIs(data);
  const map = { kpiTotal: k.total, kpiHigh: k.high, kpiAtt: k.avgAtt, kpiRate: k.highRate };
  Object.entries(map).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) animateValue(el, val);
  });
}

// ── Build / Update Charts ──
function updateAllCharts() {
  const data = getFiltered();
  updateKPIs(data);
  updateRiskChart(data);
  updateAreaChart(data);
  updateEcoChart(data);
  updateAttChart(data);
  updateRadarChart(data);
  updateFactorBars(data);
  updateSimulator();
  updateInsights(data);
  updateDrillBanner();
}

function updateRiskChart(data) {
  const k = computeKPIs(data);
  const c = getTheme();
  if (state.charts.risk) {
    state.charts.risk.data.datasets[0].data = [k.high, k.medium, k.low];
    state.charts.risk.update('active');
    return;
  }
  state.charts.risk = new Chart(document.getElementById('chRisk'), {
    type: 'doughnut',
    data: { labels: ['High', 'Medium', 'Low'], datasets: [{ data: [k.high, k.medium, k.low], backgroundColor: ['#ff5c72', '#f5a623', '#0dca73'], borderColor: c.bg, borderWidth: 3, hoverOffset: 8 }] },
    options: {
      cutout: '72%', animation: { animateRotate: true, duration: 800 },
      plugins: { legend: { position: 'bottom', labels: { color: c.t2, font: { family: 'Inter', size: 11 }, padding: 14 } }, tooltip: tooltipConfig(c) },
      onClick: (_, els) => { if (els.length) { const lvl = ['high', 'medium', 'low'][els[0].index]; setDrillDown('status', lvl); } }
    }
  });
}

function updateAreaChart(data) {
  const areas = riskByArea(data);
  const labels = Object.keys(areas).map(cap);
  const c = getTheme();
  if (state.charts.area) {
    state.charts.area.data.labels = labels;
    state.charts.area.data.datasets[0].data = Object.values(areas).map(v => v.high);
    state.charts.area.data.datasets[1].data = Object.values(areas).map(v => v.medium);
    state.charts.area.data.datasets[2].data = Object.values(areas).map(v => v.low);
    state.charts.area.update('active');
    return;
  }
  const SX = scaleConfig(c);
  state.charts.area = new Chart(document.getElementById('chArea'), {
    type: 'bar',
    data: { labels, datasets: [
      { label: 'High', data: Object.values(areas).map(v => v.high), backgroundColor: '#ff5c72', borderRadius: 4, borderSkipped: false },
      { label: 'Medium', data: Object.values(areas).map(v => v.medium), backgroundColor: '#f5a623', borderRadius: 4, borderSkipped: false },
      { label: 'Low', data: Object.values(areas).map(v => v.low), backgroundColor: '#0dca73', borderRadius: 4, borderSkipped: false },
    ]},
    options: {
      animation: { duration: 800 }, scales: { x: { ...SX, stacked: true }, y: { ...SX, stacked: true, beginAtZero: true } },
      plugins: { legend: { labels: { color: c.t2, font: { family: 'Inter', size: 11 }, padding: 14 } }, tooltip: tooltipConfig(c) },
      onClick: (_, els) => { if (els.length) { const area = Object.keys(areas)[els[0].index]; setDrillDown('area', area); } }
    }
  });
}

function updateEcoChart(data) {
  const eco = economicCounts(data);
  const c = getTheme();
  if (state.charts.eco) {
    state.charts.eco.data.datasets[0].data = [eco.low, eco.mid, eco.high];
    state.charts.eco.update('active');
    return;
  }
  state.charts.eco = new Chart(document.getElementById('chEco'), {
    type: 'pie',
    data: { labels: ['Low Income', 'Mid Income', 'High Income'], datasets: [{ data: [eco.low, eco.mid, eco.high], backgroundColor: ['#ff5c72', '#f5a623', '#0dca73'], borderColor: c.bg, borderWidth: 3, hoverOffset: 8 }] },
    options: {
      animation: { duration: 800 },
      plugins: { legend: { position: 'bottom', labels: { color: c.t2, font: { family: 'Inter', size: 11 }, padding: 14 } }, tooltip: tooltipConfig(c) },
      onClick: (_, els) => { if (els.length) { const eco = ['low', 'mid', 'high'][els[0].index]; setDrillDown('economicStatus', eco); } }
    }
  });
}

function updateAttChart(data) {
  const att = attendanceByArea(data);
  const labels = Object.keys(att).map(cap);
  const c = getTheme();
  const SX = scaleConfig(c);
  if (state.charts.att) {
    state.charts.att.data.labels = labels;
    state.charts.att.data.datasets[0].data = Object.values(att);
    state.charts.att.update('active');
    return;
  }
  state.charts.att = new Chart(document.getElementById('chAtt'), {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Avg Attendance %', data: Object.values(att), backgroundColor: ['#818cf8', '#0dca73', '#f5a623'], borderRadius: 6, borderSkipped: false }] },
    options: {
      animation: { duration: 800 },
      plugins: { legend: { display: false }, tooltip: tooltipConfig(c) },
      scales: { x: SX, y: { ...SX, min: 40, max: 100, ticks: { ...SX.ticks, callback: v => v + '%' } } }
    }
  });
}

function updateRadarChart(data) {
  const radar = radarByArea(data);
  const areaKeys = Object.keys(radar);
  const c = getTheme();
  const colors = { rural: '#ff5c72', urban: '#818cf8', 'semi-urban': '#0dca73' };
  const labels = ['Attendance', 'GPA (×10)', 'Distance (km)', 'Failures (×20)', 'Economic Risk (×30)'];
  const datasets = areaKeys.map(area => {
    const d = radar[area];
    return {
      label: cap(area), data: [d.attendance, d.gpa * 10, d.distance, d.failures * 20, d.economicRisk * 30],
      backgroundColor: (colors[area] || '#818cf8') + '22', borderColor: colors[area] || '#818cf8', borderWidth: 2, pointBackgroundColor: colors[area] || '#818cf8', pointRadius: 4,
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
      scales: { r: { angleLines: { color: c.b1 }, grid: { color: c.b1 }, pointLabels: { color: c.t2, font: { family: 'Inter', size: 10 } }, ticks: { display: false } } },
      plugins: { legend: { labels: { color: c.t2, font: { family: 'Inter', size: 11 }, padding: 14 } }, tooltip: tooltipConfig(c) }
    }
  });
}

function updateFactorBars(data) {
  const factors = topFactors(data);
  const max = factors[0]?.[1] || 1;
  const total = data.length;
  const el = document.getElementById('factorBarsContainer');
  if (!el) return;
  el.innerHTML = factors.map(([l, count], i) =>
    `<div class="factor-row"><span class="factor-label">${l}</span><div class="factor-bar-bg"><div class="factor-bar-fill" style="width:${(count / max) * 100}%;opacity:${1 - i * 0.07}"></div></div><span class="factor-count">${count}/${total}</span></div>`
  ).join('');
}

// ── Simulator ──
function updateSimulator() {
  const slider = document.getElementById('simSlider');
  if (!slider) return;
  const val = parseInt(slider.value);
  document.getElementById('simValue').textContent = `+${val}%`;
  const data = getFiltered();
  const { before, after } = simulateAttendance(data, val);
  const total = before.total || 1;

  const renderBar = (id, bVal, aVal, color) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = `<div class="sim-bar-track"><div class="sim-bar-fill" style="width:${(bVal / total) * 100}%;background:${color}"></div><div class="sim-bar-ghost" style="width:${(aVal / total) * 100}%;border-color:${color}"></div></div><div class="sim-bar-labels"><span>${bVal} now</span><span class="sim-predicted">→ ${aVal} predicted</span></div>`;
  };
  renderBar('simHigh', before.high, after.high, '#ff5c72');
  renderBar('simMed', before.medium, after.medium, '#f5a623');
  renderBar('simLow', before.low, after.low, '#0dca73');
}

// ── Insights ──
function updateInsights(data) {
  const insights = generateInsights(data);
  const el = document.getElementById('insightsContainer');
  if (!el) return;
  el.innerHTML = insights.map((ins, i) =>
    `<div class="insight-card" data-insight="${i}" style="--i:${i}"><span class="insight-icon">${ins.icon}</span><p class="insight-text">${ins.text}</p><span class="insight-action">Apply filter →</span></div>`
  ).join('');
  el.querySelectorAll('.insight-card').forEach((card, i) => {
    card.addEventListener('click', () => {
      const ins = insights[i];
      if (ins.filter) {
        Object.entries(ins.filter).forEach(([k, v]) => { state.filters[k] = v; });
        syncFilterUI();
        onFilterChange();
      }
    });
  });
}

// ── Drill-down ──
function setDrillDown(type, value) {
  if (state.drillDown && state.drillDown.type === type && state.drillDown.value === value) {
    state.drillDown = null;
  } else {
    state.drillDown = { type, value };
  }
  updateAllCharts();
}

function updateDrillBanner() {
  const el = document.getElementById('drillBanner');
  if (!el) return;
  if (state.drillDown) {
    el.innerHTML = `<span>🔍 Viewing: <strong>${cap(state.drillDown.value)}</strong> ${state.drillDown.type}</span><button id="drillExit" class="drill-exit">✕ Reset</button>`;
    el.classList.add('active');
    document.getElementById('drillExit')?.addEventListener('click', () => { state.drillDown = null; updateAllCharts(); });
  } else {
    el.classList.remove('active');
    el.innerHTML = '';
  }
}

// ── Filter UI ──
function syncFilterUI() {
  ['area', 'economicStatus', 'riskLevel'].forEach(k => {
    const sel = document.getElementById(`filter_${k}`);
    if (sel) sel.value = state.filters[k];
  });
  // Active filter pills
  const pills = document.getElementById('filterPills');
  if (!pills) return;
  const active = Object.entries(state.filters).filter(([, v]) => v !== 'all');
  pills.innerHTML = active.map(([k, v]) => `<span class="filter-chip">${cap(v)} <button data-key="${k}" class="chip-x">×</button></span>`).join('');
  pills.querySelectorAll('.chip-x').forEach(btn => {
    btn.addEventListener('click', () => { state.filters[btn.dataset.key] = 'all'; syncFilterUI(); onFilterChange(); });
  });
}

function onFilterChange() {
  destroyCharts();
  updateAllCharts();
}

// ── Main render ──
export async function renderAnalytics() {
  const app = document.getElementById('app');
  app.innerHTML = `<section class="page"><div class="loading-state"><div class="loading-spinner"></div><p>Initializing Analytics Lab…</p></div></section>`;

  try {
    state.all = await getAllStudents();
    state.filters = { area: 'all', economicStatus: 'all', riskLevel: 'all' };
    state.drillDown = null;
    destroyCharts();

    const areas = [...new Set(state.all.map(s => s.area))];
    const ecos = [...new Set(state.all.map(s => s.economicStatus))];

    app.innerHTML = `
      <section class="page analytics-lab">
        <div class="page-header"><div><h1 class="page-title">Analytics</h1><p class="page-subtitle">Interactive data exploration laboratory — filter, simulate, and discover insights.</p></div></div>

        <div id="drillBanner" class="drill-banner"></div>

        <div class="analytics-filter-bar">
          <div class="filter-group">
            <label>Area</label>
            <select id="filter_area" class="filter-select-analytics"><option value="all">All Areas</option>${areas.map(a => `<option value="${a}">${cap(a)}</option>`).join('')}</select>
          </div>
          <div class="filter-group">
            <label>Economic</label>
            <select id="filter_economicStatus" class="filter-select-analytics"><option value="all">All</option>${ecos.map(e => `<option value="${e}">${cap(e)}</option>`).join('')}</select>
          </div>
          <div class="filter-group">
            <label>Risk Level</label>
            <select id="filter_riskLevel" class="filter-select-analytics"><option value="all">All</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
          </div>
          <button id="resetFilters" class="filter-reset-btn">Reset</button>
          <div id="filterPills" class="filter-pills"></div>
        </div>

        <div class="analytics-summary">
          <div class="asummary-item" style="--i:0"><span class="asummary-value" id="kpiTotal" style="color:var(--accent-purple)">0</span><span class="asummary-label">Students</span></div>
          <div class="asummary-item" style="--i:1"><span class="asummary-value" id="kpiHigh" style="color:var(--accent-red)">0</span><span class="asummary-label">High Risk</span></div>
          <div class="asummary-item" style="--i:2"><span class="asummary-value" id="kpiAtt" data-suffix="%" style="color:var(--accent-green)">0</span><span class="asummary-label">Avg Attendance</span></div>
          <div class="asummary-item" style="--i:3"><span class="asummary-value" id="kpiRate" data-suffix="%" style="color:var(--accent-amber)">0</span><span class="asummary-label">High Risk Rate</span></div>
        </div>

        <div class="chart-card wide simulator-card" style="--i:4">
          <p class="chart-title">🧪 Scenario Simulator</p>
          <p class="chart-sub">What if we improve attendance? See predicted risk shift.</p>
          <div class="sim-controls">
            <label class="sim-label">Target Attendance Improvement: <strong id="simValue">+0%</strong></label>
            <input type="range" id="simSlider" class="sim-slider" min="0" max="30" value="0" step="1" />
          </div>
          <div class="sim-results">
            <div class="sim-row"><span class="sim-row-label" style="color:#ff5c72">High Risk</span><div id="simHigh" class="sim-bar-container"></div></div>
            <div class="sim-row"><span class="sim-row-label" style="color:#f5a623">Medium</span><div id="simMed" class="sim-bar-container"></div></div>
            <div class="sim-row"><span class="sim-row-label" style="color:#0dca73">Low Risk</span><div id="simLow" class="sim-bar-container"></div></div>
          </div>
        </div>

        <div class="analytics-grid">
          <div class="chart-card" style="--i:5"><p class="chart-title">Risk Distribution</p><p class="chart-sub">Click a slice to drill down</p><div style="max-width:280px;margin:0 auto"><canvas id="chRisk"></canvas></div></div>
          <div class="chart-card" style="--i:6"><p class="chart-title">Students by Area</p><p class="chart-sub">Stacked risk breakdown per area</p><canvas id="chArea"></canvas></div>
          <div class="chart-card" style="--i:7"><p class="chart-title">Risk Factor Radar</p><p class="chart-sub">Comparing risk profiles across areas</p><canvas id="chRadar"></canvas></div>
          <div class="chart-card" style="--i:8"><p class="chart-title">Economic Status</p><p class="chart-sub">Income distribution</p><div style="max-width:280px;margin:0 auto"><canvas id="chEco"></canvas></div></div>
          <div class="chart-card" style="--i:9"><p class="chart-title">Avg Attendance by Area</p><p class="chart-sub">Attendance % across locations</p><canvas id="chAtt"></canvas></div>
          <div class="chart-card wide" style="--i:10"><p class="chart-title">Top Risk Factors</p><p class="chart-sub">Most common factors driving dropout risk</p><div id="factorBarsContainer" class="factor-bars"></div></div>
        </div>

        <div class="chart-card wide insights-section" style="--i:11">
          <p class="chart-title">💡 Smart Insights</p>
          <p class="chart-sub">Auto-generated observations from your data. Click to apply filters.</p>
          <div id="insightsContainer" class="insights-grid"></div>
        </div>
      </section>`;

    // Wire filter events
    ['area', 'economicStatus', 'riskLevel'].forEach(k => {
      document.getElementById(`filter_${k}`)?.addEventListener('change', e => {
        state.filters[k] = e.target.value;
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

    // Initial render
    updateAllCharts();

  } catch (err) {
    app.innerHTML = `<section class="page"><div class="error-state"><span class="error-state-icon">⚠️</span><h2>Failed to load analytics</h2><p>${err.message}</p><p class="error-hint">Make sure the backend server is running on port 3000.</p></div></section>`;
  }
}

// Theme reactivity
window.addEventListener('themeToggled', () => {
  if (!Object.keys(state.charts).length) return;
  const c = getTheme();
  Object.values(state.charts).forEach(chart => {
    if (chart.options.plugins?.legend) chart.options.plugins.legend.labels.color = c.t2;
    if (chart.options.plugins?.tooltip) Object.assign(chart.options.plugins.tooltip, { backgroundColor: c.bgR, borderColor: c.b1, titleColor: c.t1, bodyColor: c.t2 });
    if (chart.options.scales?.x) { chart.options.scales.x.grid.color = c.b1; chart.options.scales.x.ticks.color = c.t3; }
    if (chart.options.scales?.y) { chart.options.scales.y.grid.color = c.b1; chart.options.scales.y.ticks.color = c.t3; }
    if (chart.options.scales?.r) { chart.options.scales.r.grid.color = c.b1; chart.options.scales.r.angleLines.color = c.b1; chart.options.scales.r.pointLabels.color = c.t2; }
    if (chart.config.type === 'doughnut' || chart.config.type === 'pie') chart.data.datasets[0].borderColor = c.bg;
    chart.update();
  });
});