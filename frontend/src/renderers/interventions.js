import { interventionPriorities } from '../utils/analyticsEngine.js';
import { getAllStudents } from '../services/studentService.js';
import { getAllInterventions, saveIntervention } from '../services/interventionService.js';

const TYPE_LABEL = {
  counselling: 'Counselling Session',
  parent_meeting: 'Parent Meeting',
  academic_support: 'Academic Support',
  financial_aid: 'Financial Aid',
  mentorship: 'Mentorship',
};

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

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function getStudentRecommendations(student) {
  const recommendations = [];

  if (student.attendance < 75) recommendations.push('parent_meeting');
  if (student.gpa < 6.5 || student.previousFailures > 0) recommendations.push('academic_support');
  if (student.economicStatus === 'low') recommendations.push('financial_aid');
  recommendations.push(student.status === 'high' ? 'counselling' : 'mentorship');

  return Array.from(new Set(recommendations));
}

function buildPriorityQueue(students) {
  return students
    .filter(student => student.status !== 'low')
    .sort((a, b) => {
      const scoreGap = b.riskScore - a.riskScore;
      if (scoreGap !== 0) return scoreGap;
      return a.attendance - b.attendance;
    })
    .slice(0, 6);
}

function buildQueueCards(students) {
  if (!students.length) {
    return '<div class="empty-state"><span class="empty-state-icon">Queue</span>No urgent intervention queue for the selected data.</div>';
  }

  return students
    .map(
      student => `
        <article class="queue-card" data-student-id="${student.id}">
          <div class="queue-head">
            <div>
              <h4 class="queue-name">${escapeHtml(student.name)}</h4>
              <p class="queue-meta">Grade ${student.grade} | ${escapeHtml(capitalize(student.area))} | ${escapeHtml(student.status)} risk</p>
            </div>
            <span class="queue-score">${student.riskScore}</span>
          </div>
          <div class="queue-tags">
            ${(student.riskFactors || [])
              .slice(0, 2)
              .map(factor => `<span class="factor-tag">${escapeHtml(factor.label)}</span>`)
              .join('')}
          </div>
        </article>
      `
    )
    .join('');
}

function buildPrioritySummary(priorities) {
  if (!priorities.length) {
    return '<p class="widget-desc">No intervention cluster is currently available.</p>';
  }

  return priorities
    .map(
      priority => `
        <article class="priority-card compact">
          <div class="priority-head">
            <div>
              <h4 class="priority-title">${escapeHtml(priority.title)}</h4>
              <p class="priority-meta">${priority.highRate}% high-risk concentration</p>
            </div>
            <span class="priority-score">${priority.pressureScore}</span>
          </div>
          <p class="priority-action">${escapeHtml(priority.recommendedAction)}</p>
        </article>
      `
    )
    .join('');
}

function buildHistoryHTML(interventions) {
  if (!interventions.length) {
    return '<div class="empty-state"><span class="empty-state-icon">Plan</span>No interventions have been logged yet.</div>';
  }

  return interventions
    .map(
      intervention => `
        <article class="intervention-item intervention-item-detailed">
          <div class="intervention-header">
            <strong>${escapeHtml(intervention.studentName)}</strong>
            <span class="intervention-date">${escapeHtml(intervention.date)}</span>
          </div>
          <span class="intervention-type-tag">${escapeHtml(TYPE_LABEL[intervention.type] || intervention.type)}</span>
          <p class="intervention-note">${escapeHtml(intervention.note)}</p>
        </article>
      `
    )
    .join('');
}

function buildTypeOptions(recommendedTypes) {
  return Object.entries(TYPE_LABEL)
    .map(([value, label]) => {
      const selected = value === recommendedTypes[0] ? 'selected' : '';
      const helper = recommendedTypes.includes(value) ? 'Recommended' : 'Optional';
      return `<option value="${value}" ${selected}>${escapeHtml(label)} (${helper})</option>`;
    })
    .join('');
}

