// controllers/users.controller.js
const User = require('../models/user.model');
const Club = require('../models/club.model');
const EventRegistration = require('../models/eventRegistration.model');
const MembershipRequest = require('../models/membershipRequest.model');
const Event = require('../models/event.model');


/**
 * Get all users (exclude admins)
 * Admin only
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } })  // ← exclude admins
      .select('name email rollNumber role joinedClubs createdAt isActive lastLogin')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: users.length, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get full details of a single user
 * Admin only
 * Returns complete profile: joined clubs, pending requests, events, leader info
 */
exports.getUserDetails = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Fetch user with populated fields
    const user = await User.findById(userId)
      .populate('joinedClubs', 'name description leader createdAt') // Joined clubs
      .populate('clubId', 'name description') // Led club (for leaders)
      .populate('createdEvents', 'title description date time status club'); // Created events

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Pending membership requests
    const pendingRequests = await MembershipRequest.find({
      student: userId,
      status: 'pending'
    })
      .populate('club', 'name description')
      .sort({ requestedAt: -1 });

    // Registered events (upcoming + attended)
    const registrations = await EventRegistration.find({ student: userId })
      .populate({
        path: 'event',
        select: 'title date time status club',
        populate: { path: 'club', select: 'name' }
      });

    const upcomingEvents = registrations
      .filter(r => !r.attended && r.event && new Date(r.event.date) > new Date())
      .map(r => ({
        ...r.event.toObject(),
        attended: r.attended,
        registrationId: r._id,
      }));

    const attendedEvents = registrations
      .filter(r => r.attended && r.event)
      .map(r => ({
        ...r.event.toObject(),
        attended: r.attended,
        registrationId: r._id,
      }));

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        pendingRequests,
        upcomingEvents,
        attendedEvents,
      },
    });
  } catch (err) {
    console.error('Get user details error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Delete a user permanently
 * Admin only
 * Cleans up all references before deletion
 */
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Prevent self-deletion
    if (user._id.toString() === req.user.id) {
      return res.status(403).json({ success: false, message: 'Cannot delete your own account' });
    }

    // Prevent deleting last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(403).json({ success: false, message: 'Cannot delete the last admin' });
      }
    }

    // Clean up clubs
    await Club.updateMany(
      { members: userId },
      { $pull: { members: userId } }
    );
    await Club.updateMany(
      { leader: userId },
      { $unset: { leader: '' } }
    );

    // Clean up membership requests
    await MembershipRequest.deleteMany({ student: userId });

    // Clean up event registrations
    await EventRegistration.deleteMany({ student: userId });

    // Optional: delete events created by user (if leader)
    if (user.role === 'leader') {
      await Event.deleteMany({ createdBy: userId });
    }

    // Delete user
    await User.findByIdAndDelete(userId);

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Toggle user active status (ban/unban)
 * Admin only
 */
exports.toggleUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'unblocked' : 'blocked'}`,
      isActive: user.isActive,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
