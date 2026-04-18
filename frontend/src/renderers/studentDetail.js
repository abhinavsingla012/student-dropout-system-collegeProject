import { getStudentById } from '../services/studentService.js';
import { getInterventionsForStudent, saveIntervention } from '../services/interventionService.js';
import Chart from 'chart.js/auto';

export async function renderStudentDetail(id) {
  const app = document.getElementById('app');
  app.innerHTML = `<section class="page"><div class="loading-state"><div class="loading-spinner"></div><p>Loading student profile…</p></div></section>`;

  try {
    const student = await getStudentById(id);
    if (!student) {
      app.innerHTML = `<section class="page"><a href="#/students" class="back-link">← Back to Students</a><h1 class="page-title">Student not found</h1></section>`;
      return;
    }
    await renderDetail(app, student);
  } catch (err) {
    app.innerHTML = `<section class="page"><a href="#/students" class="back-link">← Back to Students</a><div class="error-state"><span class="error-state-icon">⚠️</span><h2>Failed to load student</h2><p>${err.message}</p><p class="error-hint">Make sure the backend server is running on port 3000.</p></div></section>`;
  }
}

async function renderDetail(app, student) {
  const interventions = await getInterventionsForStudent(student.id);
  const typeLabel = { counselling: 'Counselling Session', parent_meeting: 'Parent Meeting', academic_support: 'Academic Support', financial_aid: 'Financial Aid', mentorship: 'Mentorship' };

  const interventionHTML = interventions.length
    ? interventions.map(i => `<div class="intervention-item"><div class="intervention-header"><strong>${typeLabel[i.type] || i.type}</strong><span class="intervention-date">${i.date}</span></div><p class="intervention-note">${i.note}</p></div>`).join('')
    : '<p class="empty-state">No interventions logged yet.</p>';

  const riskFactorsHTML = student.riskFactors.length
    ? `<ul class="risk-factor-list">${student.riskFactors.map(f => `<li class="risk-factor-item ${f.severity}"><span class="factor-dot ${f.severity}"></span>${f.label}</li>`).join('')}</ul>`
    : '<p class="empty-state">No significant risk factors identified.</p>';

  app.innerHTML = `
    <section class="page">
      <a href="#/students" class="back-link">← Back to Students</a>
      <div class="profile-header ${student.status}">
        <div class="profile-header-band"></div>
        <div class="profile-header-glow"></div>
        <div class="profile-header-inner">
          <h1 class="profile-name">${student.name}</h1>
          <div class="profile-meta">
            <span>Grade ${student.grade}</span><span>${student.area}</span><span>${student.gender}</span>
            <span>${student.economicStatus} income</span><span>${student.distanceFromSchool}km from school</span>
            ${student.hasScholarship ? '<span class="badge-scholarship">🎓 Scholarship</span>' : ''}
          </div>
        </div>
        <div class="profile-risk-panel">
          <span class="risk-label">Risk Score</span>
          <span class="risk-score-big ${student.status}">${student.riskScore}</span>
          <span class="risk-badge ${student.status}">${student.status} risk</span>
          <span class="dropout-prob">${student.dropoutProbability}% dropout probability</span>
        </div>
      </div>
      <div class="metrics-grid">
        <div class="metric-card"><span class="metric-value ${student.attendance < 75 ? 'text-danger' : ''}">${student.attendance}%</span><span class="metric-label">Attendance</span><div class="mini-bar-bg"><div class="mini-bar-fill ${student.status}" style="width:${student.attendance}%"></div></div></div>
        <div class="metric-card"><span class="metric-value ${student.gpa < 6.0 ? 'text-danger' : ''}">${student.gpa}/10</span><span class="metric-label">GPA</span><div class="mini-bar-bg"><div class="mini-bar-fill ${student.status}" style="width:${student.gpa * 10}%"></div></div></div>
        <div class="metric-card"><span class="metric-value">${student.distanceFromSchool} km</span><span class="metric-label">Distance from School</span></div>
        <div class="metric-card"><span class="metric-value ${student.previousFailures > 0 ? 'text-danger' : ''}">${student.previousFailures}</span><span class="metric-label">Previous Failures</span></div>
      </div>
      <div class="detail-section"><h2 class="section-heading">⚠️ Risk Factors</h2>${riskFactorsHTML}</div>
      <div class="detail-section"><h2 class="section-heading">📈 Risk Trend (Last 6 Months)</h2><canvas id="trendChart"></canvas></div>
      <div class="detail-section"><h2 class="section-heading">📋 Intervention History</h2><div id="interventionHistory">${interventionHTML}</div></div>
      <div class="detail-section">
        <h2 class="section-heading">➕ Log Intervention</h2>
        <div class="form-card">
          <div class="form-group"><label for="interventionType">Type</label>
            <select id="interventionType"><option value="">-- Select type --</option><option value="counselling">Counselling Session</option><option value="parent_meeting">Parent Meeting</option><option value="academic_support">Academic Support</option><option value="financial_aid">Financial Aid</option><option value="mentorship">Mentorship</option></select>
          </div>
          <div class="form-group"><label for="interventionNote">Notes</label><textarea id="interventionNote" placeholder="Describe the intervention and outcome…"></textarea></div>
          <button class="btn btn-primary" id="saveIntervention">Save Intervention</button>
          <div id="formMessage"></div>
        </div>
      </div>
    </section>`;

  // Render trend chart
  const ctx = document.getElementById('trendChart');
  if (ctx && student.riskTrend) {
    const lc = student.status === 'high' ? '#ff5c72' : student.status === 'medium' ? '#f5a623' : '#0dca73';
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: student.riskTrend.map(t => t.month),
        datasets: [{ label: 'Risk Score', data: student.riskTrend.map(t => t.score), borderColor: lc, backgroundColor: lc + '12', tension: 0.4, fill: true, pointBackgroundColor: lc, pointBorderColor: '#0a0a0a', pointBorderWidth: 2, pointRadius: 3 }]
      },
      options: { scales: { y: { min:0, max:100, grid:{color:'rgba(255,255,255,.04)'}, ticks:{color:'#555',font:{family:'Inter',size:10}} }, x: { grid:{color:'rgba(255,255,255,.04)'}, ticks:{color:'#555',font:{family:'Inter',size:10}} } }, plugins: { legend:{labels:{color:'#888',font:{family:'Inter'}}}, tooltip:{backgroundColor:'#141414',borderColor:'rgba(255,255,255,.1)',borderWidth:1,titleColor:'#ededed',bodyColor:'#888',cornerRadius:7} } }
    });
  }

  // Save handler
  document.getElementById('saveIntervention').addEventListener('click', async () => {
    const type = document.getElementById('interventionType').value;
    const note = document.getElementById('interventionNote').value.trim();
    const msg = document.getElementById('formMessage');
    if (!type || !note) { msg.innerHTML = '<div class="form-message error">⚠️ Please fill in all fields.</div>'; return; }
    try {
      await saveIntervention({ studentId: student.id, studentName: student.name, type, note });
      await renderDetail(app, student);
    } catch (err) {
      msg.innerHTML = `<div class="form-message error">⚠️ Failed to save: ${err.message}</div>`;
    }
  });
}