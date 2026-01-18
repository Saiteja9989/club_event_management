const Club = require('../models/club.model');
const Event = require('../models/event.model');
const EventRegistration = require('../models/eventRegistration.model');
const User = require('../models/user.model');
const QRCode = require('qrcode');
const crypto = require('crypto');


// Club leader creates event (pending approval)
exports.createEvent = async (req, res) => {
  try {
    const leaderId = req.user.id;
    const clubId = req.user.clubId; // from token, set during promotion

    if (!clubId) {
      return res.status(403).json({ message: 'You are not assigned to any club' });
    }

    const club = await Club.findById(clubId);
    if (!club || club.leader.toString() !== leaderId) {
      return res.status(403).json({ message: 'Not authorized for this club' });
    }

    const {
      title,
      description,
      date,
      time,
      venue,
      visibility = 'club-only',
      maxParticipants,
      poster,
    } = req.body;

    if (!title || !description || !date || !time) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const event = new Event({
      title,
      description,
      date,
      time,
      venue,
      club: clubId,
      createdBy: leaderId,
      visibility,
      maxParticipants,
      poster,
    });

    await event.save();

    res.status(201).json({
      message: 'Event created - pending admin approval',
      event,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin gets all pending events (across all clubs)
exports.getPendingEvents = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const events = await Event.find({ status: 'pending' })
      .populate('club', 'name')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ pendingEvents: events });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin approves or rejects event
exports.reviewEvent = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const eventId = req.params.eventId;
    const { action } = req.body; // 'approve' or 'reject'

    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.status !== 'pending') {
      return res.status(400).json({ message: 'Event already processed' });
    }

    event.status = action;
    await event.save();

    res.json({
      message: `Event ${action}`,
      event,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
exports.getUpcomingEvents = async (req, res) => {
  try {
    const studentId = req.user.id;
    const now = new Date();

    const student = await User.findById(studentId);

    const query = { status: 'approved', date: { $gt: now } };

    if (student.joinedClubs?.length > 0) {
      query.$or = [
        { visibility: 'open-to-all' },
        { visibility: 'club-only', club: { $in: student.joinedClubs } }
      ];
    } else {
      query.visibility = 'open-to-all';
    }

    const events = await Event.find(query)
      .populate('club', 'name')
      .sort({ date: 1 });

    const registeredIds = await EventRegistration.find({ student: studentId }).distinct('event');
    const available = events.filter(e => !registeredIds.includes(e._id.toString()));

    res.json({ upcoming: available });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Student: My Registered Upcoming Events
exports.getRegisteredEvents = async (req, res) => {
  try {
    const studentId = req.user.id;
    const now = new Date();

    const registrations = await EventRegistration.find({
      student: studentId,
      attended: false
    }).populate({
      path: 'event',
      match: { date: { $gt: now } },
      populate: { path: 'club', select: 'name' }
    });

    const events = registrations
      .filter(r => r.event)
      .map(r => ({
        ...r.event.toObject(),
        registrationId: r._id,
        qrToken: r.qrToken
      }));

    res.json({ registered: events });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Student: My Attended Events
exports.getAttendedEvents = async (req, res) => {
  try {
    const studentId = req.user.id;
    const now = new Date();

    const registrations = await EventRegistration.find({
      student: studentId,
      attended: true
    }).populate({
      path: 'event',
      match: { date: { $lte: now } },
      populate: { path: 'club', select: 'name' }
    });

    const events = registrations.map(r => r.event);

    res.json({ attended: events });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Student: Register + Generate QR


exports.registerForEvent = async (req, res) => {
  try {
    const studentId = req.user.id;
    const eventId = req.params.eventId;

    const event = await Event.findById(eventId);
    if (!event || event.status !== 'approved') {
      return res.status(404).json({ message: 'Event not available' });
    }

    // Prevent duplicate registration
    const alreadyRegistered = await EventRegistration.findOne({
      student: studentId,
      event: eventId,
    });

    if (alreadyRegistered) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    const registration = await EventRegistration.create({
      student: studentId,
      event: eventId,
    });

    // Generate unique QR token
    const qrToken = crypto.randomBytes(16).toString('hex');

    // Save QR token to registration (for later verification)
    registration.qrToken = qrToken;
    await registration.save();

    // Create QR data string
    const qrData = `event:${eventId}|student:${studentId}|token:${qrToken}`;

    // Generate QR as base64 image
    const qrBase64 = await QRCode.toDataURL(qrData, { width: 300 });

    res.status(201).json({
      message: 'Registered successfully',
      registrationId: registration._id,
      qrData: qrData,           // raw string (for debugging)
      qrCode: qrBase64          // base64 image → show in frontend <img src={qrCode} />
    });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Already registered' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Leader scans QR and marks attendance
exports.markAttendance = async (req, res) => {
  try {
    const leaderId = req.user.id;
    const { qrData } = req.body;  // frontend sends scanned QR string

    // Parse QR data (format: event:xxx|student:yyy|token:zzz)
    const parts = qrData.split('|');
    const eventIdPart = parts.find(p => p.startsWith('event:'));
    const studentIdPart = parts.find(p => p.startsWith('student:'));
    const tokenPart = parts.find(p => p.startsWith('token:'));

    if (!eventIdPart || !studentIdPart || !tokenPart) {
      return res.status(400).json({ message: 'Invalid QR code format' });
    }

    const eventId = eventIdPart.split(':')[1];
    const studentId = studentIdPart.split(':')[1];
    const qrToken = tokenPart.split(':')[1];

    // Find matching registration
    const registration = await EventRegistration.findOne({
      event: eventId,
      student: studentId,
      qrToken: qrToken
    }).populate('event');

    if (!registration) {
      return res.status(400).json({ message: 'Invalid or expired QR code' });
    }

    const event = registration.event;

    // Only the leader of this event's club can mark
    if (event.club.leader.toString() !== leaderId) {
      return res.status(403).json({ message: 'Not authorized - not your club\'s event' });
    }

    // Already marked?
    if (registration.attended) {
      return res.status(400).json({ message: 'Attendance already marked' });
    }

    // Mark attended
    registration.attended = true;
    registration.attendedAt = new Date();
    await registration.save();

    res.json({
      message: 'Attendance marked successfully',
      studentId: studentId,
      eventTitle: event.title
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};