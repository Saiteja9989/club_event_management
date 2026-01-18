const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/auth.middleware');
const { leaderOnly, adminOnly , studentOnly} = require('../middlewares/role.middleware');
const eventController = require('../controllers/event.controller');

router.post('/', protect, leaderOnly, eventController.createEvent);
router.get('/pending', protect, adminOnly, eventController.getPendingEvents);
router.patch('/:eventId/review', protect, adminOnly, eventController.reviewEvent);
router.get('/upcoming', protect, studentOnly, eventController.getUpcomingEvents);
router.get('/registered', protect, studentOnly, eventController.getRegisteredEvents);
router.get('/attended', protect, studentOnly, eventController.getAttendedEvents);
router.post('/:eventId/register', protect, studentOnly, eventController.registerForEvent);
router.post('/:eventId/attendance', protect, leaderOnly, eventController.markAttendance);

module.exports = router;