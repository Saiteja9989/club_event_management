const mongoose = require('mongoose');

const membershipRequestSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true,
  },
   status: {
    type: String,
    enum: ['join', 'pending', 'approved', 'rejected'],  // ← added 'join'
    default: 'join',  // ← default is 'join' (available to request)
  },
   
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  reviewedAt: Date,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // New field: reason to join (required)
  reasonToJoin: {
    type: String,
    trim: true,
    minlength: [10, 'Reason must be at least 10 characters'],
  },
});

module.exports = mongoose.model('MembershipRequest', membershipRequestSchema);