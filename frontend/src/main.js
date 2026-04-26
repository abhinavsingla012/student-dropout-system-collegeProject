import { renderPage } from './router/router.js';
import { clearUnreadAlerts, disconnectRealtime, syncRealtimeAuth } from './services/realtimeService.js';

window.addEventListener('hashchange', renderPage);
renderPage();


const themeBtn = document.getElementById('theme-toggle');
const sunIcon = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
const moonIcon = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  if (saved === 'light' || (!saved && prefersLight)) {
    document.body.classList.add('light-mode');
  }
  updateThemeIcon();
}

function updateThemeIcon() {
  const isLight = document.body.classList.contains('light-mode');
  if (themeBtn) themeBtn.innerHTML = isLight ? moonIcon : sunIcon;
}

if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    updateThemeIcon();
    window.dispatchEvent(new Event('themeToggled'));
  });
}

// Logout Logic (Unit III)
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    disconnectRealtime();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.hash = '#/login';
  });
}

const headerPresence = document.getElementById('headerPresence');
if (headerPresence) {
  headerPresence.addEventListener('click', () => {
    clearUnreadAlerts();
  });
}

// Global Auth UI State
function checkAuthState() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const logoutBtn = document.getElementById('logout-btn');
  const loginLink = document.getElementById('login-link');
  const appNav = document.getElementById('appNav');
  const headerPresenceEl = document.getElementById('headerPresence');
  const navCounselors = document.getElementById('navCounselors');
  
  if (token) {
    syncRealtimeAuth({ token, user });
    logoutBtn?.classList.remove('hidden');
    appNav?.classList.remove('hidden');
    headerPresenceEl?.classList.remove('hidden');
    loginLink?.classList.add('hidden');
    if (user.role === 'admin') {
      navCounselors?.classList.remove('hidden');
    } else {
      navCounselors?.classList.add('hidden');
    }

    // Initialize Notification Hub if not already done
    const hub = document.getElementById('notificationHubContainer');
    if (hub) {
      hub.classList.remove('hidden');
      if (!window.__hubInitialized) {
        import('./components/notificationHub.js').then(m => m.initNotificationHub());
        window.__hubInitialized = true;
      }
    }
  } else {
    disconnectRealtime();
    logoutBtn?.classList.add('hidden');
    appNav?.classList.add('hidden');
    headerPresenceEl?.classList.add('hidden');
    loginLink?.classList.remove('hidden');
    navCounselors?.classList.add('hidden');

    const hub = document.getElementById('notificationHubContainer');
    if (hub) hub.classList.add('hidden');
  }
}

window.addEventListener('hashchange', checkAuthState);
window.addEventListener('load', checkAuthState);

initTheme();
checkAuthState();