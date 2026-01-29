const Event = require("../models/event.model");
const EventRegistration = require("../models/eventRegistration.model");
const Club = require("../models/club.model");
const User = require("../models/user.model");


/**
 * Get student dashboard stats
 * Student only
 * Returns: myClubs count, registeredEvents count, upcomingEvents count,
 * upcomingEventList with totalRegistrations for seats left display
 **/

exports.getStudentDashboardStats = async (req, res) => {
  try {
    const studentId = req.user._id;
    const now = new Date();

    // 1. My Clubs count
    const user = await User.findById(studentId).select("joinedClubs");
    const myClubs = user?.joinedClubs?.length || 0;

    // 2. Total registered events (all time)
    const registeredEvents = await EventRegistration.countDocuments({
      student: studentId,
    });

    // 3. Upcoming events count (registered + future date)
    const upcomingStats = await EventRegistration.aggregate([
      { $match: { student: studentId } },
      {
        $lookup: {
          from: "events",
          localField: "event",
          foreignField: "_id",
          as: "eventDoc",
        },
      },
      { $unwind: "$eventDoc" },
      { $match: { "eventDoc.date": { $gte: now } } },
      { $count: "upcomingCount" },
    ]);

    const upcomingEvents = upcomingStats[0]?.upcomingCount || 0;

    // 4. Upcoming event list (with total registrations for seats left)
    const upcomingEventList = await EventRegistration.aggregate([
      { $match: { student: studentId } },
      {
        $lookup: {
          from: "events",
          localField: "event",
          foreignField: "_id",
          as: "eventDoc",
        },
      },
      { $unwind: "$eventDoc" },
      { $match: { "eventDoc.date": { $gte: now } } },
      {
        $lookup: {
          from: "eventregistrations", // count total registrations per event
          localField: "eventDoc._id",
          foreignField: "event",
          as: "registrations",
        },
      },
      {
        $addFields: {
          totalRegistrations: { $size: "$registrations" },
        },
      },
      {
        $project: {
          _id: "$eventDoc._id",
          title: "$eventDoc.title",
          date: "$eventDoc.date",
          time: "$eventDoc.time",
          venue: "$eventDoc.venue",
          club: "$eventDoc.club",
          poster: "$eventDoc.poster",
          maxParticipants: "$eventDoc.maxParticipants",
          totalRegistrations: 1, // now included!
        },
      },
      { $sort: { "date": 1 } },
      { $limit: 5 },
    ]);

    // 5. Attendance rate
    const attendedCount = await EventRegistration.countDocuments({
      student: studentId,
      attended: true,
    });
    const attendanceRate =
      registeredEvents > 0 ? Math.round((attendedCount / registeredEvents) * 100) : 0;

    // 6. Recent activity (last 7 days, limit 10)
    const recentActivity = await EventRegistration.find({
      student: studentId,
      $or: [
        { registeredAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        { attendedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      ],
    })
      .populate({
        path: "event",
        select: "title date",
      })
      .sort({ registeredAt: -1, attendedAt: -1 })
      .limit(10)
      .lean()
      .then((regs) =>
        regs.map((reg) => {
          const eventTitle = reg.event?.title || "Unknown Event";
          const timestamp = reg.attendedAt || reg.registeredAt || new Date();
          return {
            timestamp: timestamp.toISOString(),
            type: reg.attended ? "Attended" : "Registered",
            description: reg.attended
              ? `You attended "${eventTitle}"`
              : `You registered for "${eventTitle}"`,
          };
        })
      );

    res.json({
      success: true,
      data: {
        myClubs,
        registeredEvents,
        upcomingEvents,
        attendanceRate,
        upcomingEventList,
        recentActivity,
      },
    });
  } catch (err) {
    console.error("Student dashboard error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};