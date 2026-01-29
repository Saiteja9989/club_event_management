/**
 * Events & Attendance Routes
 * Mixed access: leader, admin, student
 */
const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/auth.middleware');
const { leaderOnly, adminOnly, studentOnly } = require('../middlewares/role.middleware');
const eventController = require('../controllers/event.controller');
const multer = require('multer');

// Multer for poster upload (in-memory → S3)
const upload = multer({ storage: multer.memoryStorage() });

// Leader only - create new event (pending approval)
router.post('/', protect, leaderOnly, upload.single('poster'), eventController.createEvent);            // Creates event in leader's club

// Leader only - list their own created events
router.get('/my-events', protect, leaderOnly, eventController.getMyEvents);    // Returns events created by this leader

// Admin only - list all pending events
router.get('/allevents', protect, adminOnly, eventController.getAllEventsForReview);  // Returns events awaiting approval

// Admin only - approve or reject an event
router.patch('/:eventId/review', protect, adminOnly, eventController.reviewEvent); // Changes event status to approved/rejected

// Student only - list upcoming events they can register for
router.get('/upcoming', protect, studentOnly, eventController.getUpcomingEvents); // Returns visible upcoming events (excludes registered)

// Student only - register for an event
router.post('/:eventId/register', protect, studentOnly, eventController.registerForEvent); // Creates registration + QR code

// Student only - list their registered upcoming events
router.get('/registered', protect, studentOnly, eventController.getRegisteredEvents); // Returns upcoming registered events with QR

// Student only - list their attended past events
router.get('/attended', protect, studentOnly, eventController.getAttendedEvents); // Returns past attended events

// Leader only - mark attendance using scanned QR
router.post('/:eventId/attendance', protect, leaderOnly, eventController.markAttendance); // Validates QR and marks attendance

router.get('/:eventId/attended-students', protect, leaderOnly, eventController.getAttendedStudents);

router.get(
  "/reminders", eventController.getEventsForReminders
);


module.exports = router;