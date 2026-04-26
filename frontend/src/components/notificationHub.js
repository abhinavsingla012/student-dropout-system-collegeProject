import { notificationService } from '../services/notificationService.js';

let initialized = false;
let activeUserId = null;
let notifications = [];
let elements = {};

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return map[character];
  });
}

function resolveElements() {
  elements = {
    bellBtn: document.getElementById('notificationBellBtn'),
    dropdown: document.getElementById('notificationDropdown'),
    badge: document.getElementById('notification-badge'),
    feed: document.getElementById('notificationFeed'),
    markAllReadBtn: document.getElementById('markAllReadBtn'),
  };

  return Object.values(elements).every(Boolean);
}

function updateBadge(count) {
  if (!elements.badge) return;

  if (count > 0) {
    elements.badge.textContent = count > 9 ? '9+' : count;
    elements.badge.classList.remove('hidden');
  } else {
    elements.badge.textContent = '0';
    elements.badge.classList.add('hidden');
  }
}

function renderNotifications() {
  if (!elements.feed) return;

  if (notifications.length === 0) {
    elements.feed.innerHTML = '<div class="p-8 text-center text-muted text-xs">No notifications yet</div>';
    return;
  }

  elements.feed.innerHTML = notifications.map(note => `
    <div class="notification-item ${escapeHtml(note.type)} ${note.isRead ? '' : 'unread'}" data-id="${escapeHtml(note._id)}">
      <span class="notification-title">${escapeHtml(note.title)}</span>
      <p class="notification-msg">${escapeHtml(note.message)}</p>
      <span class="notification-time">${new Date(note.createdAt).toLocaleString()}</span>
    </div>
  `).join('');

  elements.feed.querySelectorAll('.notification-item').forEach(item => {
    item.onclick = async () => {
      const id = item.dataset.id;
      const note = notifications.find(n => n._id === id);
      if (note && !note.isRead) {
        await notificationService.markAsRead(id);
        note.isRead = true;
        refreshUI();
      }
      if (note?.data?.studentId) {
        window.location.hash = `#/student/${note.data.studentId}`;
        elements.dropdown?.classList.add('hidden');
      }
    };
  });
}

function refreshUI() {
  const unreadCount = notifications.filter(n => !n.isRead).length;
  updateBadge(unreadCount);
  renderNotifications();
}

async function fetchInitial() {
  try {
    const res = await notificationService.getNotifications();
    if (res.status === 'success') {
      notifications = res.data;
      refreshUI();
    }
  } catch (err) {
    console.error('Failed to fetch notifications', err);
  }
}

function bindEvents() {
  elements.bellBtn.onclick = (e) => {
    e.stopPropagation();
    elements.dropdown.classList.toggle('hidden');
  };

  document.addEventListener('click', (e) => {
    if (!elements.dropdown || !elements.bellBtn) return;
    if (!elements.dropdown.contains(e.target) && e.target !== elements.bellBtn) {
      elements.dropdown.classList.add('hidden');
    }
  });

  elements.markAllReadBtn.onclick = async (e) => {
    e.stopPropagation();
    await notificationService.markAllAsRead();
    notifications.forEach(n => n.isRead = true);
    refreshUI();
  };

  window.addEventListener('app:notification', (e) => {
    if (!activeUserId) return;
    notifications.unshift(e.detail);
    if (notifications.length > 50) notifications.pop();
    refreshUI();
  });
}

export const resetNotificationHub = () => {
  activeUserId = null;
  notifications = [];
  if (resolveElements()) {
    elements.dropdown.classList.add('hidden');
    refreshUI();
  }
};

export const initNotificationHub = ({ user } = {}) => {
  if (!resolveElements()) return;

  const nextUserId = user?.id ?? null;
  if (!initialized) {
    bindEvents();
    initialized = true;
  }

  if (activeUserId !== nextUserId) {
    activeUserId = nextUserId;
    notifications = [];
    elements.dropdown.classList.add('hidden');
    refreshUI();
  }

  fetchInitial();
};
