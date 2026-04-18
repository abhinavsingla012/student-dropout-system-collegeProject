import { renderDashboard }     from '../renderers/dashboard.js';
import { renderStudents }      from '../renderers/students.js';
import { renderStudentDetail } from '../renderers/studentDetail.js';
import { renderAnalytics }     from '../renderers/analytics.js';
import { renderInterventions } from '../renderers/interventions.js';

export function renderPage() {
  const hash = window.location.hash || '#/dashboard';
  setActiveNav(hash);

  if      (hash === '#/dashboard')          renderDashboard();
  else if (hash === '#/students')           renderStudents();
  else if (hash === '#/interventions')      renderInterventions();
  else if (hash === '#/analytics')          renderAnalytics();
  else if (hash.startsWith('#/student/')) {
    const id = hash.split('/')[2];
    renderStudentDetail(id);
  }
  else {
    document.getElementById('app').innerHTML =
      `<section class="page"><h1>404 — Page not found</h1></section>`;
  }
}

function setActiveNav(hash) {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === hash);
  });
}