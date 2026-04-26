import { API_BASE_URL } from '../config/api.js';
import { handleUnauthorized } from './authSession.js';

async function requestNotification(path, options = {}) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/notifications${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (handleUnauthorized(response)) {
    throw new Error('Session expired. Please log in again.');
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || payload.message || 'Failed to update notifications.');
  }

  return payload;
}

export const notificationService = {
  async getNotifications() {
    return requestNotification('');
  },

  async markAsRead(id) {
    return requestNotification(`/${id}/read`, {
      method: 'PATCH',
    });
  },

  async markAllAsRead() {
    return requestNotification('/read-all', {
      method: 'PATCH',
    });
  }
};
