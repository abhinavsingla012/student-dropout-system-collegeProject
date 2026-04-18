import { getAllStudents } from '../services/studentService.js';
import { saveIntervention, getAllInterventions } from '../services/interventionService.js';

const TYPE_LABEL = {
  counselling:      'Counselling Session',
  parent_meeting:   'Parent Meeting',
  academic_support: 'Academic Support',
  financial_aid:    'Financial Aid',
  mentorship:       'Mentorship',
};

export async function renderInterventions() {
  const app = document.getElementById('app');
  app.innerHTML = `<section class="page"><div class="loading-state"><div class="loading-spinner"></div><p>Loading interventions…</p></div></section>`;

  try {
    const [students, allInterventions] = await Promise.all([
      getAllStudents(),
      getAllInterventions(),
    ]);

    app.innerHTML = `
      <section class="page">
        <div class="page-header">
          <div class="page-title-group">
            <h1 class="page-title">Interventions</h1>
            <p class="page-subtitle">Log support actions for at-risk students and track intervention history.</p>
          </div>
        </div>

        <div class="interventions-layout">
          <div>
            <p class="section-label">Log New Intervention</p>
            <div class="form-card">
              <div class="form-group">
                <label for="studentSelect">Student</label>
                <select id="studentSelect">
                  <option value="">-- Select a student --</option>
                  ${students
                    .slice()
                    .sort((a, b) => b.riskScore - a.riskScore)
                    .map(s => `<option value="${s.id}">${s.name} — ${s.status} risk (${s.riskScore})</option>`)
                    .join('')}
                </select>
              </div>
              <div class="form-group">
                <label for="interventionType">Type of Intervention</label>
                <select id="interventionType">
                  <option value="">-- Select type --</option>
                  ${Object.entries(TYPE_LABEL).map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label for="interventionNote">Notes</label>
                <textarea id="interventionNote" placeholder="Describe the intervention and outcome…"></textarea>
              </div>
              <button class="btn btn-primary" id="submitIntervention">Save Intervention</button>
              <div id="formMessage"></div>
            </div>
          </div>

          <div>
            <p class="section-label">Recent Interventions</p>
            <div id="historyList">${buildHistoryHTML(allInterventions)}</div>
          </div>
        </div>
      </section>`;

    // Submit handler
    document.getElementById('submitIntervention').addEventListener('click', async () => {
      const studentId = document.getElementById('studentSelect').value;
      const type      = document.getElementById('interventionType').value;
      const note      = document.getElementById('interventionNote').value.trim();
      const msg       = document.getElementById('formMessage');
      const student   = students.find(s => s.id === Number(studentId));

      if (!studentId || !type || !note) {
        msg.innerHTML = `<div class="form-message error">⚠️ Please fill in all fields.</div>`;
        return;
      }

      try {
        await saveIntervention({
          studentId: Number(studentId),
          studentName: student.name,
          type,
          note,
        });

        // Refresh the history list
        const updated = await getAllInterventions();
        document.getElementById('historyList').innerHTML = buildHistoryHTML(updated);

        msg.innerHTML = `<div class="form-message success">✅ Intervention saved successfully!</div>`;
        document.getElementById('studentSelect').value    = '';
        document.getElementById('interventionType').value = '';
        document.getElementById('interventionNote').value = '';
      } catch (err) {
        msg.innerHTML = `<div class="form-message error">⚠️ Failed to save: ${err.message}</div>`;
      }
    });

  } catch (err) {
    app.innerHTML = `<section class="page"><div class="error-state"><span class="error-state-icon">⚠️</span><h2>Failed to load interventions</h2><p>${err.message}</p><p class="error-hint">Make sure the backend server is running on port 3000.</p></div></section>`;
  }
}

function buildHistoryHTML(interventions) {
  if (!interventions.length) return `<div class="empty-state"><span class="empty-state-icon">📋</span>No interventions logged yet.</div>`;

  return interventions.map(i => `
    <div class="intervention-item">
      <div class="intervention-header">
        <strong>${i.studentName}</strong>
        <span class="intervention-date">${i.date}</span>
      </div>
      <span class="intervention-type-tag">${TYPE_LABEL[i.type] || i.type}</span>
      <p class="intervention-note">${i.note}</p>
    </div>
  `).join('');
}