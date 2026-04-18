export function buildStudentCard(student) {
  return `
    <div class="student-card ${student.status}"
         onclick="window.location.hash='#/student/${student.id}'">

      <div class="student-card-band"></div>

      <div class="student-card-body">

        <div class="card-header">
          <div class="card-header-left">
            <span class="student-name">${student.name}</span>
            <span class="student-grade">
              Grade ${student.grade} · ${student.area}
            </span>
          </div>
          <span class="risk-badge ${student.status}">
            ${student.status}
          </span>
        </div>

        <div class="card-stats">
          <div class="card-stat">
            <span class="card-stat-value
              ${student.attendance < 75 ? 'text-danger' : ''}">
              ${student.attendance}%
            </span>
            <span class="card-stat-label">Attend</span>
          </div>
          <div class="card-stat">
            <span class="card-stat-value
              ${student.gpa < 5.5 ? 'text-danger' : ''}">
              ${student.gpa}
            </span>
            <span class="card-stat-label">GPA</span>
          </div>
          <div class="card-stat">
            <span class="card-stat-value">
              ${student.dropoutProbability}%
            </span>
            <span class="card-stat-label">Dropout</span>
          </div>
        </div>

        <div class="risk-bar-wrap">
          <div class="risk-bar-label">
            <span>Risk Score</span>
            <strong>${student.riskScore}/100</strong>
          </div>
          <div class="risk-bar-bg">
            <div class="risk-bar-fill ${student.status}"
                 style="width:${student.riskScore}%"></div>
          </div>
        </div>

      </div>

      ${student.riskFactors?.length ? `
        <div class="card-factors">
          ${student.riskFactors.slice(0,2).map(f => `
            <span class="factor-tag ${f.severity}">${f.label}</span>
          `).join('')}
        </div>` : ''}

    </div>
  `;
}