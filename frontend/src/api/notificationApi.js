// src/api/notificationApi.js
import API from './apiClient';

const notificationApi = {
  getAll: () => API.get('/notifications'),
  markRead: (id) => API.patch(`/notifications/${id}/read`),
  markAllRead: () => API.patch('/notifications/mark-all-read'),
};

export default notificationApi;
