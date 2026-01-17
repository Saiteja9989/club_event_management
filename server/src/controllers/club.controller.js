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
exports.requestJoinClub = async (req, res) => {
  try {
    const studentId = req.user.id; // from protect middleware
    const clubId = req.params.clubId;

    // Check if already member
    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: "Club not found" });

    if (club.members.includes(studentId)) {
      return res.status(400).json({ message: "Already a member" });
    }

    // Check if request already pending
    const existingRequest = await MembershipRequest.findOne({
      student: studentId,
      club: clubId,
      status: "pending",
    });
    if (existingRequest) {
      return res.status(400).json({ message: "Request already pending" });
    }

    const request = new MembershipRequest({
      student: studentId,
      club: clubId,
    });

    await request.save();

    res.status(201).json({ message: "Join request sent", request });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Leader approves/rejects request
exports.reviewJoinRequest = async (req, res) => {
  try {
    const leaderId = req.user.id;
    const requestId = req.params.requestId;
    const { action } = req.body; // 'approve' or 'reject'

    const request = await MembershipRequest.findById(requestId)
      .populate("club")
      .populate("student");

    if (!request) return res.status(404).json({ message: "Request not found" });

    // Only club leader can review
    if (request.club.leader.toString() !== leaderId) {
      return res
        .status(403)
        .json({ message: "Not authorized - only club leader" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request already processed" });
    }

    request.status = action === "approve" ? "approved" : "rejected";
    request.reviewedAt = new Date();
    request.reviewedBy = leaderId;
    await request.save();

    if (action === "approve") {
      // Add student to club members
      await Club.findByIdAndUpdate(request.club._id, {
        $addToSet: { members: request.student._id },
      });

      // Optional: add to student's joinedClubs
      await User.findByIdAndUpdate(request.student._id, {
        $addToSet: { joinedClubs: request.club._id },
      });

      // TODO: Trigger n8n email "You are now a member of [Club Name]"
    }

    res.json({ message: `Request ${action}d`, request });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Leader sees pending requests for their club
exports.getPendingRequests = async (req, res) => {
  try {
    const leaderId = req.user.id;

    const club = await Club.findOne({ leader: leaderId });
    if (!club)
      return res
        .status(404)
        .json({ message: "You are not a leader of any club" });

    const requests = await MembershipRequest.find({
      club: club._id,
      status: "pending",
    }).populate("student", "name email rollNumber");

    res.json({ requests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
