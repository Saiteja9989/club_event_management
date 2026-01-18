const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  qrToken: { type: String, unique: true, sparse: true }, // unique for QR
  qrGeneratedAt: { type: Date },
  registeredAt: { type: Date, default: Date.now },
  attended: { type: Boolean, default: false },
  attendedAt: { type: Date },
});

// Prevent same student registering same event twice
eventRegistrationSchema.index({ event: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);