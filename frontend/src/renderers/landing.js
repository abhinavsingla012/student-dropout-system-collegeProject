export function renderLanding() {
  const app = document.getElementById('app');
  app.classList.add('full-width');

  app.innerHTML = `
    <div class="landing">
      <div class="landing-grid"></div>
      <div class="landing-glow"></div>

      <section class="hero">
        <div class="hero-eyebrow">
          <span class="hero-eyebrow-dot"></span>
          Data-Driven Student Success
        </div>

        <h1 class="hero-title">
          <span class="hero-title-grad">Predict. Intervene.<br>Succeed.</span>
        </h1>

        <p class="hero-sub">
          Real-time risk analytics and intervention tracking
          to identify at-risk students before they fall through the cracks.
        </p>

        <div class="hero-cta-wrap">
          <a href="#/dashboard" class="hero-cta">
            Open Dashboard
            <span class="hero-cta-arrow">→</span>
          </a>
        </div>
      </section>

      <div class="features">
        <div class="feature-card">
          <div class="feature-icon feature-icon--a">📊</div>
          <h3 class="feature-title">Predictive Analytics</h3>
          <p class="feature-desc">Multi-factor risk scoring across attendance, GPA, socioeconomic data, and academic history.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon feature-icon--b">🔍</div>
          <h3 class="feature-title">Real-Time Monitoring</h3>
          <p class="feature-desc">Live dashboards with filterable profiles, trend charts, and drill-down views for 180+ students.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon feature-icon--c">🤝</div>
          <h3 class="feature-title">Intervention Tracking</h3>
          <p class="feature-desc">Log counselling, meetings, financial aid, and mentorship — all persisted and auditable.</p>
        </div>
      </div>

    </div>`;
}
