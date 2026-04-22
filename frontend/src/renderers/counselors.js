import { getAllStudents } from '../services/studentService.js';
import { handleUnauthorized } from '../services/authSession.js';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return map[character];
  });
}

export async function renderCounselors() {
  const app = document.getElementById('app');
  app.classList.remove('full-width');

  app.innerHTML = `
    <div class="page-header">
      <div>
        <span class="page-kicker">Staff Management</span>
        <h1>Counselor Oversight</h1>
      </div>
    </div>

    <div class="counselor-grid" id="counselorContainer">
      <div class="loading-state">Initializing staff records...</div>
    </div>
  `;

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.hash = '#/login';
      return;
    }

    const staffRes = await fetch('http://localhost:3000/api/users/staff', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (handleUnauthorized(staffRes)) return;
    if (!staffRes.ok) {
      throw new Error('Failed to load counselor data.');
    }

    const staff = await staffRes.json();
    const students = await getAllStudents();

    const container = document.getElementById('counselorContainer');
    container.innerHTML = '';

    if (!staff.length) {
      container.innerHTML = '<div class="empty-state">No counselors found.</div>';
      return;
    }

    staff.forEach(member => {
      const assigned = students.filter(s => s.assignedCounselorId === member.id);
      const unassigned = students.filter(s => !s.assignedCounselorId);
      
      const workloadPercentage = Math.min((assigned.length / 15) * 100, 100);
      const workloadColor = workloadPercentage > 80 ? 'danger' : workloadPercentage > 50 ? 'warning' : 'success';

      const card = document.createElement('div');
      card.className = 'staff-card surface-card';
      card.innerHTML = `
        <div class="staff-card-header">
          <div class="staff-avatar">${escapeHtml(member.name.charAt(0))}</div>
          <div class="staff-info">
            <h3>${escapeHtml(member.name)}</h3>
            <p>${escapeHtml(member.email)}</p>
          </div>
          <span class="staff-role-badge">Counselor</span>
        </div>

        <div class="workload-section">
          <div class="workload-label-row">
            <span>Roster Capacity</span>
            <span>${assigned.length} / 15 Students</span>
          </div>
          <div class="mini-bar-bg">
            <div class="mini-bar-fill ${workloadColor}" style="width:${workloadPercentage}%"></div>
          </div>
        </div>

        <div class="staff-stats">
          <div class="stat-item">
            <span class="stat-label">Handled Students</span>
            <span class="stat-value">${assigned.length}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Response Time</span>
            <span class="stat-value">2.4h</span>
          </div>
        </div>

        <div class="assigned-list">
          <p class="list-label">Currently Assigned:</p>
          <div class="student-mini-list">
            ${assigned.length > 0 
              ? assigned.map(s => `<button class="student-tag clickable" data-student-id="${s.id}">${escapeHtml(s.name)}</button>`).join('')
              : '<span class="text-muted italic text-xs">No students assigned yet.</span>'}
          </div>
        </div>

        <div class="manage-assignment-box">
          <label class="assign-label" for="assignSelect-${member.id}">Assign New Student</label>
          <div class="assignment-row">
            <select id="assignSelect-${member.id}" class="filter-select assign-select">
              <option value="">Choose unassigned student...</option>
              ${unassigned.map(s => `<option value="${s.id}">${escapeHtml(s.name)} (Grade ${s.grade})</option>`).join('')}
            </select>
            <button class="assign-btn" data-counselor-id="${member.id}">
              Assign
            </button>
          </div>
          <p class="assign-meta">${unassigned.length} unassigned students available</p>
        </div>
      `;
      container.appendChild(card);
    });

    container.querySelectorAll('.student-tag.clickable').forEach((button) => {
      button.addEventListener('click', () => {
        const studentId = button.getAttribute('data-student-id');
        if (studentId) {
          window.location.hash = `#/student/${studentId}`;
        }
      });
    });

    container.querySelectorAll('.assign-btn').forEach((button) => {
      button.addEventListener('click', async () => {
        const counselorId = Number(button.getAttribute('data-counselor-id'));
        const select = document.getElementById(`assignSelect-${counselorId}`);
        const studentId = select?.value;
        if (!studentId) return;

        button.disabled = true;
        button.textContent = 'Assigning...';

        try {
          const res = await fetch('http://localhost:3000/api/users/assign', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ studentId: Number(studentId), counselorId })
          });

          if (handleUnauthorized(res)) return;

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Failed to assign student.');
          }

          renderCounselors();
        } catch (err) {
          alert(`Failed: ${err.message}`);
        } finally {
          button.disabled = false;
          button.textContent = 'Assign';
        }
      });
    });

  } catch (error) {
    app.innerHTML += `<div class="error-state">Failed to load staff data: ${error.message}</div>`;
  }
}
