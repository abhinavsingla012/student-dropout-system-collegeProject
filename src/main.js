import { renderPage } from './router/router.js';

window.addEventListener('hashchange', renderPage);
renderPage();