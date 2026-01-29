// src/api/adminApi.js
// Admin-only endpoints (stats, reports, users)
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Add JWT token automatically to all admin requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const adminApi = {
  // GET /api/admin/stats - Basic dashboard stats
  getDashboardStats: () => API.get('/admin/stats'),

  // GET /api/admin/reports - Detailed reports
  getReports: () => API.get('/admin/reports'),

  // GET /api/admin/users - List all users
  getAllUsers: () => API.get('/admin/users'),

  // PATCH /api/admin/users/:userId/toggle-active - Ban/unban user
  toggleUserActive: (userId) => API.patch(`/admin/users/${userId}/toggle-active`),

  getUserDetails: (userId) => API.get(`/admin/users/${userId}/details`),
  
deleteUser: (userId) => API.delete(`/admin/users/${userId}`)
};

export default adminApi;