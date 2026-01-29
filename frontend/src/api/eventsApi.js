// src/api/eventsApi.js
// All event-related endpoints
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const eventsApi = {
  // POST /api/events - Leader creates event (pending approval)
  createEvent: (data) => API.post('/events', data),

  // GET /api/events/my-events - Leader views their own events
  getMyEvents: () => API.get('/events/my-events'),

  // GET /api/events/pending - Admin views pending events
  getAllEventsForReview: () => API.get('/events/allevents'),

  // PATCH /api/events/:eventId/review - Admin approves/rejects event
  reviewEvent: (eventId, action) => API.patch(`/events/${eventId}/review`, { action }),

  // GET /api/events/upcoming - Student views upcoming events
  getUpcomingEvents: () => API.get('/events/upcoming'),

  // POST /api/events/:eventId/register - Student registers for event
  registerForEvent: (eventId) => API.post(`/events/${eventId}/register`),

  // GET /api/events/registered - Student views their registered upcoming events
  getRegisteredEvents: () => API.get('/events/registered'),

  // GET /api/events/attended - Student views attended past events
  getAttendedEvents: () => API.get('/events/attended'),

  // POST /api/events/:eventId/attendance - Leader marks attendance via QR
  markAttendance: (eventId, qrData) =>
  API.post(`/events/${eventId}/attendance`, { qrData }),

  getAttendedStudents: (eventId) => API.get(`/events/${eventId}/attended-students`)
  
};

export default eventsApi;