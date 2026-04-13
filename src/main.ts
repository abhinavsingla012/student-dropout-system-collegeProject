const app = document.getElementById('app')!;

// ── Mock student data (until Day 4 when we fetch from API) ──
const students = [
  { id: 1, name: "Priya Sharma",    grade: 9,  attendance: 62, gpa: 5.2, riskScore: 78, status: "high"   },
  { id: 2, name: "Arjun Mehta",     grade: 10, attendance: 88, gpa: 7.8, riskScore: 22, status: "low"    },
  { id: 3, name: "Sneha Patel",     grade: 8,  attendance: 74, gpa: 6.1, riskScore: 55, status: "medium" },
  { id: 4, name: "Rohit Kumar",     grade: 11, attendance: 55, gpa: 4.8, riskScore: 83, status: "high"   },
  { id: 5, name: "Anjali Singh",    grade: 9,  attendance: 91, gpa: 8.4, riskScore: 15, status: "low"    },
  { id: 6, name: "Vikram Nair",     grade: 10, attendance: 69, gpa: 5.9, riskScore: 61, status: "medium" },
  { id: 7, name: "Meena Iyer",      grade: 8,  attendance: 48, gpa: 4.2, riskScore: 91, status: "high"   },
  { id: 8, name: "Aditya Rao",      grade: 11, attendance: 83, gpa: 7.2, riskScore: 31, status: "low"    },
  { id: 9, name: "Divya Reddy",     grade: 9,  attendance: 71, gpa: 6.3, riskScore: 49, status: "medium" },
  { id: 10, name: "Karan Gupta",    grade: 10, attendance: 58, gpa: 5.0, riskScore: 74, status: "high"   },
  { id: 11, name: "Pooja Joshi",    grade: 8,  attendance: 95, gpa: 9.1, riskScore: 8,  status: "low"    },
  { id: 12, name: "Suresh Verma",   grade: 11, attendance: 66, gpa: 5.5, riskScore: 58, status: "medium" },
];

// ── Build one student card ──
function buildStudentCard(student: typeof students[0]): string {
  return `
    <div class="student-card ${student.status}" data-id="${student.id}">
      <div class="card-header">
        <span class="student-name">${student.name}</span>
        <span class="risk-badge ${student.status}">${student.status} risk</span>
      </div>
      <div class="card-details">
        <span><span>Grade</span>        <strong>${student.grade}</strong></span>
        <span><span>Attendance</span>   <strong>${student.attendance}%</strong></span>
        <span><span>GPA</span>          <strong>${student.gpa}/10</strong></span>
      </div>
      <div class="risk-bar-wrap">
        <div class="risk-bar-label">
          <span>Risk Score</span><strong>${student.riskScore}/100</strong>
        </div>
        <div class="risk-bar-bg">
          <div class="risk-bar-fill ${student.status}" style="width:${student.riskScore}%"></div>
        </div>
      </div>
    </div>
  `;
}

// ── Dashboard page ──
function renderDashboard(): void {
  const high   = students.filter(s => s.status === 'high').length;
  const medium = students.filter(s => s.status === 'medium').length;
  const low    = students.filter(s => s.status === 'low').length;

  app.innerHTML = `
    <section class="page">
      <h1 class="page-title">📊 Dashboard</h1>
      <p class="page-subtitle">Overview of student dropout risk across all enrolled students.</p>

      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-number">${students.length}</span>
          <span class="stat-label">Total Students</span>
        </div>
        <div class="stat-card risk-high">
          <span class="stat-number">${high}</span>
          <span class="stat-label">High Risk</span>
        </div>
        <div class="stat-card risk-med">
          <span class="stat-number">${medium}</span>
          <span class="stat-label">Medium Risk</span>
        </div>
        <div class="stat-card risk-low">
          <span class="stat-number">${low}</span>
          <span class="stat-label">Low Risk</span>
        </div>
      </div>

      <div class="section-header">
        <span class="section-title">All Students</span>
        <select class="filter-select" id="riskFilter">
          <option value="all">All Risk Levels</option>
          <option value="high">High Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="low">Low Risk</option>
        </select>
      </div>

      <div class="student-grid" id="studentGrid">
        ${students.map(buildStudentCard).join('')}
      </div>
    </section>
  `;

  // Filter logic
  document.getElementById('riskFilter')!.addEventListener('change', (e) => {
    const val = (e.target as HTMLSelectElement).value;
    const filtered = val === 'all' ? students : students.filter(s => s.status === val);
    const grid = document.getElementById('studentGrid')!;
    grid.innerHTML = filtered.length
      ? filtered.map(buildStudentCard).join('')
      : '<p class="empty-state">No students match this filter.</p>';
  });
}

// ── Students page ──
function renderStudents(): void {
  app.innerHTML = `
    <section class="page">
      <h1 class="page-title">🎓 Students</h1>
      <p class="page-subtitle">Full student list with risk scores and profiles.</p>
      <div class="student-grid">
        ${students.map(buildStudentCard).join('')}
      </div>
    </section>
  `;
}

// ── Interventions page ──
function renderInterventions(): void {
  app.innerHTML = `
    <section class="page">
      <h1 class="page-title">🤝 Interventions</h1>
      <p class="page-subtitle">Log a support action for an at-risk student.</p>
      <div class="form-card">
        <div class="form-group">
          <label for="studentSelect">Student</label>
          <select id="studentSelect">
            <option value="">-- Select a student --</option>
            ${students.map(s => `<option value="${s.id}">${s.name} (${s.status} risk)</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="interventionType">Type of Intervention</label>
          <select id="interventionType">
            <option value="">-- Select type --</option>
            <option value="counselling">Counselling Session</option>
            <option value="parent_meeting">Parent Meeting</option>
            <option value="academic_support">Academic Support</option>
            <option value="financial_aid">Financial Aid</option>
            <option value="mentorship">Mentorship</option>
          </select>
        </div>
        <div class="form-group">
          <label for="interventionNote">Notes</label>
          <textarea id="interventionNote" placeholder="Describe the intervention and outcome..."></textarea>
        </div>
        <button class="btn btn-primary" id="submitIntervention">Save Intervention</button>
        <div id="formMessage"></div>
      </div>
    </section>
  `;

  document.getElementById('submitIntervention')!.addEventListener('click', () => {
    const student = (document.getElementById('studentSelect') as HTMLSelectElement).value;
    const type    = (document.getElementById('interventionType') as HTMLSelectElement).value;
    const note    = (document.getElementById('interventionNote') as HTMLTextAreaElement).value;
    const msg     = document.getElementById('formMessage')!;

    if (!student || !type || !note.trim()) {
      msg.innerHTML = '<div class="form-message error">⚠️ Please fill in all fields.</div>';
      return;
    }
    msg.innerHTML = '<div class="form-message success">✅ Intervention saved successfully!</div>';
    (document.getElementById('studentSelect') as HTMLSelectElement).value = '';
    (document.getElementById('interventionType') as HTMLSelectElement).value = '';
    (document.getElementById('interventionNote') as HTMLTextAreaElement).value = '';
  });
}

// ── Router ──
function setActiveNav(): void {
  const hash = window.location.hash || '#/dashboard';
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === hash);
  });
}

function renderPage(): void {
  const hash = window.location.hash || '#/dashboard';
  setActiveNav();
  if (hash === '#/dashboard')      renderDashboard();
  else if (hash === '#/students')  renderStudents();
  else if (hash === '#/interventions') renderInterventions();
  else app.innerHTML = `<section class="page"><h1>404 — Page not found</h1></section>`;
}

window.addEventListener('hashchange', renderPage);
renderPage();