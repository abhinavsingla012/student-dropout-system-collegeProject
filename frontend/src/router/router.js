import { renderLanding }       from '../renderers/landing.js';
import { renderDashboard }     from '../renderers/dashboard.js';
import { renderStudents }      from '../renderers/students.js';
import { renderStudentDetail } from '../renderers/studentDetail.js';
import { renderAnalytics }     from '../renderers/analytics.js';
import { renderInterventions } from '../renderers/interventions.js';
import { renderLogin }         from '../renderers/login.js';

export function renderPage() {
  const hash = window.location.hash || '#/home';
  const app  = document.getElementById('app');
  const token = localStorage.getItem('token');

  // Public routes that don't need login
  const isLanding = hash === '#/home' || hash === '#/' || hash === '';
  const isLogin = hash === '#/login';

  // Auth Guard: If not logged in and trying to access private page, go to login
  if (!token && !isLanding && !isLogin) {
    window.location.hash = '#/login';
    return;
  }

  // Reset layout classes
  app.classList.remove('full-width');

  // Handle Global UI (Header/Footer) visibility
  if (isLogin) {
    document.getElementById('appHeader')?.classList.add('hidden');
    document.getElementById('appFooter')?.classList.add('hidden');
  } else {
    document.getElementById('appHeader')?.classList.remove('hidden');
    document.getElementById('appFooter')?.classList.remove('hidden');
  }

  setActiveNav(hash);

  if      (isLanding)                       renderLanding();
  else if (isLogin)                         renderLogin();
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