function buildSelectionSummary(student) {
  if (!student) {
    return `
      <div class="selection-summary">
        <span class="selection-label">No student selected</span>
        <p class="selection-copy">Choose a student from the priority queue or the dropdown to log a targeted intervention.</p>
      </div>
    `;
  }

  return `
    <div class="selection-summary active">
      <span class="selection-label">Selected case</span>
      <h4 class="selection-title">${escapeHtml(student.name)}</h4>
      <p class="selection-copy">Risk score ${student.riskScore}, ${escapeHtml(student.status)} risk, ${student.attendance}% attendance, ${escapeHtml(capitalize(student.area))} area.</p>
    </div>
  `;
}

export async function renderInterventions() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <section class="page">
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading intervention center...</p>
      </div>
    </section>
  `;

  try {
    const [students, allInterventions] = await Promise.all([
      getAllStudents(),
      getAllInterventions(),
    ]);

    const priorityQueue = buildPriorityQueue(students);
    const clusterPriorities = interventionPriorities(students);
    const latestActions = allInterventions.slice(0, 10);
    const interventionCounts = Object.entries(TYPE_LABEL).map(([type, label]) => ({
      label,
      count: allInterventions.filter(intervention => intervention.type === type).length,
    }));

    app.innerHTML = `
      <section class="page">
        <div class="page-header analytics-header">
          <div>
            <h1 class="page-title">Intervention Action Center</h1>
            <p class="page-subtitle">Translate the analytics findings into targeted action, prioritize urgent cases, and maintain a structured intervention log.</p>
          </div>
        </div>

        <section class="analytics-narrative">
          <div class="narrative-kicker">Action Overview</div>
          <h2 class="narrative-title">${priorityQueue.length} students currently require active intervention monitoring.</h2>
          <p class="narrative-copy">The queue below is ranked by risk score and immediate retention need. Use it to move directly from analysis into case-level support.</p>
          <p class="narrative-support">${allInterventions.length} interventions logged so far across counselling, academic support, parent outreach, and financial aid.</p>
        </section>

        <div class="analytics-summary analytics-summary-expanded">
          <div class="asummary-item">
            <span class="asummary-value" style="color:var(--accent-red)">${priorityQueue.filter(student => student.status === 'high').length}</span>
            <span class="asummary-label">High-risk cases in queue</span>
          </div>
          <div class="asummary-item">
            <span class="asummary-value" style="color:var(--accent-purple)">${allInterventions.length}</span>
            <span class="asummary-label">Total interventions</span>
          </div>
          <div class="asummary-item">
            <span class="asummary-value" style="color:var(--accent-green)">${latestActions.length}</span>
            <span class="asummary-label">Recent actions shown</span>
          </div>
          <div class="asummary-item analytics-mini-card">
            <span class="analytics-mini-label">Most used intervention</span>
            <strong>${escapeHtml(interventionCounts.sort((a, b) => b.count - a.count)[0]?.label || 'No data')}</strong>
          </div>
          <div class="asummary-item analytics-mini-card">
            <span class="analytics-mini-label">Top hotspot cluster</span>
            <strong>${escapeHtml(clusterPriorities[0]?.title || 'No cluster')}</strong>
          </div>
          <div class="asummary-item analytics-mini-card">
            <span class="analytics-mini-label">Top cluster action</span>
            <strong>${escapeHtml(clusterPriorities[0]?.driver || 'No action driver')}</strong>
          </div>
        </div>

        <div class="intervention-center-grid">
          <div class="detail-section">
            <h2 class="section-heading">Priority Queue</h2>
            <div id="priorityQueue">${buildQueueCards(priorityQueue)}</div>
          </div>

          <div class="detail-section">
            <h2 class="section-heading">Log Targeted Intervention</h2>
            <div id="selectionSummary">${buildSelectionSummary(priorityQueue[0] || null)}</div>
            <div class="form-card">
              <div class="form-group">
                <label for="studentSelect">Student</label>
                <select id="studentSelect">
                  <option value="">Select a student</option>
                  ${students
                    .slice()
                    .sort((a, b) => b.riskScore - a.riskScore)
                    .map(student => `<option value="${student.id}" ${student.id === priorityQueue[0]?.id ? 'selected' : ''}>${escapeHtml(student.name)} - ${escapeHtml(student.status)} risk (${student.riskScore})</option>`)
                    .join('')}
                </select>
              </div>
              <div class="form-group">
                <label for="interventionType">Intervention Type</label>
                <select id="interventionType">
                  <option value="">Select intervention type</option>
                  ${buildTypeOptions(priorityQueue[0] ? getStudentRecommendations(priorityQueue[0]) : ['counselling'])}
                </select>
              </div>
              <div class="form-group">
                <label for="interventionNote">Case Note</label>
                <textarea id="interventionNote" placeholder="Describe the action taken, stakeholder response, and next follow-up step."></textarea>
              </div>
              <button class="btn btn-primary" id="submitIntervention">Save Intervention</button>
              <div id="formMessage"></div>
            </div>
          </div>
        </div>

        <div class="student-case-grid">
          <div class="detail-section">
            <h2 class="section-heading">Area Intervention Clusters</h2>
            <div class="priority-list">${buildPrioritySummary(clusterPriorities.slice(0, 3))}</div>
          </div>

          <div class="detail-section">
            <h2 class="section-heading">Intervention Mix</h2>
            <div class="driver-table">
              ${interventionCounts
                .map(
                  item => `
                    <div class="driver-row">
                      <div>
                        <div class="driver-label">${escapeHtml(item.label)}</div>
                        <div class="driver-desc">Logged intervention type across the system.</div>
                      </div>
                      <div class="driver-metric">
                        <strong>${item.count}</strong>
                        <span>records</span>
                      </div>
                    </div>
                  `
                )
                .join('')}
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h2 class="section-heading">Recent Intervention Timeline</h2>
          <div id="historyList">${buildHistoryHTML(latestActions)}</div>
        </div>
      </section>
    `;

    let selectedStudent = priorityQueue[0] || null;

    const studentSelect = document.getElementById('studentSelect');
    const typeSelect = document.getElementById('interventionType');
    const noteInput = document.getElementById('interventionNote');
    const summaryRoot = document.getElementById('selectionSummary');
    const queueRoot = document.getElementById('priorityQueue');

    function syncSelectedStudent(student) {
      selectedStudent = student;
      summaryRoot.innerHTML = buildSelectionSummary(student);
      typeSelect.innerHTML = `
        <option value="">Select intervention type</option>
        ${buildTypeOptions(student ? getStudentRecommendations(student) : ['counselling'])}
      `;
      if (student) {
        studentSelect.value = String(student.id);
      }
    }

    queueRoot.querySelectorAll('.queue-card').forEach(card => {
      card.addEventListener('click', () => {
        const student = students.find(entry => entry.id === Number(card.dataset.studentId));
        if (student) syncSelectedStudent(student);
      });
    });

    studentSelect.addEventListener('change', event => {
      const student = students.find(entry => entry.id === Number(event.target.value));
      syncSelectedStudent(student || null);
    });

    document.getElementById('submitIntervention').addEventListener('click', async () => {
      const studentId = studentSelect.value;
      const type = typeSelect.value;
      const note = noteInput.value.trim();
      const message = document.getElementById('formMessage');
      const student = students.find(entry => entry.id === Number(studentId));

      if (!studentId || !type || !note) {
        message.innerHTML = '<div class="form-message error">Please choose a student, intervention type, and case note.</div>';
        return;
      }

      try {
        await saveIntervention({
          studentId: Number(studentId),
          studentName: student.name,
          type,
          note,
        });

        const updated = await getAllInterventions();
        document.getElementById('historyList').innerHTML = buildHistoryHTML(updated.slice(0, 10));
        message.innerHTML = '<div class="form-message success">Intervention saved successfully.</div>';
        noteInput.value = '';
        syncSelectedStudent(student);
      } catch (error) {
        message.innerHTML = `<div class="form-message error">Failed to save intervention: ${escapeHtml(error.message)}</div>`;
      }
    });
  } catch (error) {
    app.innerHTML = `
      <section class="page">
        <div class="loading-state">
          <h2>Failed to load interventions</h2>
          <p>${escapeHtml(error.message)}</p>
        </div>
      </section>
    `;
  }
}
