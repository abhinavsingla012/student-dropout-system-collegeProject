import { getAllStudents } from '../services/studentService.js';

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

function riskLabel(status) {
  if (status === 'high') return 'High Risk';
  if (status === 'medium') return 'Medium Risk';
  return 'Low Risk';
}

function buildRiskBadge(status) {
  return `
    <span class="roster-risk-badge ${escapeHtml(status)}">
      <span class="roster-risk-dot ${escapeHtml(status)}"></span>
      ${escapeHtml(riskLabel(status))}
    </span>
  `;
}

function buildRows(students) {
  return students
    .map(
      student => `
        <tr class="roster-row ${escapeHtml(student.status)}" data-student-id="${student.id}">
          <td class="roster-cell roster-student-cell">
            <button class="roster-student-button" data-student-id="${student.id}">
              <span class="roster-avatar">${escapeHtml(student.name.split(' ').map(part => part[0]).slice(0, 2).join(''))}</span>
              <span class="roster-student-meta">
                <strong>${escapeHtml(student.name)}</strong>
                <span>${escapeHtml(student.area)} area · ${escapeHtml(student.economicStatus)} income</span>
              </span>
            </button>
          </td>
          <td class="roster-cell">
            <div class="roster-stack">
              <strong>Grade ${student.grade}</strong>
              <span>#${student.id}</span>
            </div>
          </td>
          <td class="roster-cell">
            <div class="roster-score-cell">
              <strong>${student.gpa}</strong>
              <span>${student.previousFailures} past fails</span>
            </div>
          </td>
          <td class="roster-cell">
            <div class="roster-attendance-cell">
              <div class="roster-attendance-bar">
                <div class="roster-attendance-fill ${escapeHtml(student.status)}" style="width:${student.attendance}%"></div>
              </div>
              <span>${student.attendance}%</span>
            </div>
          </td>
          <td class="roster-cell">
            ${buildRiskBadge(student.status)}
          </td>
          <td class="roster-cell">
            <div class="roster-score-pill ${escapeHtml(student.status)}">${student.riskScore}</div>
          </td>
          <td class="roster-cell roster-actions">
            <button class="roster-action-button" data-student-id="${student.id}">View Profile</button>
          </td>
        </tr>
      `
    )
    .join('');
}

function buildPriorityList(students) {
  return students
    .slice()
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 3)
    .map(
      student => `
        <button class="roster-priority-item" data-student-id="${student.id}">
          <span class="roster-priority-indicator ${escapeHtml(student.status)}"></span>
          <span class="roster-priority-copy">
            <strong>${escapeHtml(student.name)}</strong>
            <span>${escapeHtml(student.riskFactors?.[0]?.label || 'Needs case review')}</span>
          </span>
          <span class="roster-priority-arrow">›</span>
        </button>
      `
    )
    .join('');
}

function buildInsight(filtered) {
  if (!filtered.length) {
    return 'No students match the current filters. Clear the filters to restore the full list view.';
  }

  const lowIncomeHighRisk = filtered.filter(
    student => student.status === 'high' && student.economicStatus === 'low'
  ).length;
  const attendanceConcern = filtered.filter(student => student.attendance < 75).length;

  if (lowIncomeHighRisk > 0) {
    return `${lowIncomeHighRisk} high-risk students in this view also show economic vulnerability. Financial support and counselor follow-up should be prioritized together.`;
  }

  if (attendanceConcern > 0) {
    return `${attendanceConcern} students in the current roster snapshot are below 75% attendance. Attendance recovery is the dominant near-term intervention opportunity.`;
  }

  return 'The current list selection is relatively stable. Continue preventive monitoring and keep follow-up notes current for medium-risk students.';
}

