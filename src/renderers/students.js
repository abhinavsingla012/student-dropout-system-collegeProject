import { filterStudents }   from '../services/studentService.js';
import { buildStudentCard } from '../utils/buildCard.js';

export function renderStudents() {
  const all = filterStudents({});

  document.getElementById('app').innerHTML = `
    <section class="page">

      <div class="page-header">
        <div class="page-title-group">
          <h1 class="page-title">Students</h1>
          <p class="page-subtitle">
            Full student list with risk scores, profiles
            and dropout predictions.
          </p>
        </div>
      </div>

      <!-- ── Filter Bar ── -->
      <div class="toolbar">
        <div class="toolbar-left">
          <input  class="filter-input" id="searchInput"
                  placeholder="Search by name…" />
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
          <select class="filter-select" id="ecoFilter">
            <option value="all">All Income Levels</option>
            <option value="low">Low Income</option>
            <option value="mid">Mid Income</option>
            <option value="high">High Income</option>
          </select>
        </div>
        <div class="toolbar-right">
          <span class="results-count" id="resultsCount">
            ${all.length} students
          </span>
        </div>
      </div>

      <!-- ── Grid ── -->
      <div class="student-grid" id="studentGrid">
        ${all.map(buildStudentCard).join('')}
      </div>

    </section>
  `;

  const applyFilters = () => {
    const status = document.getElementById('riskFilter').value;
    const area   = document.getElementById('areaFilter').value;
    const search = document.getElementById('searchInput').value;
    const eco    = document.getElementById('ecoFilter').value;

    let filtered = filterStudents({ status, area, search });
    if (eco !== 'all')
      filtered = filtered.filter(s => s.economicStatus === eco);

    document.getElementById('resultsCount').textContent =
      `${filtered.length} student${filtered.length !== 1 ? 's' : ''}`;

    document.getElementById('studentGrid').innerHTML = filtered.length
      ? filtered.map(buildStudentCard).join('')
      : `<div class="empty-state">
           <span class="empty-state-icon">🔍</span>
           No students match this filter.
         </div>`;
  };

  ['riskFilter', 'areaFilter', 'ecoFilter'].forEach(id =>
    document.getElementById(id).addEventListener('change', applyFilters)
  );
  document.getElementById('searchInput')
    .addEventListener('input', applyFilters);
}