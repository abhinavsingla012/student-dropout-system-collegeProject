import Chart from 'chart.js/auto';
import { getAllStudents, countByStatus } from '../services/studentService.js';
import { getAllInterventions } from '../services/interventionService.js';

export async function renderDashboard() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <section class="page">
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Initializing Command Center...</p>
      </div>
    </section>
  `;

  try {
    const [students, statusCounts, interventions] = await Promise.all([
      getAllStudents(),
      countByStatus(),
      getAllInterventions()
    ]);

    const total = students.length;
    const avgAtt = Math.round(students.reduce((acc, s) => acc + s.attendance, 0) / total);
    const critical = [...students].sort((a, b) => b.riskScore - a.riskScore).slice(0, 4);
    const recent = interventions.slice(0, 3);
    const typeLabel = { counselling:'Counselling', parent_meeting:'Meeting', academic_support:'Support', financial_aid:'Financial', mentorship:'Mentorship' };

    app.innerHTML = `
      <section class="page">
        <header class="page-header">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <h1 class="page-title">Command Center</h1>
              <p class="page-subtitle">Predictive analytics and student risk monitoring system.</p>
            </div>
            <div class="status-pill">
              <span class="dot-pulse"></span>
              Live System Status
            </div>
          </div>
        </header>

        <div class="bento-grid">
          
          <!-- Row 1: KPI Summary -->
          <div class="bento-item kpi-widget span-3">
            <div class="kpi-head">
              <div class="kpi-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div>
              <span class="kpi-label">Total Enrolled</span>
            </div>
            <h2 class="kpi-value">${total}</h2>
            <div class="kpi-foot">
              <span class="kpi-trend up">+2.4%</span>
              <span class="widget-desc">from last month</span>
            </div>
          </div>

          <div class="bento-item kpi-widget span-3">
            <div class="kpi-head">
              <div class="kpi-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg></div>
              <span class="kpi-label">High Risk Level</span>
            </div>
            <h2 class="kpi-value" style="color:var(--accent-red)">${statusCounts.high}</h2>
            <div class="kpi-foot">
              <span class="kpi-trend down">${Math.round(statusCounts.high / total * 100)}%</span>
              <span class="widget-desc">of total cohort</span>
            </div>
          </div>

          <div class="bento-item kpi-widget span-3">
            <div class="kpi-head">
              <div class="kpi-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
              <span class="kpi-label">Interventions</span>
            </div>
            <h2 class="kpi-value" style="color:var(--accent-purple)">${interventions.length}</h2>
            <div class="kpi-foot">
              <span class="kpi-trend up">Active</span>
              <span class="widget-desc">logged actions</span>
            </div>
          </div>

          <div class="bento-item kpi-widget span-3">
            <div class="kpi-head">
              <div class="kpi-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
              <span class="kpi-label">Avg Attendance</span>
            </div>
            <h2 class="kpi-value" style="color:var(--accent-green)">${avgAtt}%</h2>
            <div class="kpi-foot">
              <span class="kpi-trend up">Stable</span>
              <span class="widget-desc">across all grades</span>
            </div>
          </div>

          <!-- Row 2: Analytics & Alerts -->
          <div class="bento-item chart-widget span-8">
            <div class="widget-head">
              <h3 class="widget-title">Risk Distribution</h3>
              <p class="widget-desc">Real-time breakdown of cohort risk categorization.</p>
            </div>
            <div class="chart-layout">
              <div class="chart-wrap">
                <canvas id="riskDoughnut"></canvas>
                <div class="chart-center">
                  <span class="center-val">${total}</span>
                  <span class="center-lbl">Total</span>
                </div>
              </div>
              <div class="chart-legend">
                <div class="legend-row">
                  <span class="legend-dot" style="background:var(--accent-red)"></span>
                  <span class="legend-lbl">High Risk</span>
                  <span class="legend-val">${statusCounts.high}</span>
                </div>
                <div class="legend-row">
                  <span class="legend-dot" style="background:var(--accent-amber)"></span>
                  <span class="legend-lbl">Medium</span>
                  <span class="legend-val">${statusCounts.medium}</span>
                </div>
                <div class="legend-row">
                  <span class="legend-dot" style="background:var(--accent-green)"></span>
                  <span class="legend-lbl">Low Risk</span>
                  <span class="legend-val">${statusCounts.low}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="bento-item alert-widget span-4">
            <div class="widget-head">
              <h3 class="widget-title" style="color:var(--accent-red)">⚡ Critical Alerts</h3>
              <p class="widget-desc">Students requiring immediate attention.</p>
            </div>
            <div class="alert-scroll">
              ${critical.map(s => `
                <div class="alert-card" onclick="window.location.hash='#/student/${s.id}'">
                  <div>
                    <span class="alert-name">${s.name}</span>
                    <span class="alert-meta">Grade ${s.grade} · ${s.area}</span>
                  </div>
                  <div class="risk-pill">${s.riskScore}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Row 3: Activity Feed -->
          <div class="bento-item activity-widget">
            <div class="widget-head">
              <h3 class="widget-title">Recent Activity Feed</h3>
              <p class="widget-desc">Latest interventions and administrative actions detected by the system.</p>
            </div>
            <div class="activity-list">
              ${recent.map(iv => `
                <div class="activity-card">
                  <div class="activity-head">
                    <span class="activity-type">${typeLabel[iv.type] || iv.type}</span>
                    <span class="activity-time">${iv.date}</span>
                  </div>
                  <p class="activity-body"><strong>${iv.studentName}</strong>: ${iv.note}</p>
                </div>
              `).join('')}
              ${recent.length === 0 ? '<p class="widget-desc">No recent activity detected.</p>' : ''}
            </div>
          </div>

        </div>
      </section>
    `;

    // Initialize Chart
    const ctx = document.getElementById('riskDoughnut').getContext('2d');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['High', 'Medium', 'Low'],
        datasets: [{
          data: [statusCounts.high, statusCounts.medium, statusCounts.low],
          backgroundColor: ['#fb7185', '#fbbf24', '#34d399'],
          borderWidth: 0,
          hoverOffset: 12,
          spacing: 4
        }]
      },
      options: {
        cutout: '82%',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(13, 13, 13, 0.9)',
            titleFont: { family: 'Inter', size: 13, weight: '700' },
            bodyFont: { family: 'Inter', size: 12 },
            padding: 12,
            cornerRadius: 8,
            displayColors: false
          }
        }
      }
    });

  } catch (err) {
    app.innerHTML = `<section class="page"><div class="loading-state"><h2>Error initializing system</h2><p>${err.message}</p></div></section>`;
  }
}