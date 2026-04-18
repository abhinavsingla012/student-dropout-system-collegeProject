import Chart from 'chart.js/auto';
import {
  getAllStudents, countByStatus, countByArea,
  countByEconomicStatus, avgAttendanceByArea, topRiskFactors,
} from '../services/studentService.js';

export async function renderAnalytics() {
  const app = document.getElementById('app');
  app.innerHTML = `<section class="page"><div class="loading-state"><div class="loading-spinner"></div><p>Loading analytics…</p></div></section>`;

  try {
    const [students, sc, areas, eco, att, factors] = await Promise.all([
      getAllStudents(), countByStatus(), countByArea(),
      countByEconomicStatus(), avgAttendanceByArea(), topRiskFactors(),
    ]);
    const { high, medium, low } = sc;

    app.innerHTML = `
      <section class="page">
        <div class="page-header"><div><h1 class="page-title">Analytics</h1><p class="page-subtitle">Key factors contributing to student dropout risk.</p></div></div>

        <div class="analytics-summary">
          <div class="asummary-item"><span class="asummary-value" style="color:var(--risk-hi)">${high}</span><span class="asummary-label">High Risk</span></div>
          <div class="asummary-item"><span class="asummary-value" style="color:var(--risk-md)">${medium}</span><span class="asummary-label">Medium Risk</span></div>
          <div class="asummary-item"><span class="asummary-value" style="color:var(--risk-lo)">${low}</span><span class="asummary-label">Low Risk</span></div>
          <div class="asummary-item"><span class="asummary-value" style="color:var(--accent)">${Math.round(high/students.length*100)}%</span><span class="asummary-label">High Risk Rate</span></div>
        </div>

        <div class="analytics-grid">
          <div class="chart-card wide"><p class="chart-title">Top Risk Factors</p><p class="chart-sub">Most common factors driving dropout risk</p><div id="factorBars" class="factor-bars"></div></div>
          <div class="chart-card"><p class="chart-title">Risk Distribution</p><p class="chart-sub">Students by risk level</p><div class="chart-wrap"><canvas id="riskChart"></canvas></div></div>
          <div class="chart-card"><p class="chart-title">Students by Area</p><p class="chart-sub">Rural vs semi-urban vs urban</p><div class="chart-wrap"><canvas id="areaChart"></canvas></div></div>
          <div class="chart-card"><p class="chart-title">Economic Status</p><p class="chart-sub">Income distribution</p><div class="chart-wrap"><canvas id="ecoChart"></canvas></div></div>
          <div class="chart-card"><p class="chart-title">Avg Attendance by Area</p><p class="chart-sub">Attendance % across locations</p><div class="chart-wrap"><canvas id="attendanceChart"></canvas></div></div>
        </div>
      </section>`;

    buildFactorBars(factors, students.length);
    buildRiskChart(sc); buildAreaChart(areas);
    buildEcoChart(eco); buildAttendanceChart(att);
  } catch (err) {
    app.innerHTML = `<section class="page"><div class="error-state"><span class="error-state-icon">⚠️</span><h2>Failed to load analytics</h2><p>${err.message}</p><p class="error-hint">Make sure the backend server is running on port 3000.</p></div></section>`;
  }
}

function getThemeColors() {
  const style = getComputedStyle(document.body);
  return {
    t1: style.getPropertyValue('--t1').trim() || '#fff',
    t2: style.getPropertyValue('--t2').trim() || '#a1a1a1',
    t3: style.getPropertyValue('--t3').trim() || '#717171',
    b1: style.getPropertyValue('--b1').trim() || 'rgba(255,255,255,0.08)',
    bg: style.getPropertyValue('--bg').trim() || '#030303',
    bgRaised: style.getPropertyValue('--bg-raised').trim() || '#1a1a1a',
  };
}

function getChartDefaults() {
  const c = getThemeColors();
  return {
    CP: {
      plugins: {
        legend: { labels: { color: c.t2, font: { family:'Inter', size:11 }, padding:14 } },
        tooltip: { backgroundColor: c.bgRaised, borderColor: c.b1, borderWidth: 1, titleColor: c.t1, bodyColor: c.t2, titleFont: { family:'Plus Jakarta Sans', weight:'700' }, bodyFont: { family:'Inter' }, padding: 10, cornerRadius: 7 }
      }
    },
    SX: { grid: { color: c.b1 }, ticks: { color: c.t3, font: { family:'Inter', size:10 } } }
  };
}

