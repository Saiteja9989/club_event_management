// controllers/admin.controller.js
const User = require('../models/user.model');
const Club = require('../models/club.model');
const Event = require('../models/event.model');
const EventRegistration = require('../models/eventRegistration.model');
const MembershipRequest = require('../models/membershipRequest.model');
const moment = require('moment')


exports.getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: { $ne: 'admin' } });
    const activeClubs = await Club.countDocuments({ 'members.0': { $exists: true } });
    const totalEvents = await Event.countDocuments();
    const pendingEvents = await Event.countDocuments({ status: 'pending' });
    const pendingRequests = await MembershipRequest.countDocuments({ status: 'pending' });
    const inactiveClubs = await Club.countDocuments({
      'members.0': { $exists: true },
      createdAt: { $lt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) }, // 60 days
    });
    const totalRegistrations = await EventRegistration.countDocuments();

    // Real avgAttendance calculation
    const attendedRegistrations = await EventRegistration.countDocuments({ attended: true });
    const avgAttendance = totalRegistrations > 0 ? Math.round((attendedRegistrations / totalRegistrations) * 100) : 0;

    const stats = {
      totalStudents,
      activeClubs,
      totalEvents,
      pendingEvents,
      pendingRequests,
      inactiveClubs,
      totalRegistrations,
      avgAttendance,
    };

    // Recent Activity (fixed message: "Event Approved" without creator name)
    const recentActivity = await Event.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('club', 'name')
      .populate('createdBy', 'name')
      .lean()
      .then(events => events.map(e => ({
        timestamp: e.createdAt,
        type: e.status === 'pending' ? 'Event Created' : 'Event Processed',
        description: `${e.status === 'pending' ? `${e.createdBy?.name || 'Unknown'} created` : 'Admin approved'} "${e.title}"`,
        club: e.club?.name || '-',
        user: e.createdBy?.name || '-',
      })));

    res.json({ stats, recentActivity });
  } catch (err) {
    console.error('getDashboardStats ERROR:', err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * Admin Reports - Aggregated stats, charts data, recent activity, warnings
 * GET /api/admin/reports
 * Query params: timeRange, clubId (optional), startDate, endDate (for custom)
 */
exports.getReports = async (req, res) => {
  try {
    const { timeRange = 'thisMonth', clubId, startDate, endDate } = req.query;

    // ────────────────────────────────────────────────
    // 1. Determine date range
    // ────────────────────────────────────────────────
    let start, end;
    const now = moment();

    switch (timeRange) {
      case 'thisWeek':
        start = now.startOf('week').toDate();
        end = now.endOf('week').toDate();
        break;
      case 'thisMonth':
        start = now.startOf('month').toDate();
        end = now.endOf('month').toDate();
        break;
      case 'thisSemester':
        // Assuming semesters: Jan-Jun or Jul-Dec
        const month = now.month();
        start = month < 6
          ? moment().startOf('year').toDate()
          : moment().month(6).startOf('month').toDate();
        end = now.toDate();
        break;
      case 'thisYear':
        start = now.startOf('year').toDate();
        end = now.endOf('year').toDate();
        break;
      case 'custom':
        if (!startDate || !endDate) {
          return res.status(400).json({ message: 'startDate and endDate required for custom range' });
        }
        start = new Date(startDate);
        end = new Date(endDate);
        break;
      default: // allTime
        start = new Date(0); // 1970
        end = now.toDate();
    }

    // ────────────────────────────────────────────────
    // 2. Base query filters
    // ────────────────────────────────────────────────
    const dateFilter = { createdAt: { $gte: start, $lte: end } };
    const clubFilter = clubId && clubId !== 'all' ? { club: clubId } : {};

    // ────────────────────────────────────────────────
    // 3. Quick Stats
    // ────────────────────────────────────────────────
    const totalStudents = await User.countDocuments({ role: { $ne: 'admin' } });
    const activeClubs = await Club.countDocuments({ 'members.0': { $exists: true } });
    const totalEvents = await Event.countDocuments({ ...dateFilter, ...clubFilter });
    const approvedEvents = await Event.countDocuments({ ...dateFilter, ...clubFilter, status: 'approved' });
    const pendingEvents = await Event.countDocuments({ ...dateFilter, ...clubFilter, status: 'pending' });
    const totalRegistrations = await EventRegistration.countDocuments({
      ...dateFilter,
      ...clubFilter,
    });

    // Avg attendance (only for attended events in period)
    const attendedRegistrations = await EventRegistration.countDocuments({
      attended: true,
      attendedAt: { $gte: start, $lte: end },
      ...clubFilter,
    });
    const avgAttendance = totalRegistrations > 0 ? Math.round((attendedRegistrations / totalRegistrations) * 100) : 0;

    const stats = {
      totalStudents,
      activeClubs,
      totalEvents,
      approvedEvents,
      pendingEvents,
      totalRegistrations,
      avgAttendance,
    };

    // ────────────────────────────────────────────────
    // 4. Membership Pie Data (Club → Member Count)
    // ────────────────────────────────────────────────
    const membershipPie = await Club.aggregate([
      { $match: { 'members.0': { $exists: true } } },
      { $project: { name: 1, memberCount: { $size: '$members' } } },
      { $sort: { memberCount: -1 } },
      { $limit: 10 },
      { $project: { name: 1, value: '$memberCount' } },
    ]);

    // ────────────────────────────────────────────────
    // 5. Events by Club (Bar Chart - Top 10)
    // ────────────────────────────────────────────────
    const eventsByClub = await Event.aggregate([
      { $match: { ...dateFilter, ...clubFilter } },
      { $group: { _id: '$club', count: { $sum: 1 } } },
      { $lookup: { from: 'clubs', localField: '_id', foreignField: '_id', as: 'club' } },
      { $unwind: '$club' },
      { $project: { name: '$club.name', events: '$count' } },
      { $sort: { events: -1 } },
      { $limit: 10 },
    ]);

    // ────────────────────────────────────────────────
    // 6. Registrations Trend (Line Chart - by day/week/month)
    // ────────────────────────────────────────────────
    const registrationsTrend = await EventRegistration.aggregate([
      { $match: { ...dateFilter, ...clubFilter } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: timeRange === 'thisWeek' ? '%Y-%m-%d' : '%Y-%m',
              date: '$createdAt',
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', registrations: '$count' } },
    ]);

    // ────────────────────────────────────────────────
    // 7. Recent Activity (last 30 actions - events + registrations)
    // ────────────────────────────────────────────────
const recentActivity = await Promise.all([
  // Recent events (created / approved / rejected)
  Event.find({ ...dateFilter, ...clubFilter })
    .sort({ createdAt: -1 })
    .limit(15)
    .populate('club', 'name')
    .populate('createdBy', 'name role')
    .lean()
    .then(events =>
      events.map(e => {
        let type = '';
        let description = '';

        if (e.status === 'pending') {
          type = 'Event Created';
          description = `${e.createdBy?.name || 'Unknown Leader'} created "${e.title}"`;
        } else if (e.status === 'approved') {
          type = 'Event Approved';
          description = `Admin approved "${e.title}"`;
        } else if (e.status === 'rejected') {
          type = 'Event Rejected';
          description = `Admin rejected "${e.title}"`;
        } else {
          type = 'Event Updated';
          description = `"${e.title}" status changed to ${e.status}`;
        }

        return {
          timestamp: e.createdAt,
          type,
          description,
          club: e.club?.name || '-',
          user: e.createdBy?.name || '-',
        };
      })
    ),

  // Recent registrations
  EventRegistration.find({ ...dateFilter, ...clubFilter })
    .sort({ createdAt: -1 })
    .limit(15)
    .populate('event', 'title club')
    .populate('student', 'name')
    .lean()
    .then(regs =>
      regs.map(r => ({
        timestamp: r.createdAt,
        type: 'New Registration',
        description: `${r.student?.name || 'Student'} registered for "${r.event?.title}"`,
        club: r.event?.club?.name || '-',
        user: r.student?.name || '-',
      }))
    ),
]).then(([events, registrations]) => 
  [...events, ...registrations]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 30)
);
    // ────────────────────────────────────────────────
    // 8. Low Activity Clubs (no events in period)
    // ────────────────────────────────────────────────
    const lowActivityClubs = await Club.aggregate([
      { $match: { 'members.0': { $exists: true } } },
      {
        $lookup: {
          from: 'events',
          localField: '_id',
          foreignField: 'club',
          pipeline: [{ $match: dateFilter }],
          as: 'recentEvents',
        },
      },
      { $match: { recentEvents: { $size: 0 } } },
      { $project: { name: 1, members: { $size: '$members' }, lastEvent: null } },
      { $sort: { members: -1 } },
      { $limit: 5 },
    ]);

    // ────────────────────────────────────────────────
    // Final Response
    // ────────────────────────────────────────────────
    res.json({
      stats,
      membershipPie,
      eventsByClub,
      registrationsTrend,
      recentActivity,
      lowActivityClubs,
    });
  } catch (err) {
    console.error('Admin reports error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};