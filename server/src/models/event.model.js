const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true }, // "14:00 - 16:00"
  venue: { type: String, required: true },
  club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  visibility: { type: String, enum: ['club-only', 'open-to-all'], default: 'club-only' },
  maxParticipants: { type: Number, default: 100 },
  poster: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Event', eventSchema);