export async function renderStudents() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <section class="page">
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading student list...</p>
      </div>
    </section>`;

  try {
    const all = await getAllStudents();

    app.innerHTML = `
        <section class="page roster-page">
          <div class="page-header roster-header">
          <div>
            <span class="page-kicker">Student List</span>
            <h1 class="page-title">Students</h1>
            <p class="page-subtitle">
              Monitor the full student population, scan for risk quickly, and move directly from list review into helping students.
            </p>
          </div>
          <div class="roster-top-metrics">
            <article class="roster-mini-metric surface-card">
              <span>Urgent Cases</span>
              <strong>${all.filter(student => student.status === 'high').length}</strong>
            </article>
            <article class="roster-mini-metric surface-card">
              <span>Average attendance</span>
              <strong>${Math.round(all.reduce((sum, student) => sum + student.attendance, 0) / all.length)}%</strong>
            </article>
          </div>
        </div>

        <section class="roster-toolbar surface-card">
          <div class="roster-toolbar-leading">
            <span class="roster-toolbar-label">Filters</span>
            <input class="filter-input" id="searchInput" placeholder="Find a student by name..." />
            <select class="filter-select" id="riskFilter">
              <option value="all">All risk levels</option>
              <option value="high">High risk</option>
              <option value="medium">Medium risk</option>
              <option value="low">Low risk</option>
            </select>
            <select class="filter-select" id="areaFilter">
              <option value="all">All areas</option>
              <option value="rural">Rural</option>
              <option value="semi-urban">Semi-Urban</option>
              <option value="urban">Urban</option>
            </select>
            <select class="filter-select" id="ecoFilter">
              <option value="all">All income groups</option>
              <option value="low">Low income</option>
              <option value="mid">Mid income</option>
              <option value="high">High income</option>
            </select>
          </div>
          <div class="roster-toolbar-trailing">
            <span class="results-count" id="resultsCount">${all.length} students</span>
            <button class="roster-clear-button" id="clearFilters">Clear all</button>
          </div>
        </section>

        <div class="roster-layout">
          <section class="roster-table-shell surface-card">
            <table class="roster-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Grade / ID</th>
                  <th>GPA</th>
                  <th>Attendance</th>
                  <th>Risk Level</th>
                  <th>Risk Score</th>
                  <th class="roster-th-right">Action</th>
                </tr>
              </thead>
              <tbody id="studentTableBody">
                ${buildRows(all)}
              </tbody>
            </table>
          </section>

          <aside class="roster-side-column">
            <article class="roster-insight-card">
              <span class="section-kicker">List Summary</span>
              <h2>Financial info</h2>
              <p id="rosterInsight">${escapeHtml(buildInsight(all))}</p>
            </article>
            <article class="roster-priority-card surface-card">
              <div class="roster-priority-head">
                <h2>Priority List</h2>
                <span>Top 3</span>
              </div>
              <div id="priorityList">${buildPriorityList(all)}</div>
            </article>
          </aside>
        </div>
      </section>
    `;

    const tableBody = document.getElementById('studentTableBody');
    const resultsCount = document.getElementById('resultsCount');
    const priorityList = document.getElementById('priorityList');
    const rosterInsight = document.getElementById('rosterInsight');
    const searchInput = document.getElementById('searchInput');
    const riskFilter = document.getElementById('riskFilter');
    const areaFilter = document.getElementById('areaFilter');
    const ecoFilter = document.getElementById('ecoFilter');

    function attachRowHandlers() {
      tableBody.querySelectorAll('[data-student-id]').forEach(element => {
        element.addEventListener('click', () => {
          window.location.hash = `#/student/${element.dataset.studentId}`;
        });
      });

      priorityList.querySelectorAll('[data-student-id]').forEach(element => {
        element.addEventListener('click', () => {
          window.location.hash = `#/student/${element.dataset.studentId}`;
        });
      });
    }

    function applyFilters() {
      const status = riskFilter.value;
      const area = areaFilter.value;
      const search = searchInput.value.trim().toLowerCase();
      const eco = ecoFilter.value;

      let filtered = all.filter(student => {
        const matchStatus = status === 'all' || student.status === status;
        const matchArea = area === 'all' || student.area === area;
        const matchSearch = student.name.toLowerCase().includes(search);
        return matchStatus && matchArea && matchSearch;
      });

      if (eco !== 'all') {
        filtered = filtered.filter(student => student.economicStatus === eco);
      }

      resultsCount.textContent = `${filtered.length} student${filtered.length !== 1 ? 's' : ''}`;
      rosterInsight.textContent = buildInsight(filtered);
      priorityList.innerHTML = buildPriorityList(filtered.length ? filtered : all);
      tableBody.innerHTML = filtered.length
        ? buildRows(filtered)
        : `
          <tr>
            <td colspan="7">
              <div class="empty-state">
                <span class="empty-state-icon">Search</span>
                No students match the selected filters.
              </div>
            </td>
          </tr>
        `;
      attachRowHandlers();
    }

    [riskFilter, areaFilter, ecoFilter].forEach(element => {
      element.addEventListener('change', applyFilters);
    });
    searchInput.addEventListener('input', applyFilters);
    document.getElementById('clearFilters').addEventListener('click', () => {
      searchInput.value = '';
      riskFilter.value = 'all';
      areaFilter.value = 'all';
      ecoFilter.value = 'all';
      applyFilters();
    });

    attachRowHandlers();
  } catch (err) {
    app.innerHTML = `
      <section class="page">
        <div class="error-state">
          <span class="error-state-icon">Warning</span>
          <h2>Failed to load students</h2>
          <p>${escapeHtml(err.message)}</p>
          <p class="error-hint">Make sure the backend server is running on port 3000.</p>
        </div>
      </section>`;
  }
}
