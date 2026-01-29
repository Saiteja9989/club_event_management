const Club = require('../models/club.model');
const User = require('../models/user.model');
const Event = require('../models/event.model');
const EventRegistration= require('../models/eventRegistration.model')
const MembershipRequest = require('../models/membershipRequest.model');
const axios = require('axios');

/**
 * Create a new club
 * Admin only
 * Optional: assign leader immediately if leaderId is provided
 */
exports.createClub = async (req, res) => {
  try {
    const { name, description, leaderId } = req.body;

    if (!name || !description) {
      return res.status(400).json({ message: "Name and description required" });
    }

    const club = new Club({
      name,
      description,
    });

    await club.save();

    let message = "Club created";

    // Optional immediate leader assignment
    if (leaderId) {
      const user = await User.findById(leaderId);
      if (!user || user.role !== 'student') {
        return res.status(400).json({ message: "Invalid student for leader" });
      }

      // Promote to leader
      user.role = 'leader';
      user.clubId = club._id;
      if (!user.joinedClubs.includes(club._id)) {
        user.joinedClubs.push(club._id);
      }
      await user.save();

      // Assign to club
      club.leader = leaderId;
      club.members.push(leaderId);
      await club.save();

      // Direct n8n notification (no utils)
      axios
        .post(process.env.N8N_PRODUCTION_WEBHOOK_URL, {
          type: "leader_appointed",
          email: user.email,
          name: user.name,
          clubName: club.name,
        })
        .catch((err) => console.error("n8n failed:", err));

      message += " and leader assigned";
    }

    res.status(201).json({
      message,
      club,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};



/**
 * Get all clubs (full details)
 * Admin only
 * Returns clubs with populated leader/members, (updated getAllClubs to include events and registrations count)
 */
exports.getAllClubs = async (req, res) => {
  try {
    let clubs = await Club.find()
      .populate("leader", "name email rollNumber")
      .populate("members", "name email rollNumber role")
      .sort({ createdAt: -1 });

    // For each club, fetch events and calculate registrations count
    clubs = await Promise.all(
      clubs.map(async (club) => {
        const clubObj = club.toObject();

        // Fetch events for this club
        const events = await Event.find({ club: club._id })
          .select("title description date time visibility status")
          .sort({ date: 1 });

        clubObj.events = await Promise.all(
          events.map(async (event) => {
            const eventObj = event.toObject();

            // Calculate registrations count
            eventObj.registrationsCount = await EventRegistration.countDocuments({ event: event._id });

            return eventObj;
          })
        );

        return clubObj;
      })
    );

    res.status(200).json({ total: clubs.length, clubs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 * Get student's club status in four simple arrays
 * Student only
 */
exports.getAllClubsForStudents = async (req, res) => {
  try {
    const studentId = req.user._id;

    const allClubs = await Club.find()
      .populate('leader', 'name email')
      .select('name description leader members createdAt')
      .sort({ name: 1 })
      .lean();

    const allRequests = await MembershipRequest.find({ student: studentId })
      .populate('club', 'name description leader members createdAt')
      .lean();

    const result = {
      clubsAvailableToJoin: [],
      clubsReqPendingForAdminApproval: [],
      clubsApprovedAndRejected: [],
      clubsThatAreAlreadyMember: [],
    };

    // First: build membership-based arrays
    allClubs.forEach(club => {
      const clubObj = {
        _id: club._id,
        name: club.name,
        description: club.description,
        leader: club.leader,
        memberCount: club.members?.length || 0,
        createdAt: club.createdAt,
      };

      const isMember = club.members?.some(m => m.toString() === studentId.toString());

      if (isMember) {
        result.clubsThatAreAlreadyMember.push(clubObj);
      }

      // Now check request for history (independent of membership)
      const request = allRequests.find(r => r.club._id.toString() === club._id.toString());

      if (request) {
        if (request.status === 'pending') {
          result.clubsReqPendingForAdminApproval.push({
            ...clubObj,
            requestStatus: 'pending',
            requestedAt: request.requestedAt,
          });
        } else if (request.status === 'approved' || request.status === 'rejected') {
          result.clubsApprovedAndRejected.push({
            ...clubObj,
            requestStatus: request.status,
            requestedAt: request.requestedAt,
            reviewedAt: request.reviewedAt,
            rejectionReason: request.rejectionReason || null,
          });
        } else if (request.status === 'join') {
          result.clubsAvailableToJoin.push(clubObj);
        }
      } else {
        // No request at all → available
        result.clubsAvailableToJoin.push(clubObj);
      }
    });

    res.json({
      success: true,
      clubsAvailableToJoin: result.clubsAvailableToJoin,
      clubsReqPendingForAdminApproval: result.clubsReqPendingForAdminApproval,
      clubsApprovedAndRejected: result.clubsApprovedAndRejected,
      clubsThatAreAlreadyMember: result.clubsThatAreAlreadyMember,
      totalClubs: allClubs.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
/**
 * Delete a club
 * Admin only
 * Cleans up all references before deletion
 */
exports.deleteClub = async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club) return res.status(404).json({ message: "Club not found" });

    await User.updateMany({ joinedClubs: club._id }, { $pull: { joinedClubs: club._id } });
    if (club.leader) {
      await User.findByIdAndUpdate(club.leader, { role: "student", clubId: null });
    }
    await MembershipRequest.deleteMany({ club: club._id });
    await club.deleteOne();

    res.json({ message: "Club deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Student requests to join a club
 * Student only
 * Creates pending membership request
 */
exports.requestJoin = async (req, res) => {
  try {
    const studentId = req.user._id;  // ← FIXED: use _id (ObjectId)
    const { clubId } = req.params;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: "Club not found" });

    if (club.members.includes(studentId)) {
      return res.status(400).json({ message: "Already a member" });
    }

    // Check existing request (use same studentId type)
    const existing = await MembershipRequest.findOne({
      student: studentId,
      club: clubId,
      status: { $in: ['pending'] },
    });

    if (existing) {
      return res.status(400).json({ message: "Request already pending" });
    }

    const request = new MembershipRequest({
      student: studentId,
      club: clubId,
      status: 'pending',
      requestedAt: new Date(),
    });

    await request.save();

    res.status(201).json({
      message: "Join request sent",
      requestId: request._id,
    });
  } catch (err) {
    console.error('Request join error:', err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Leader views pending join requests for their club
 * Leader only
 * Returns pending requests with student info
 */
exports.getClubMembershipData = async (req, res) => {
  try {
    const leaderId = req.user._id;
    const club = await Club.findOne({ leader: leaderId });
    if (!club) {
      return res.status(404).json({ message: "No club found" });
    }

    // 1. Pending requests
    const pendingRequests = await MembershipRequest.find({
      club: club._id,
      status: 'pending',
    })
      .populate('student', 'name email rollNumber')
      .sort({ requestedAt: -1 });

    // 2. Current members (approved) + join requestedAt/reviewedAt from MembershipRequest
    const approvedRequests = await MembershipRequest.find({
      club: club._id,
      status: 'approved',
    })
      .populate('student', 'name email rollNumber')
      .select('student requestedAt reviewedAt') // ← get dates from request
      .lean();

    // Map to member format
    const members = approvedRequests.map((req) => ({
      _id: req.student._id,
      name: req.student.name,
      email: req.student.email,
      rollNumber: req.student.rollNumber,
      requestedAt: req.requestedAt,
      reviewedAt: req.reviewedAt || req.updatedAt || null, // fallback to reviewedAt or updatedAt
      joinedAt: req.reviewedAt || req.updatedAt || null,
    }));

    // 3. History (approved + rejected)
    const history = await MembershipRequest.find({
      club: club._id,
      status: { $in: ['approved', 'rejected'] },
    })
      .populate('student', 'name email rollNumber')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      clubId: club._id.toString(),
      clubName: club.name,
      pendingRequests,
      members, // now has requestedAt & reviewedAt
      history,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Leader approves or rejects a membership request
 * Leader only
 * Updates request status and adds member if approved
 */
exports.reviewRequest = async (req, res) => {
  try {
    const { action, rejectionReason } = req.body;
    const request = await MembershipRequest.findById(req.params.requestId)
      .populate('student')
      .populate('club');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (action === 'approve') {
      request.status = 'approved';
      request.reviewedAt = new Date();
      request.reviewedBy = req.user.id;

      // Add student to club
      await Club.findByIdAndUpdate(request.club._id, {
        $addToSet: { members: request.student._id },
      });

      // Add club to student
      await User.findByIdAndUpdate(request.student._id, {
        $addToSet: { joinedClubs: request.club._id },
      });
    }

    if (action === 'reject') {
      request.status = 'rejected';
      request.rejectionReason = rejectionReason;
      request.reviewedAt = new Date();
      request.reviewedBy = req.user.id;
    }

    await request.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.assignLeader = async (req, res) => {
  try {
    const { userId } = req.body;
    const { clubId } = req.params;

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== "student") {
      return res
        .status(400)
        .json({ message: "Invalid or non-student user" });
    }

    // Promote user to leader
    user.role = "leader";
    user.clubId = club._id;

    if (!user.joinedClubs.includes(club._id)) {
      user.joinedClubs.push(club._id);
    }

    await user.save();

    // Assign leader to club
    club.leader = user._id;

    await Club.findByIdAndUpdate(club._id, {
      $addToSet: { members: user._id },
    });

    await club.save();

    // Notify via n8n
    axios
      .post(process.env.N8N_PRODUCTION_WEBHOOK_URL, {
        type: "leader_appointed",
        email: user.email,
        name: user.name,
        clubName: club.name,
      })
      .catch((err) => console.error("n8n failed:", err));

    res.json({
      message: "Leader assigned",
      leader: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 * Remove a member from a club
 * Also handles if the user was leader
 */
exports.removeMember = async (req, res) => {
  try {
    const { clubId, userId } = req.params;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: "Club not found" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Remove from club members
    club.members = club.members.filter((m) => m.toString() !== userId);
    
    // If user was leader, clear leadership
    if (club.leader?.toString() === userId) {
      club.leader = null;
      user.role = 'student';
      user.clubId = null;
    }

    // Remove club from user's joinedClubs
    user.joinedClubs = user.joinedClubs.filter((c) => c.toString() !== clubId);

    await club.save();
    await user.save();

    res.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Change role of a member in a club
 * - If promoting to Leader: make them leader (only one leader allowed)
 * - If demoting Leader to Member: clear leader field
 */
exports.changeMemberRole = async (req, res) => {
  try {
    const { clubId, userId } = req.params;
    const { newRole } = req.body; // "Leader" or "Member"

    if (!["Leader", "Member"].includes(newRole)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: "Club not found" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!club.members.some(m => m.toString() === userId)) {
      return res.status(400).json({ message: "User is not a member of this club" });
    }

    if (newRole === "Leader") {
      // Promote to leader (demote current leader if any)
      if (club.leader && club.leader.toString() !== userId) {
        const oldLeader = await User.findById(club.leader);
        if (oldLeader) {
          oldLeader.role = 'student';
          oldLeader.clubId = null;
          await oldLeader.save();
        }
      }
      club.leader = userId;
      user.role = 'leader';
      user.clubId = club._id;
    } else if (newRole === "Member") {
      // Demote from leader
      if (club.leader?.toString() === userId) {
        club.leader = null;
        user.role = 'student';
        user.clubId = null;
      }
    }

    await club.save();
    await user.save();

    res.json({ message: `Role changed to ${newRole}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//leader dashboard for his clubs 
exports.getMyClubDashboard = async (req, res) => {
  try {
    const leaderId = req.user.id;
    const club = await Club.findOne({ leader: leaderId })
      .populate('members', 'name email')
      .lean();

    if (!club) {
      return res.status(404).json({ message: 'No club assigned' });
    }

    const upcomingEvents = await Event.find({
      club: club._id,
      date: { $gte: new Date() },
      status: 'approved',
    })
      .sort({ date: 1 })
      .limit(5)
      .lean();

    const pendingRequests = await MembershipRequest.countDocuments({
      club: club._id,
      status: 'pending',
    });
    const ApprovedEvents = await Event.countDocuments({ status: 'approved', });
    const PendingEvents = await Event.countDocuments({ status: 'pending', });
    const RejectedEvents = await Event.countDocuments({ status: 'rejected', });
    const totalRegistrations = await EventRegistration.countDocuments({ event: { $in: club.events || [] } });
    const attended = await EventRegistration.countDocuments({
      event: { $in: club.events || [] },
      attended: true,
    });
    const avgAttendance = totalRegistrations > 0 ? Math.round((attended / totalRegistrations) * 100) : 0;

    const recentActivity = await Promise.all([
      // Membership approvals
      MembershipRequest.find({ club: club._id, status: { $in: ['approved', 'rejected'] } })
        .sort({ updatedAt: -1 })
        .limit(10)
        .populate('student', 'name')
        .lean()
        .then(reqs => reqs.map(r => ({
          timestamp: r.updatedAt ? r.updatedAt.toISOString() : new Date().toISOString(),
          type: r.status === 'approved' ? 'Member Approved' : 'Member Rejected',
          description: `You ${r.status} ${r.student?.name || 'a student'} to join`,
        }))),
       
      
      // New registrations
      EventRegistration.find({ event: { $in: club.events || [] } })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('student', 'name')
        .populate('event', 'title')
        .lean()
        .then(regs => regs.map(r => ({
          timestamp: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
          type: 'New Registration',
          description: `${r.student?.name || 'Student'} registered for "${r.event?.title}"`,
        }))),
    ]).then(([approvals, regs]) => [...approvals, ...regs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));

    res.json({
      clubData: {
        name: club.name,
        description: club.description,
        memberCount: club.members?.length || 0,
        leaderName: req.user.name,
        newMembersThisMonth: 0, // calculate if needed
        upcomingEvents,
        pendingRequests,
        ApprovedEvents,
        RejectedEvents,
        PendingEvents,
        totalRegistrations,
        avgAttendance,
      },
      recentActivity,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

