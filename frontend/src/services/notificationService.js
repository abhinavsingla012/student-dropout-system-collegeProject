const API_BASE_URL = 'http://localhost:3000/api/v1';

export const notificationService = {
  async getNotifications() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  async markAsRead(id) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  async markAllAsRead() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  }
};
