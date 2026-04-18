import { students } from '../services/studentService.js';
import {
  saveIntervention,
  getAllInterventions
} from '../services/interventionService.js';

const TYPE_LABEL = {
  counselling:      'Counselling Session',
  parent_meeting:   'Parent Meeting',
  academic_support: 'Academic Support',
  financial_aid:    'Financial Aid',
  mentorship:       'Mentorship',
};

export function renderInterventions() {
  document.getElementById('app').innerHTML = `
    <section class="page">

      <div class="page-header">
        <div class="page-title-group">
          <h1 class="page-title">Interventions</h1>
          <p class="page-subtitle">
            Log support actions for at-risk students
            and track intervention history.
          </p>
        </div>
      </div>

      <div class="interventions-layout">

        <!-- ── Form ── -->
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
                  .map(s => `
                    <option value="${s.id}">
                      ${s.name} — ${s.status} risk (${s.riskScore})
                    </option>`)
                  .join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="interventionType">Type of Intervention</label>
              <select id="interventionType">
                <option value="">-- Select type --</option>
                ${Object.entries(TYPE_LABEL).map(([v, l]) =>
                  `<option value="${v}">${l}</option>`
                ).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="interventionNote">Notes</label>
              <textarea id="interventionNote"
                placeholder="Describe the intervention and outcome…">
              </textarea>
            </div>
            <button class="btn btn-primary" id="submitIntervention">
              Save Intervention
            </button>
            <div id="formMessage"></div>
          </div>
        </div>

        <!-- ── History ── -->
        <div>
          <p class="section-label">Recent Interventions</p>
          <div id="historyList">
            ${buildHistoryHTML()}
          </div>
        </div>

      </div>
    </section>
  `;

  document.getElementById('submitIntervention')
    .addEventListener('click', () => {
      const studentId = document.getElementById('studentSelect').value;
      const type      = document.getElementById('interventionType').value;
      const note      = document.getElementById('interventionNote')
                          .value.trim();
      const msg       = document.getElementById('formMessage');
      const student   = students.find(s => s.id === Number(studentId));

      if (!studentId || !type || !note) {
        msg.innerHTML = `
          <div class="form-message error">
            ⚠️ Please fill in all fields.
          </div>`;
        return;
      }

      saveIntervention({
        studentId:   Number(studentId),
        studentName: student.name,
        type,
        note,
      });

      document.getElementById('historyList').innerHTML =
        buildHistoryHTML();

      msg.innerHTML = `
        <div class="form-message success">
          ✅ Intervention saved successfully!
        </div>`;

      document.getElementById('studentSelect').value    = '';
      document.getElementById('interventionType').value = '';
      document.getElementById('interventionNote').value = '';
    });
}

function buildHistoryHTML() {
  const all = getAllInterventions();

  if (!all.length) return `
    <div class="empty-state">
      <span class="empty-state-icon">📋</span>
      No interventions logged yet.
    </div>`;

  return all.map(i => `
    <div class="intervention-item">
      <div class="intervention-header">
        <strong>${i.studentName}</strong>
        <span class="intervention-date">${i.date}</span>
      </div>
      <span class="intervention-type-tag">
        ${TYPE_LABEL[i.type] || i.type}
      </span>
      <p class="intervention-note">${i.note}</p>
    </div>
  `).join('');
}