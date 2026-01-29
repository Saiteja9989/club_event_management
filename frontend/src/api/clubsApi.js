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
};

export default clubsApi;