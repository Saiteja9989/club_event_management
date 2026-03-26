// src/api/clubsApi.js
// Club creation, listing, join requests, membership management
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const clubsApi = {
  // POST /api/clubs - Create new club (admin only)
  createClub: (data) => API.post('/clubs', data),

  // GET /api/clubs - List all clubs (admin only)
  getAllClubs: () => API.get('/clubs'),

  // GET /api/clubs/browse - Student-safe club list with flags
  getAllClubsForStudents: () => API.get('/clubs/browse'),

  // DELETE /api/clubs/:clubId - Delete club (admin only)
  deleteClub: (clubId) => API.delete(`/clubs/${clubId}`),

  // POST /api/clubs/:clubId/join - Student request to join club
  requestJoin: (clubId) => API.post(`/clubs/${clubId}/join`),

  // GET /api/clubs/pending-requests - Leader views pending requests
  getClubMembershipData: () => API.get('/clubs/requests'),

  // PATCH /api/clubs/requests/:requestId/review - Leader approve/reject request
  reviewRequest: (requestId, data) => API.patch(`/clubs/requests/${requestId}/review`, data),

  assignLeader: (clubId, data) => API.patch(`/clubs/${clubId}/assign-leader`, data),

  // NEW: Remove member from club
  removeMember: (clubId, userId) => API.delete(`/clubs/${clubId}/members/${userId}`),
  
  getMyClubDashboard: () => API.get('/clubs/myclubs'),
    
  // NEW: Change role of member in club
  changeMemberRole: (clubId, userId, newRole) =>
    API.patch(`/clubs/${clubId}/members/${userId}/role`, { newRole }),

  // Leader - update their club name/description
  updateMyClub: (data) => API.patch('/clubs/my-club', data),

  // Any authenticated user - update their own profile
  updateProfile: (data) => API.patch('/auth/update-profile', data),

  // Club Chat
  getMessages: (clubId, params) => API.get(`/clubs/${clubId}/messages`, { params }),
  sendMessage: (clubId, content, attachment) => API.post(`/clubs/${clubId}/messages`, { content, attachment }),
  pinMessage: (clubId, messageId) => API.patch(`/clubs/${clubId}/messages/${messageId}/pin`),
  toggleReaction: (clubId, messageId, emoji) => API.patch(`/clubs/${clubId}/messages/${messageId}/react`, { emoji }),
  uploadAttachment: (clubId, file) => {
    const form = new FormData();
    form.append('file', file);
    return API.post(`/clubs/${clubId}/messages/upload`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export default clubsApi;