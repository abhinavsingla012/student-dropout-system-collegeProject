const app = document.getElementById('app')!;

// Highlight active nav link based on current hash
function setActiveNav(): void {
  const hash = window.location.hash || '#/dashboard';
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === hash);
  });
}

// Simple page renderer based on hash
function renderPage(): void {
  const hash = window.location.hash || '#/dashboard';
  setActiveNav();

  if (hash === '#/dashboard') {
    app.innerHTML = `
      <section class="page">
        <h1 class="page-title">📊 Dashboard</h1>
        <p class="page-subtitle">Overview of student dropout risk across all enrolled students.</p>
        <div class="stats-row">
          <div class="stat-card">
            <span class="stat-number">142</span>
            <span class="stat-label">Total Students</span>
          </div>
          <div class="stat-card risk-high">
            <span class="stat-number">18</span>
            <span class="stat-label">High Risk</span>
          </div>
          <div class="stat-card risk-med">
            <span class="stat-number">34</span>
            <span class="stat-label">Medium Risk</span>
          </div>
          <div class="stat-card risk-low">
            <span class="stat-number">90</span>
            <span class="stat-label">Low Risk</span>
          </div>
        </div>
        <p class="coming-soon">📋 Student list loads here on Day 4.</p>
      </section>
    `;
  } else if (hash === '#/students') {
    app.innerHTML = `
      <section class="page">
        <h1 class="page-title">🎓 Students</h1>
        <p class="page-subtitle">Full student list with risk scores and profiles.</p>
        <p class="coming-soon">🔧 Student cards load here on Day 4.</p>
      </section>
    `;
  } else if (hash === '#/interventions') {
    app.innerHTML = `
      <section class="page">
        <h1 class="page-title">🤝 Interventions</h1>
        <p class="page-subtitle">Log and track support actions for at-risk students.</p>
        <p class="coming-soon">🔧 Intervention form loads here on Day 5.</p>
      </section>
    `;
  } else {
    app.innerHTML = `<section class="page"><h1>404 — Page not found</h1></section>`;
  }
}

// Listen for hash changes (clicking nav links)
window.addEventListener('hashchange', renderPage);

// Run on first load
renderPage();