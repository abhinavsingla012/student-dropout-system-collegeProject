import { getStudentById }              from '../services/studentService.js';
import { getInterventionsForStudent }  from '../services/interventionService.js';
import { saveIntervention }            from '../services/interventionService.js';
import Chart from 'chart.js/auto';
export function renderStudentDetail(id) {
  const student = getStudentById(id);
  const app = document.getElementById('app');

  if (!student) {
    app.innerHTML = `
      <section class="page">
        <a href="#/students" class="back-link">← Back to Students</a>
        <h1 class="page-title">Student not found</h1>
      </section>`;
    return;
  }

  function getHTML() {
    const interventions = getInterventionsForStudent(student.id);
    const interventionTypeLabel = {
      counselling:      'Counselling Session',
      parent_meeting:   'Parent Meeting',
      academic_support: 'Academic Support',
      financial_aid:    'Financial Aid',
      mentorship:       'Mentorship',
    };
    

const ctx = document.getElementById('trendChart');

if (ctx) {
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: student.riskTrend.map(t => t.month),
      datasets: [{
        label: 'Risk Score',
        data: student.riskTrend.map(t => t.score),
        borderColor:
          student.status === 'high' ? '#9b1c1c' :
          student.status === 'medium' ? '#c65a11' :
          '#1d6f42',
        backgroundColor: 'rgba(46,117,182,0.1)',
        tension: 0.3,
        fill: true,
      }]
    },
    options: {
      scales: {
        y: { min: 0, max: 100 }
      }
    }
  });
}

    return `
      <section class="page">
        <a href="#/students" class="back-link">← Back to Students</a>

        <!-- ── Profile header ── -->
     <div class="profile-header ${student.status}">
  <div class="profile-header-band"></div>
  <div class="profile-header-glow"></div>

  <div class="profile-header-inner">
    <h1 class="profile-name">${student.name}</h1>
    <div class="profile-meta">
      <span>Grade ${student.grade}</span>
      <span>${student.area}</span>
      <span>${student.gender}</span>
      <span>${student.economicStatus} income</span>
      <span>${student.distanceFromSchool}km from school</span>
      ${student.hasScholarship
        ? '<span class="badge-scholarship">🎓 Scholarship</span>'
        : ''}
    </div>
  </div>

  <div class="profile-risk-panel">
    <span class="risk-label">Risk Score</span>
    <span class="risk-score-big ${student.status}">
      ${student.riskScore}
    </span>
    <span class="risk-badge ${student.status}">
      ${student.status} risk
    </span>
    <span class="dropout-prob">
      ${student.dropoutProbability}% dropout probability
    </span>
  </div>
</div>

        <!-- ── Key metrics ── -->
        <div class="metrics-grid">
          <div class="metric-card">
            <span class="metric-value ${student.attendance < 75 ? 'text-danger' : ''}">${student.attendance}%</span>
            <span class="metric-label">Attendance</span>
            <div class="mini-bar-bg">
              <div class="mini-bar-fill ${student.status}" style="width:${student.attendance}%"></div>
            </div>
          </div>
          <div class="metric-card">
            <span class="metric-value ${student.gpa < 6.0 ? 'text-danger' : ''}">${student.gpa}/10</span>
            <span class="metric-label">GPA</span>
            <div class="mini-bar-bg">
              <div class="mini-bar-fill ${student.status}" style="width:${student.gpa * 10}%"></div>
            </div>
          </div>
          <div class="metric-card">
            <span class="metric-value">${student.distanceFromSchool} km</span>
            <span class="metric-label">Distance from School</span>
          </div>
          <div class="metric-card">
            <span class="metric-value ${student.previousFailures > 0 ? 'text-danger' : ''}">${student.previousFailures}</span>
            <span class="metric-label">Previous Failures</span>
          </div>
        </div>

        <!-- ── Risk factors ── -->
        <div class="detail-section">
          <h2 class="section-heading">⚠️ Risk Factors</h2>
          ${student.riskFactors.length
            ? `<ul class="risk-factor-list">
                ${student.riskFactors.map(f => `
                  <li class="risk-factor-item ${f.severity}">
                    <span class="factor-dot ${f.severity}"></span>
                    ${f.label}
                  </li>`).join('')}
               </ul>`
            : '<p class="empty-state">No significant risk factors identified.</p>'
          }
        </div>
        <div class="detail-section">
  <h2 class="section-heading">📈 Risk Trend (Last 6 Months)</h2>
  <canvas id="trendChart"></canvas>
</div>

        <!-- ── Intervention history ── -->
        <div class="detail-section">
          <h2 class="section-heading">📋 Intervention History</h2>
          <div id="interventionHistory">
            ${interventions.length
              ? interventions.map(i => `
                  <div class="intervention-item">
                    <div class="intervention-header">
                      <strong>${interventionTypeLabel[i.type] || i.type}</strong>
                      <span class="intervention-date">${i.date}</span>
                    </div>
                    <p class="intervention-note">${i.note}</p>
                  </div>`).join('')
              : '<p class="empty-state">No interventions logged yet.</p>'
            }
          </div>
        </div>

        <!-- ── Log new intervention ── -->
        <div class="detail-section">
          <h2 class="section-heading">➕ Log Intervention</h2>
          <div class="form-card">
            <div class="form-group">
              <label for="interventionType">Type</label>
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
              <textarea id="interventionNote"
                placeholder="Describe the intervention and outcome…"></textarea>
            </div>
            <button class="btn btn-primary" id="saveIntervention">
              Save Intervention
            </button>
            <div id="formMessage"></div>
          </div>
        </div>
      </section>
    `;
  }

  app.innerHTML = getHTML();

  // ── Save handler ──
  document.getElementById('saveIntervention').addEventListener('click', () => {
    const type = document.getElementById('interventionType').value;
    const note = document.getElementById('interventionNote').value.trim();
    const msg  = document.getElementById('formMessage');

    if (!type || !note) {
      msg.innerHTML = '<div class="form-message error">⚠️ Please fill in all fields.</div>';
      return;
    }

    saveIntervention({ studentId: student.id, studentName: student.name, type, note });

    // Re-render just the history section without full page reload
    app.innerHTML = getHTML();

    // Re-attach listener (since we re-rendered)
    document.getElementById('saveIntervention').addEventListener('click', arguments.callee);
  });
}