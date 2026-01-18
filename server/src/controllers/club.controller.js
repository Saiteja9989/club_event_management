const Club = require("../models/club.model");
const User = require("../models/user.model");
const MembershipRequest = require("../models/membershipRequest.model");
exports.createClub = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({ message: "Name and description required" });
    }

    const club = new Club({
      name,
      description,
      // leader will be assigned later
    });

    await club.save();

    res.status(201).json({ message: "Club created", club });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.assignLeader = async (req, res) => {
  try {
    const { userId } = req.body;
    const clubId = req.params.clubId;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: "Club not found" });

    const user = await User.findById(userId);
    if (!user || user.role !== "student") {
      return res.status(400).json({ message: "Invalid or non-student user" });
    }

    // Promote to leader
    user.role = "leader";
    user.clubId = club._id;

    if (!user.joinedClubs.includes(club._id)) {
      user.joinedClubs.push(club._id);
    }

    await user.save();

    // Assign to club
    club.leader = user._id;
    await Club.findByIdAndUpdate(club._id, {
      $addToSet: { members: user._id }, // add leader as member
    });
    await club.save();

    res.json({ message: "Leader assigned", leader: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Student requests to join club
exports.requestJoin = async (req, res) => {
  try {
    const studentId = req.user.id; // from protect middleware
    const clubId = req.params.clubId;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    // Already member?
    if (club.members.includes(studentId)) {
      return res.status(400).json({ message: 'You are already a member' });
    }

    // Already pending request?
    const existing = await MembershipRequest.findOne({
      student: studentId,
      club: clubId,
      status: 'pending',
    });
    if (existing) return res.status(400).json({ message: 'Request already pending' });

    const request = new MembershipRequest({
      student: studentId,
      club: clubId,
    });
    await request.save();

    res.status(201).json({
      message: 'Join request sent successfully',
      requestId: request._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Leader gets all pending requests for their club
exports.getPendingRequests = async (req, res) => {
  try {
    const leaderId = req.user.id;

    const club = await Club.findOne({ leader: leaderId });
    if (!club) return res.status(403).json({ message: 'You are not a leader of any club' });

    const requests = await MembershipRequest.find({
      club: club._id,
      status: 'pending',
    })
      .populate('student', 'name email rollNumber') // show student details
      .sort({ requestedAt: -1 }); // newest first

    res.json({
      clubName: club.name,
      pendingRequests: requests,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Leader approves or rejects a request
exports.reviewRequest = async (req, res) => {
  try {
    const leaderId = req.user.id;
    const requestId = req.params.requestId;
    const { action, rejectionReason } = req.body; // action: "approve" or "reject"

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const request = await MembershipRequest.findById(requestId)
      .populate('club')
      .populate('student');

    if (!request) return res.status(404).json({ message: 'Request not found' });

    // Only the club's leader can review
    if (request.club.leader.toString() !== leaderId) {
      return res.status(403).json({ message: 'Not authorized for this club' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    request.status = action;
    request.reviewedAt = new Date();
    request.reviewedBy = leaderId;
    request.rejectionReason = action === 'reject' ? rejectionReason : undefined;
    await request.save();

    if (action === 'approve') {
      // Add student to club members
      await Club.findByIdAndUpdate(request.club._id, {
        $addToSet: { members: request.student._id },
      });

      // Add club to student's joinedClubs
      await User.findByIdAndUpdate(request.student._id, {
        $addToSet: { joinedClubs: request.club._id },
      });

      // TODO: Later add n8n email trigger here
      // await axios.post('YOUR_N8N_WEBHOOK', {
      //   type: 'membership_approved',
      //   email: request.student.email,
      //   clubName: request.club.name
      // });
    }

    res.json({
      message: `Request ${action}d successfully`,
      request,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};