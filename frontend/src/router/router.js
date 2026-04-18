import { renderLanding }       from '../renderers/landing.js';
import { renderDashboard }     from '../renderers/dashboard.js';
import { renderStudents }      from '../renderers/students.js';
import { renderStudentDetail } from '../renderers/studentDetail.js';
import { renderAnalytics }     from '../renderers/analytics.js';
import { renderInterventions } from '../renderers/interventions.js';

export function renderPage() {
  const hash = window.location.hash || '#/home';
  const app  = document.getElementById('app');

  // Reset layout classes from landing page
  app.classList.remove('full-width');

  // Navbar and Footer are now global
  document.getElementById('appHeader')?.classList.remove('hidden');
  document.getElementById('appFooter')?.classList.remove('hidden');

  setActiveNav(hash);

  const isLanding = hash === '#/home' || hash === '#/' || hash === '';
  if      (isLanding)                       renderLanding();
  else if (hash === '#/dashboard')          renderDashboard();
  else if (hash === '#/students')           renderStudents();
  else if (hash === '#/interventions')      renderInterventions();
  else if (hash === '#/analytics')          renderAnalytics();
  else if (hash.startsWith('#/student/')) {
    const id = hash.split('/')[2];
    renderStudentDetail(id);
  }
  else {
    app.innerHTML =
      `<section class="page"><h1>404 — Page not found</h1></section>`;
  }
}

function setActiveNav(hash) {
  document.querySelectorAll('.nav-link[data-nav]').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === hash);
  });
}