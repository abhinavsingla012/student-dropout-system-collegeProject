export function renderLanding() {
  const app = document.getElementById('app');
  app.classList.add('full-width');

    const token = localStorage.getItem('token');
    const heroButtons = token 
      ? `<a href="#/dashboard" class="ledger-button ledger-button-primary">Open Dashboard</a>
         <a href="#/students" class="ledger-button ledger-button-secondary">Explore Students</a>`
      : `<a href="#/login" class="ledger-button ledger-button-primary">Log In to Access Terminal</a>`;

    const ctaButtons = token
      ? `<a href="#/analytics" class="ledger-button ledger-button-primary">Open Analytics</a>
         <a href="#/interventions" class="ledger-button ledger-button-secondary">Go to Interventions</a>`
      : `<a href="#/login" class="ledger-button ledger-button-primary">Sign In for Institutional Access</a>`;

    app.innerHTML = `
    <div class="landing">
      <div class="landing-orb landing-orb-a"></div>
      <div class="landing-orb landing-orb-b"></div>
      <div class="landing-grid"></div>

      <section class="ledger-hero">
        <div class="ledger-hero-copy">
          <span class="page-kicker">Student dropout analysis</span>
          <h1 class="ledger-hero-title">Identify risk, coordinate care, ensure student success.</h1>
          <p class="ledger-hero-subtitle">
            SDAS helps school teams move from prediction to intervention with a live dashboard,
            explainable risk drivers, and case-level workflows built for real student support.
          </p>
          <div class="ledger-hero-actions">
            ${heroButtons}
          </div>
          <div class="ledger-proof-strip">
            <div class="ledger-proof-item">
              <strong>180+</strong>
              <span>student records monitored</span>
            </div>
            <div class="ledger-proof-item">
              <strong>5</strong>
              <span>intervention pathways tracked</span>
            </div>
            <div class="ledger-proof-item">
              <strong>Live</strong>
              <span>daily briefing for staff teams</span>
            </div>
          </div>
        </div>

        <div class="ledger-hero-panel surface-card">
          <div class="ledger-panel-top">
            <div>
              <p class="ledger-panel-kicker">Daily operations brief</p>
              <h2>Today the highest pressure sits in rural and low-income cohorts.</h2>
            </div>
            <span class="ledger-live-pill"><span class="status-dot"></span>Live</span>
          </div>

          <div class="ledger-kpi-grid">
            <article class="ledger-kpi-card">
              <span class="ledger-kpi-label">High-risk students</span>
              <strong class="ledger-kpi-value danger">24</strong>
              <p>Require active monitoring today</p>
            </article>
            <article class="ledger-kpi-card">
              <span class="ledger-kpi-label">Average attendance</span>
              <strong class="ledger-kpi-value">81%</strong>
              <p>Across the current cohort</p>
            </article>
            <article class="ledger-kpi-card">
              <span class="ledger-kpi-label">Open interventions</span>
              <strong class="ledger-kpi-value accent">37</strong>
              <p>Needs follow-up coordination</p>
            </article>
            <article class="ledger-kpi-card">
              <span class="ledger-kpi-label">Leading driver</span>
              <strong class="ledger-kpi-value warning">Attendance</strong>
              <p>Most common trigger this week</p>
            </article>
          </div>

          <div class="ledger-watchlist">
            <div class="ledger-watchlist-head">
              <span>Priority watchlist</span>
              ${token ? '<a href="#/students">Review roster</a>' : '<span class="text-muted">Login to review roster</span>'}
            </div>
            <div class="ledger-watch-item">
              <div>
                <strong>Elena Rodriguez</strong>
                <span>Attendance decline and GPA pressure</span>
              </div>
              <mark>88</mark>
            </div>
            <div class="ledger-watch-item">
              <div>
                <strong>Marcus Vance</strong>
                <span>Long commute and repeated absences</span>
              </div>
              <mark>84</mark>
            </div>
            <div class="ledger-watch-item">
              <div>
                <strong>Julian Moore</strong>
                <span>Needs intervention follow-up</span>
              </div>
              <mark>72</mark>
            </div>
          </div>
        </div>
      </section>

      <section class="landing-section landing-capabilities">
        <div class="landing-section-head">
          <span class="section-kicker">Core capabilities</span>
          <h2>Built for the school teams who need to act, not just observe.</h2>
          <p>
            The product sits between analytics and care management: it detects patterns, prioritizes where staff
            should focus, and keeps intervention histories visible at the case level.
          </p>
        </div>

        <div class="landing-feature-grid">
          <article class="landing-feature landing-feature-wide surface-card">
            <span class="landing-feature-icon">01</span>
            <h3>Predictive risk scoring</h3>
            <p>
              Combine attendance, GPA, commute burden, economic status, and academic history into a clear,
              explainable risk signal that staff can trust.
            </p>
          </article>
          <article class="landing-feature surface-card">
            <span class="landing-feature-icon">02</span>
            <h3>Student roster intelligence</h3>
            <p>Searchable and filterable profiles with risk level, dropout probability, and decision-ready metadata.</p>
          </article>
          <article class="landing-feature surface-card">
            <span class="landing-feature-icon">03</span>
            <h3>Action center workflows</h3>
            <p>Move directly from an urgent case into intervention logging, follow-up notes, and recommended support types.</p>
          </article>
          <article class="landing-feature surface-card">
            <span class="landing-feature-icon">04</span>
            <h3>Area and cohort analytics</h3>
            <p>Locate hotspot clusters, compare groups, and understand why pressure is rising before students disengage further.</p>
          </article>
        </div>
      </section>

      <section class="landing-section landing-cta-band">
        <div class="landing-cta-copy">
          <span class="section-kicker">Operational focus</span>
          <h2>A calmer, clearer interface for urgent school decisions.</h2>
          <p>
            Use the dashboard for the daily brief, the roster for triage, analytics for pattern recognition,
            and interventions for structured case action.
          </p>
        </div>
        <div class="landing-cta-actions">
          ${ctaButtons}
        </div>
      </section>
    </div>
  `;
}
