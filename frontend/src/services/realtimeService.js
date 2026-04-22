import { io } from 'socket.io-client';

const API_BASE_URL = 'http://localhost:3000';
let socket = null;
let connectedUserId = null;
let unreadAlerts = 0;

const updateAlertBadge = () => {
  const badge = document.getElementById('live-alert-badge');
  if (!badge) {
    return;
  }
  if (unreadAlerts > 0) {
    badge.textContent = unreadAlerts > 99 ? '99+' : String(unreadAlerts);
    badge.classList.remove('hidden');
  } else {
    badge.textContent = '0';
    badge.classList.add('hidden');
  }
};

const incrementAlerts = () => {
  unreadAlerts += 1;
  updateAlertBadge();
};

export const clearUnreadAlerts = () => {
  unreadAlerts = 0;
  updateAlertBadge();
};

const getToastContainer = () => {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
};

const showToast = (title, message, variant = 'info') => {
  const container = getToastContainer();
  const toast = document.createElement('div');
  toast.className = `app-toast ${variant}`;
  toast.innerHTML = `
    <strong>${title}</strong>
    <p>${message}</p>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('closing');
    setTimeout(() => toast.remove(), 250);
  }, 4500);
};

export const disconnectRealtime = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    connectedUserId = null;
  }
  clearUnreadAlerts();
};

export const syncRealtimeAuth = ({ token, user }) => {
  if (!token || !user?.id) {
    disconnectRealtime();
    return;
  }

  if (socket && connectedUserId === user.id) {
    updateAlertBadge();
    return;
  }

  disconnectRealtime();
  connectedUserId = user.id;
  socket = io(API_BASE_URL, {
    auth: {
      token: `Bearer ${token}`
    },
    transports: ['websocket', 'polling']
  });

  socket.on('connect_error', () => {
    showToast('Realtime Unavailable', 'Live updates are temporarily offline.', 'warning');
  });

  socket.on('student_assigned', (payload) => {
    incrementAlerts();
    showToast(
      'New Student Assignment',
      `${payload.studentName} was assigned to your roster.`,
      'success'
    );
  });

  socket.on('intervention_logged', (payload) => {
    incrementAlerts();
    const suffix = payload.studentName ? ` for ${payload.studentName}` : '';
    showToast('Intervention Logged', `A new intervention was recorded${suffix}.`, 'info');
  });

  socket.on('student_unassigned', (payload) => {
    incrementAlerts();
    showToast(
      'Student Reassigned',
      `${payload.studentName} was moved off your roster.`,
      'warning'
    );
  });
};
