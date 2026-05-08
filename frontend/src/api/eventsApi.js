// src/api/eventsApi.js
// All event-related endpoints
import API from './apiClient';

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

  getAttendedStudents: (eventId) => API.get(`/events/${eventId}/attended-students`),

  // GET /api/events/:eventId/certificate - Student gets certificate data for attended event
  getCertificateData: (eventId) => API.get(`/events/${eventId}/certificate`),

  // GET /api/events/:eventId - Student gets full event details
  getEventById: (eventId) => API.get(`/events/${eventId}`),

  // PATCH /api/events/:eventId - Leader updates an event
  updateEvent: (eventId, data) => API.patch(`/events/${eventId}`, data),

  // Feedback
  submitFeedback: (eventId, data) => API.post(`/events/${eventId}/feedback`, data),
  getFeedbackSummary: (eventId) => API.get(`/events/${eventId}/feedback/summary`),
  getMyFeedback: (eventId) => API.get(`/events/${eventId}/feedback/mine`),
  getEventFeedback: (eventId) => API.get(`/events/${eventId}/feedback`),
};

export default eventsApi;