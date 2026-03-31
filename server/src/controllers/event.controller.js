const Event = require("../models/event.model");
const EventRegistration = require("../models/eventRegistration.model");
const Club = require("../models/club.model");
const User = require("../models/user.model");
const QRCode = require("qrcode");
const crypto = require("crypto");
const axios = require("axios");
const { s3, bucketName } = require("../config/s3");
const { emitNotification } = require("../utils/socket");
const { eventRegistrationEmail, eventReminderEmail, attendanceConfirmationEmail } = require("../utils/emailTemplates");

/**
 * Leader creates a new event
 * Leader only
 * Event starts as pending approval
 */
exports.createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      time,
      venue,
      visibility,
      isPaid,
      price,
      maxParticipants,
      registrationDeadline,
    } = req.body;

    const leaderId = req.user._id;
    const clubId = req.user.clubId;

    if (!clubId) {
      return res.status(400).json({
        success: false,
        message: "Leader is not associated with any club",
      });
    }

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(400).json({ message: "Club not found" });
    }

    let posterUrl = null;

    if (req.file) {
      const uploadResult = await s3
        .upload({
          Bucket: bucketName,
          Key: `events/posters/${Date.now()}-${req.file.originalname}`,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
          ACL: "public-read",
        })
        .promise();

      posterUrl = uploadResult.Location;
    }

    const event = await Event.create({
      title,
      description,
      date: new Date(date),
      time,
      venue,
      visibility,
      isPaid: isPaid === "true" || isPaid === true,
      price: isPaid ? Number(price) : 0,
      maxParticipants: Number(maxParticipants) || 100,
      registrationDeadline: registrationDeadline
        ? new Date(registrationDeadline)
        : null,
      poster: posterUrl,
      createdBy: leaderId,
      club: clubId,
      clubName: club.name,
      status: "pending",
    });

    // Notify all admins that a new event needs review
    User.find({ role: 'admin' }).select('_id').lean().then((admins) => {
      admins.forEach((admin) => {
        emitNotification(admin._id, {
          type: 'event_pending_review',
          title: 'New Event Pending Review',
          message: `"${event.title}" by ${club.name} is waiting for your approval.`,
          link: '/admin/events',
        });
      });
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: "Event created successfully. Waiting for admin approval.",
      data: event,
    });
  } catch (err) {
    console.error("Create event error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to create event",
    });
  }
};

/**
 * Leader updates an existing event they created
 * Leader only
 */
exports.updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const leaderId = req.user._id;

    const event = await Event.findOne({ _id: eventId, createdBy: leaderId });
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found or not yours" });
    }

    const { title, description, date, time, venue, visibility, isPaid, price, maxParticipants, registrationDeadline } = req.body;

    if (title) event.title = title.trim();
    if (description !== undefined) event.description = description;
    if (date) event.date = new Date(date);
    if (time) event.time = time;
    if (venue) event.venue = venue.trim();
    if (visibility) event.visibility = visibility;
    if (isPaid !== undefined) event.isPaid = isPaid === "true" || isPaid === true;
    if (price !== undefined) event.price = event.isPaid ? Number(price) : 0;
    if (maxParticipants) event.maxParticipants = Number(maxParticipants);
    if (registrationDeadline) event.registrationDeadline = new Date(registrationDeadline);

    // Handle optional new poster upload
    if (req.file) {
      const uploadResult = await s3
        .upload({
          Bucket: bucketName,
          Key: `events/posters/${Date.now()}-${req.file.originalname}`,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
          ACL: "public-read",
        })
        .promise();
      event.poster = uploadResult.Location;
    }

    await event.save();

    res.json({ success: true, message: "Event updated successfully.", data: event });
  } catch (err) {
    console.error("Update event error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to update event" });
  }
};

/**
 * Leader views their own created events
 * Leader only
 * Returns events created by this leader in their club
 */

