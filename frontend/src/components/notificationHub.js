import { notificationService } from '../services/notificationService.js';

export const initNotificationHub = () => {
  const bellBtn = document.getElementById('notificationBellBtn');
  const dropdown = document.getElementById('notificationDropdown');
  const badge = document.getElementById('notification-badge');
  const feed = document.getElementById('notificationFeed');
  const markAllReadBtn = document.getElementById('markAllReadBtn');

  let notifications = [];

  const updateBadge = (count) => {
    if (count > 0) {
      badge.textContent = count > 9 ? '9+' : count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  };

  const renderNotifications = () => {
    if (notifications.length === 0) {
      feed.innerHTML = '<div class="p-8 text-center text-muted text-xs">No notifications yet</div>';
      return;
    }

    feed.innerHTML = notifications.map(note => `
      <div class="notification-item ${note.type} ${note.isRead ? '' : 'unread'}" data-id="${note._id}">
        <span class="notification-title">${note.title}</span>
        <p class="notification-msg">${note.message}</p>
        <span class="notification-time">${new Date(note.createdAt).toLocaleString()}</span>
      </div>
    `).join('');

    // Add click listeners to items
    feed.querySelectorAll('.notification-item').forEach(item => {
      item.onclick = async () => {
        const id = item.dataset.id;
        const note = notifications.find(n => n._id === id);
        if (note && !note.isRead) {
          await notificationService.markAsRead(id);
          note.isRead = true;
          refreshUI();
        }
        // If there's a student link, we could redirect here
        if (note.data?.studentId) {
          window.location.hash = `#/student/${note.data.studentId}`;
          dropdown.classList.add('hidden');
        }
      };
    });
  };

  const refreshUI = () => {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    updateBadge(unreadCount);
    renderNotifications();
  };

  const fetchInitial = async () => {
    try {
      const res = await notificationService.getNotifications();
      if (res.status === 'success') {
        notifications = res.data;
        refreshUI();
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  // Toggle dropdown
  bellBtn.onclick = (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('hidden');
  };

  // Close on click outside
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && e.target !== bellBtn) {
      dropdown.classList.add('hidden');
    }
  });

  // Mark all as read
  markAllReadBtn.onclick = async (e) => {
    e.stopPropagation();
    await notificationService.markAllAsRead();
    notifications.forEach(n => n.isRead = true);
    refreshUI();
  };

  // Listen for real-time events
  window.addEventListener('app:notification', (e) => {
    notifications.unshift(e.detail);
    if (notifications.length > 50) notifications.pop();
    refreshUI();
  });

  fetchInitial();
};
