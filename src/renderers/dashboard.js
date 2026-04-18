import { students, countByStatus, filterStudents }
  from '../services/studentService.js';
import { buildStudentCard } from '../utils/buildCard.js';
import { exportStudentsToCSV } from '../utils/exportCSV.js';

export function renderDashboard() {
  const { high, medium, low } = countByStatus();
  const avgRisk = Math.round(
    students.reduce((s, st) => s + st.riskScore, 0) / students.length
  );

  document.getElementById('app').innerHTML = `
    <section class="page">

      <!-- ── Page Header ── -->
      <div class="page-header">
        <div class="page-title-group">
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">
            Real-time dropout risk overview across
            ${students.length} enrolled students.
          </p>
        </div>
        <button class="btn btn-ghost" id="exportCSV">
          ↓ Export CSV
        </button>
      </div>

      <!-- ── Stat Cards ── -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-icon">👥</span>
          <span class="stat-number">${students.length}</span>
          <span class="stat-label">Total Students</span>
          <span class="stat-sub">Enrolled this year</span>
        </div>
        <div class="stat-card risk-high">
          <span class="stat-icon">⚠️</span>
          <span class="stat-number">${high}</span>
          <span class="stat-label">High Risk</span>
          <span class="stat-sub">
            ${Math.round(high / students.length * 100)}% of total
          </span>
        </div>
        <div class="stat-card risk-med">
          <span class="stat-icon">📋</span>
          <span class="stat-number">${medium}</span>
          <span class="stat-label">Medium Risk</span>
          <span class="stat-sub">
            ${Math.round(medium / students.length * 100)}% of total
          </span>
        </div>
        <div class="stat-card risk-low">
          <span class="stat-icon">✅</span>
          <span class="stat-number">${low}</span>
          <span class="stat-label">Low Risk</span>
          <span class="stat-sub">
            ${Math.round(low / students.length * 100)}% of total
          </span>
        </div>
        <div class="stat-card">
          <span class="stat-icon">📊</span>
          <span class="stat-number">${avgRisk}</span>
          <span class="stat-label">Avg Risk Score</span>
          <span class="stat-sub">Out of 100</span>
        </div>
      </div>

      <!-- ── Toolbar ── -->
      <div class="toolbar">
        <div class="toolbar-left">
          <input  class="filter-input"  id="searchInput"
                  placeholder="Search students…" />
          <select class="filter-select" id="riskFilter">
            <option value="all">All Risk Levels</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
          </select>
          <select class="filter-select" id="areaFilter">
            <option value="all">All Areas</option>
            <option value="rural">Rural</option>
            <option value="semi-urban">Semi-Urban</option>
            <option value="urban">Urban</option>
          </select>
        </div>
        <div class="toolbar-right">
          <span class="results-count" id="resultsCount">
            ${students.length} students
          </span>
        </div>
      </div>

      <!-- ── Student Grid ── -->
      <div class="student-grid" id="studentGrid">
        ${students.map(buildStudentCard).join('')}
      </div>

    </section>
  `;

  // ── Export ──
  document.getElementById('exportCSV')
    .addEventListener('click', () => exportStudentsToCSV(students));

  // ── Filters ──
  const applyFilters = () => {
    const status = document.getElementById('riskFilter').value;
    const area   = document.getElementById('areaFilter').value;
    const search = document.getElementById('searchInput').value;
    const filtered = filterStudents({ status, area, search });

    document.getElementById('resultsCount').textContent =
      `${filtered.length} student${filtered.length !== 1 ? 's' : ''}`;

    const grid = document.getElementById('studentGrid');
    grid.innerHTML = filtered.length
      ? filtered.map(buildStudentCard).join('')
      : `<div class="empty-state">
           <span class="empty-state-icon">🔍</span>
           No students match this filter.
         </div>`;
  };

  document.getElementById('riskFilter')
    .addEventListener('change', applyFilters);
  document.getElementById('areaFilter')
    .addEventListener('change', applyFilters);
  document.getElementById('searchInput')
    .addEventListener('input',  applyFilters);
}