exports.getMyEvents = async (req, res) => {
  try {
    const leaderId = req.user._id;

    // Fetch all events created by this leader
    const allEvents = await Event.find({ createdBy: leaderId })
      .populate("club", "name")
      .sort({ createdAt: -1 })
      .lean();

    const now = new Date();

    // Get ALL event IDs
    const eventIds = allEvents.map((e) => e._id);

    // Count real registrations for ALL events from EventRegistration collection
    let registrationCounts = [];
    if (eventIds.length > 0) {
      registrationCounts = await EventRegistration.aggregate([
        { $match: { event: { $in: eventIds } } },
        { $group: { _id: "$event", totalRegistrations: { $sum: 1 } } },
      ]);
    }

    // Create a map for fast lookup
    const regCountMap = new Map();
    registrationCounts.forEach((item) => {
      regCountMap.set(item._id.toString(), item.totalRegistrations);
    });

    // Add counts to EVERY event
    const addCounts = (event) => {
      const eventIdStr = event._id.toString();
      return {
        ...event,
        totalRegistrations: regCountMap.get(eventIdStr) || 0,
        attendedCount: event.attended?.length || 0,
      };
    };

    // Apply counts to each category
    const approvedUpcomingEvents = allEvents
      .filter((e) => e.status === "approved" && new Date(e.date) >= now)
      .map(addCounts);

    const pendingForAdminApprovalEvents = allEvents
      .filter((e) => e.status === "pending")
      .map(addCounts);

    const completedEvents = allEvents
      .filter((e) => e.status === "approved" && new Date(e.date) < now)
      .map(addCounts);

    const rejectedEvents = allEvents
      .filter((e) => e.status === "rejected")
      .map(addCounts);

    res.json({
      success: true,
      data: {
        approvedUpcomingEvents,
        pendingForAdminApprovalEvents,
        completedEvents,
        rejectedEvents,
        totalEvents: allEvents.length,
      },
    });
  } catch (err) {
    console.error("getMyEvents error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Admin views all pending events
 * Admin only
 * Returns events awaiting approval
 */
exports.getAllEventsForReview = async (req, res) => {
  try {
    // Fetch ALL events in the system (for admin review)
    const allEvents = await Event.find()
      .populate("club", "name") // club name only
      .populate("createdBy", "name email") // creator info
      .sort({ createdAt: -1 }) // newest first
      .lean(); // faster plain objects

    // Optional: categorize them (similar to getMyEvents)
    const pendingEvents = allEvents.filter(
      (event) => event.status === "pending",
    );
    const approvedEvents = allEvents.filter(
      (event) => event.status === "approved",
    );
    const rejectedEvents = allEvents.filter(
      (event) => event.status === "rejected",
    );

    res.json({
      success: true,
      data: {
        pendingEvents,
        approvedEvents,
        rejectedEvents,
        totalEvents: allEvents.length,
      },
    });
  } catch (err) {
    console.error("getAllEventsForReview error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching events for review",
    });
  }
};
/**
 * Admin approves or rejects an event
 * Admin only
 * Changes event status to approved/rejected
 */
exports.reviewEvent = async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Admin only" });

    const { eventId } = req.params;
    const { action } = req.body;

    if (!["approved", "rejected"].includes(action))
      return res.status(400).json({ message: "Invalid action" });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.status !== "pending")
      return res.status(400).json({ message: "Event already processed" });

    event.status = action;
    await event.save();

    // Notify the leader who created this event
    if (event.createdBy) {
      emitNotification(event.createdBy, {
        type: action === 'approved' ? 'event_approved' : 'event_rejected',
        title: action === 'approved' ? 'Event Approved!' : 'Event Rejected',
        message: `Your event "${event.title}" has been ${action} by admin.`,
        link: '/leader/events',
      });
    }

    // If approved, notify all club members that a new event is available
    if (action === 'approved' && event.club) {
      const clubDoc = await Club.findById(event.club).select('members name').lean();
      if (clubDoc?.members?.length) {
        const createdByStr = event.createdBy?.toString();
        clubDoc.members.forEach((memberId) => {
          // Skip the leader (they already got the approval notification)
          if (memberId.toString() === createdByStr) return;
          emitNotification(memberId, {
            type: 'new_event_available',
            title: 'New Event Available!',
            message: `"${event.title}" has been approved and is now open for registration.`,
            link: '/student/events',
          });
        });
      }
    }

    res.json({ message: `Event ${action}`, event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Student views a single event's full details
 * Student only
 * Includes registration status for the current student
 */
exports.getEventById = async (req, res) => {
  try {
    const { eventId } = req.params;
    const studentId = req.user.id;

    const event = await Event.findById(eventId)
      .populate({ path: "club", select: "name description leader", populate: { path: "leader", select: "name email" } });

    if (!event || event.status !== "approved") {
      return res.status(404).json({ message: "Event not found" });
    }

    const registration = await EventRegistration.findOne({ event: eventId, student: studentId });

    res.json({
      success: true,
      event: {
        ...event.toObject(),
        seatsLeft: event.maxParticipants ? event.maxParticipants - (event.totalRegistrations || 0) : null,
        isRegistered: !!registration,
        attended: registration?.attended || false,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Student views upcoming events they can join
 * Student only
 * Filters by visibility and excludes already registered
 */
exports.getUpcomingEvents = async (req, res) => {
  try {
    const studentId = req.user.id;
    const now = new Date();

    const student = await User.findById(studentId);

    const query = { status: "approved", date: { $gt: now } };

    if (student.joinedClubs?.length > 0) {
      query.$or = [
        { visibility: "open-to-all" },
        { visibility: "club-only", club: { $in: student.joinedClubs } },
      ];
    } else {
      query.visibility = "open-to-all";
    }

    const events = await Event.find(query)
      .populate("club", "name")
      .sort({ date: 1 });

    const registeredIds = await EventRegistration.find({
      student: studentId,
    }).distinct("event");
    const registeredIdStrings = registeredIds.map((id) => id.toString());

    const available = events.filter(
      (e) => !registeredIdStrings.includes(e._id.toString()),
    );

    res.json({ upcoming: available });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Student views their registered upcoming events with QR
 * Student only
 * Regenerates QR code on-the-fly
 */
exports.getRegisteredEvents = async (req, res) => {
  try {
    const studentId = req.user._id;

    const registrations = await EventRegistration.find({
      student: studentId,
    })
      .populate({
        path: "event",
        select:
          "title description date time venue clubName poster maxParticipants status visibility isPaid price",
      })
      .sort({ registeredAt: -1 })
      .lean();

    const events = registrations.map((reg) => ({
      ...reg.event,
      registrationId: reg._id,
      qrCode: reg.qrCode || null, // QR from EventRegistration
      registeredAt: reg.registeredAt,
      clubName: reg.event?.clubName || "Club Not Available",
    }));

    res.json({
      success: true,
      count: events.length,
      registered: events,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
/**
 * Student views their attended past events
 * Student only
 * Returns past attended events
 */
exports.getAttendedEvents = async (req, res) => {
  try {
    const studentId = req.user._id;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No user ID found",
      });
    }
    const registrations = await EventRegistration.find({
      student: studentId,
      attended: true,
    })
      .populate({
        path: "event",
        select:
          "title description date time venue clubName poster maxParticipants status visibility isPaid price", // include clubName
      })
      .sort({ attendedAt: -1 })
      .lean(); // faster & easier to work with

    const events = registrations
      .filter((r) => r.event)
      .map((r) => {
        const event = r.event;
        return {
          _id: event._id,
          title: event.title || "Untitled Event",
          description: event.description,
          date: event.date,
          time: event.time,
          venue: event.venue,
          clubName: event.clubName || "Club Not Available", // safe fallback using stored string
          poster: event.poster,
          maxParticipants: event.maxParticipants,
          status: event.status,
          isPaid: event.isPaid,
          price: event.price,
          attendedAt: r.attendedAt,
        };
      });

    res.json({
      success: true,
      count: events.length,
      attended: events,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

/**
 * Student registers for an event
 * Student only
 * Creates registration + generates QR code
 */

exports.registerForEvent = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { eventId } = req.params;

    // 1. Check event
    const event = await Event.findById(eventId);
    if (!event || event.status !== "approved") {
      return res.status(404).json({ message: "Event not available" });
    }

    // 2. Block paid events
    if (event.isPaid === true && event.price > 0) {
      return res.status(400).json({
        message: "This is a paid event. Please complete payment to register.",
      });
    }

    // 3. Prevent duplicate registration
    const alreadyRegistered = await EventRegistration.findOne({
      student: studentId,
      event: eventId,
    });

    if (alreadyRegistered) {
      return res.status(400).json({ message: "Already registered" });
    }

    // 4. Generate QR token
    const qrToken = crypto.randomBytes(16).toString("hex");

    // 5. Create QR payload
    const qrPayload = `event:${eventId}|student:${studentId}|token:${qrToken}`;

    // 6. Generate QR buffer
    let qrBuffer;
    try {
      qrBuffer = await QRCode.toBuffer(qrPayload, {
        width: 300,
        margin: 2,
      });
    } catch (qrErr) {
      return res.status(500).json({
        message: "Failed to generate QR code",
      });
    }

    // 7. Upload QR to S3
    let qrCodeUrl;
    try {
      const key = `events/qr-codes/${eventId}_${studentId}_${Date.now()}.png`;

      const uploadResult = await s3
        .upload({
          Bucket: bucketName,
          Key: key,
          Body: qrBuffer,
          ContentType: "image/png",
          ACL: "public-read",
        })
        .promise();

      qrCodeUrl = uploadResult.Location;
    } catch (s3Err) {
      return res.status(500).json({
        message: "Failed to upload QR to storage",
      });
    }

    // 8. Save registration
    const registration = await EventRegistration.create({
      student: studentId,
      event: eventId,
      qrToken,
      qrCode: qrCodeUrl,
      qrGeneratedAt: new Date(),
    });

    // Notify student: registration confirmed
    emitNotification(studentId, {
      type: 'event_registered',
      title: 'Registration Confirmed!',
      message: `You are registered for "${event.title}". Your QR ticket is ready.`,
      link: '/student/my-events',
    });

    // Notify leader of new registration
    const eventWithClub = await Event.findById(eventId)
      .populate({ path: 'club', select: 'leader name' });
    if (eventWithClub?.club?.leader) {
      emitNotification(eventWithClub.club.leader, {
        type: 'new_registration',
        title: 'New Registration',
        message: `${req.user.name || 'A student'} registered for "${event.title}".`,
        link: '/leader/events',
      });
    }

    // 9. Premium registration confirmation email via n8n
    const clubDoc = event.club ? await Club.findById(event.club).select('name').lean() : null;
    axios
      .post(process.env.N8N_EVENT_REGISTER_WEBHOOK, {
        type: "event_registered",
        studentId,
        studentName: req.user.name,
        studentEmail: req.user.email,
        eventId: event._id,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        venue: event.venue,
        qrCodeUrl,
        subject: `🎟️ You're Registered for ${event.title}!`,
        htmlBody: eventRegistrationEmail({
          studentName: req.user.name,
          eventTitle: event.title,
          eventDate: event.date,
          eventTime: event.time,
          venue: event.venue,
          clubName: clubDoc?.name || event.clubName,
          qrCodeUrl,
          isPaid: false,
        }),
      })
      .catch((err) => {
        console.error("n8n webhook failed:", err.message);
      });
    // 9. Response
    res.status(201).json({
      success: true,
      message: "Registered successfully (free event)",
      registrationId: registration._id,
      qrCode: qrCodeUrl,
    });
  } catch (err) {
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

/**
 * Leader marks attendance via QR scan
 * Leader only
 * Validates QR and marks user as attended
 */

exports.markAttendance = async (req, res) => {
  try {
    const leaderId = req.user._id; // or req.user.id — use whatever your auth middleware sets
    const { qrData } = req.body;

    if (!qrData || typeof qrData !== "string") {
      return res.status(400).json({
        success: false,
        message: "QR data is required and must be a string",
      });
    }

    // Parse QR format: event:xxx|student:yyy|token:zzz
    const parts = qrData.split("|");
    const eventIdPart = parts.find((p) => p.startsWith("event:"));
    const studentIdPart = parts.find((p) => p.startsWith("student:"));
    const tokenPart = parts.find((p) => p.startsWith("token:"));

    if (!eventIdPart || !studentIdPart || !tokenPart) {
      return res.status(400).json({
        success: false,
        message: "Invalid QR format. Expected: event:ID|student:ID|token:VALUE",
      });
    }

    const eventId = eventIdPart.split(":")[1];
    const studentId = studentIdPart.split(":")[1];
    const qrToken = tokenPart.split(":")[1];

    if (!eventId || !studentId || !qrToken) {
      return res.status(400).json({
        success: false,
        message: "Could not parse required IDs or token from QR data",
      });
    }

    // Find the registration (lean for speed)
    const registration = await EventRegistration.findOne({
      event: eventId,
      student: studentId,
      qrToken, // verify token matches
    })
      .populate({
        path: "event",
        select: "title club",
        populate: {
          path: "club",
          select: "leader name",
        },
      })
      .lean();

    if (!registration) {
      return res.status(400).json({
        success: false,
        message: "Invalid, expired, or already used QR code",
      });
    }

    const event = registration.event;

    // Authorization: leader must own the club
    if (!event || event.club?.leader?.toString() !== leaderId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to mark attendance for this event",
      });
    }

    // Already marked?
    if (registration.attended) {
      return res.status(400).json({
        success: false,
        message: "Attendance already marked for this student",
      });
    }

    // Mark attendance on registration
    await EventRegistration.updateOne(
      { _id: registration._id },
      {
        $set: {
          attended: true,
          attendedAt: new Date(),
        },
      },
    );

    // Add student to event.attended (use $addToSet to prevent duplicates)
    await Event.findByIdAndUpdate(eventId, {
      $addToSet: { attended: studentId },
    });

    // Recalculate attendedCount from unique attended array
    const updatedEvent = await Event.findById(eventId).select("attended");
    const uniqueAttended = [...new Set(updatedEvent.attended || [])];
    await Event.findByIdAndUpdate(eventId, {
      $set: { attendedCount: uniqueAttended.length },
    });

    // Notify the student their attendance was marked
    emitNotification(studentId, {
      type: 'attendance_marked',
      title: 'Attendance Recorded!',
      message: `Your attendance for "${event.title}" has been successfully marked.`,
      link: '/student/my-events',
    });

    res.status(200).json({
      success: true,
      message: "Attendance marked successfully",
      studentId,
      eventTitle: event.title,
      clubName: event.club?.name || "Unknown",
      attendedAt: new Date().toISOString(),
      attendedCount: uniqueAttended.length,
    });
  } catch (err) {
    console.error("Mark attendance error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while marking attendance",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Leader downloads attended students for their event (from EventRegistration)
exports.getAttendedStudents = async (req, res) => {
  try {
    const { eventId } = req.params;
    const leaderId = req.user._id;

    // Find the event to verify ownership
    const event = await Event.findById(eventId);
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    // Only the creator (leader) can access
    if (event.createdBy.toString() !== leaderId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view attendance for this event",
      });
    }

    // Fetch attended registrations + populate student details
    const attendedRegistrations = await EventRegistration.find({
      event: eventId,
      attended: true,
    })
      .populate("student", "name rollNumber email") // get student info
      .select("student attendedAt") // use attendedAt
      .lean();

    // Format response
    const students = attendedRegistrations.map((reg) => ({
      name: reg.student?.name || "Unknown",
      rollNumber: reg.student?.rollNumber || "-",
      email: reg.student?.email || "-",
      attendedAt: reg.attendedAt ? reg.attendedAt.toISOString() : null,
    }));

    res.json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (err) {
    console.error("getAttendedStudents error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching attended students",
    });
  }
};

/**
 * Student downloads certificate data for an attended event
 * Student only
 * Returns data needed to generate the participation certificate
 */
exports.getCertificateData = async (req, res) => {
  try {
    const { eventId } = req.params;
    const studentId = req.user._id;

    // Verify the student actually attended this event
    const registration = await EventRegistration.findOne({
      event: eventId,
      student: studentId,
      attended: true,
    });

    if (!registration) {
      return res.status(403).json({
        success: false,
        message: "Certificate not available. Attendance not marked for this event.",
      });
    }

    // Fetch event details with club and leader info
    const event = await Event.findById(eventId).populate({
      path: "club",
      select: "name leader",
      populate: { path: "leader", select: "name" },
    });

    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    // Fetch student details
    const student = await User.findById(studentId).select("name rollNumber email");

    res.json({
      success: true,
      data: {
        eventId: event._id,
        studentName: student.name,
        rollNumber: student.rollNumber || "N/A",
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        eventVenue: event.venue,
        clubName: event.clubName || event.club?.name || "ClubHub",
        leaderName: event.club?.leader?.name || "Club Leader",
        attendedAt: registration.attendedAt,
      },
    });
  } catch (err) {
    console.error("getCertificateData error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * n8n – Fetch approved upcoming events with ALL registered students for reminders.
 * Bug fix: previously returned only createdBy (leader), now returns every registered student.
 **/
exports.getEventsForReminders = async (req, res) => {
  try {
    const now = new Date();
    // Fetch events happening within the next 48 hours (n8n can filter further)
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const events = await Event.find({
      status: "approved",
      date: { $gte: now, $lte: in48h },
    })
      .select("title date time venue clubName club")
      .lean();

    if (!events.length) {
      return res.json({ success: true, count: 0, data: [] });
    }

    const eventIds = events.map((e) => e._id);

    // Fetch all registrations (not yet attended) for these events with student details
    const registrations = await EventRegistration.find({
      event: { $in: eventIds },
      attended: false,           // only send reminder to those who haven't attended yet
    })
      .populate("student", "name email")
      .select("event student qrCode")
      .lean();

    // Group registered students by event
    const regMap = {};
    registrations.forEach((r) => {
      const eid = r.event.toString();
      if (!regMap[eid]) regMap[eid] = [];
      if (r.student) {
        regMap[eid].push({
          name: r.student.name,
          email: r.student.email,
          qrCodeUrl: r.qrCode || null,
        });
      }
    });

    // Build response: each event with its list of registered students to email
    const data = events.map((event) => ({
      eventId: event._id,
      title: event.title,
      date: event.date,
      time: event.time,
      venue: event.venue,
      clubName: event.clubName || "",
      registeredStudents: regMap[event._id.toString()] || [],
    })).filter((e) => e.registeredStudents.length > 0);

    res.json({ success: true, count: data.length, data });
  } catch (err) {
    console.error("getEventsForReminders error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch events for reminders" });
  }
};