function buildFactorBars(factors, total) {
  const max = factors[0]?.[1] || 1;
  document.getElementById('factorBars').innerHTML = factors.map(([l, c], i) =>
    `<div class="factor-row"><span class="factor-label">${l}</span><div class="factor-bar-bg"><div class="factor-bar-fill" style="width:${(c/max)*100}%;opacity:${1-i*.07}"></div></div><span class="factor-count">${c}/${total}</span></div>`
  ).join('');
}

function buildRiskChart({ high, medium, low }) {
  const { CP } = getChartDefaults();
  const bg = getThemeColors().bg;
  new Chart(document.getElementById('riskChart'), {
    type:'doughnut', data:{ labels:['High','Medium','Low'], datasets:[{ data:[high,medium,low], backgroundColor:['#ff5c72','#f5a623','#0dca73'], borderColor:bg, borderWidth:3, hoverOffset:6 }] },
    options:{ cutout:'70%', ...CP, plugins:{...CP.plugins, legend:{...CP.plugins.legend,position:'bottom'}} },
  });
}

function buildAreaChart(areas) {
  const { CP, SX } = getChartDefaults();
  new Chart(document.getElementById('areaChart'), {
    type:'bar', data:{ labels:Object.keys(areas).map(a=>a.charAt(0).toUpperCase()+a.slice(1)), datasets:[{ data:Object.values(areas), backgroundColor:['#8a78ff','#0dca73','#f5a623'], borderRadius:6, borderSkipped:false }] },
    options:{ ...CP, plugins:{...CP.plugins,legend:{display:false}}, scales:{x:SX,y:{...SX,beginAtZero:true}} },
  });
}

function buildEcoChart(eco) {
  const { CP } = getChartDefaults();
  const bg = getThemeColors().bg;
  new Chart(document.getElementById('ecoChart'), {
    type:'pie', data:{ labels:['Low Income','Mid Income','High Income'], datasets:[{ data:[eco.low,eco.mid,eco.high], backgroundColor:['#ff5c72','#f5a623','#0dca73'], borderColor:bg, borderWidth:3, hoverOffset:6 }] },
    options:{ ...CP, plugins:{...CP.plugins, legend:{...CP.plugins.legend,position:'bottom'}} },
  });
}

function buildAttendanceChart(data) {
  const { CP, SX } = getChartDefaults();
  new Chart(document.getElementById('attendanceChart'), {
    type:'bar', data:{ labels:Object.keys(data).map(a=>a.charAt(0).toUpperCase()+a.slice(1)), datasets:[{ label:'Avg Attendance %', data:Object.values(data), backgroundColor:['#8a78ff','#0dca73','#f5a623'], borderRadius:6, borderSkipped:false }] },
    options:{ ...CP, plugins:{...CP.plugins,legend:{display:false}}, scales:{x:SX,y:{...SX,min:50,max:100,ticks:{...SX.ticks,callback:v=>v+'%'}}} },
  });
}

window.addEventListener('themeToggled', () => {
  const c = getThemeColors();
  for (let id in Chart.instances) {
    const chart = Chart.instances[id];
    if (chart.options.plugins.legend) chart.options.plugins.legend.labels.color = c.t2;
    if (chart.options.plugins.tooltip) {
      chart.options.plugins.tooltip.backgroundColor = c.bgRaised;
      chart.options.plugins.tooltip.borderColor = c.b1;
      chart.options.plugins.tooltip.titleColor = c.t1;
      chart.options.plugins.tooltip.bodyColor = c.t2;
    }
    if (chart.options.scales?.x) {
      chart.options.scales.x.grid.color = c.b1;
      chart.options.scales.x.ticks.color = c.t3;
      chart.options.scales.y.grid.color = c.b1;
      chart.options.scales.y.ticks.color = c.t3;
    }
    if (chart.config.type === 'doughnut' || chart.config.type === 'pie') {
      chart.data.datasets[0].borderColor = c.bg;
    }
    chart.update();
  }
});