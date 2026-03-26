const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: true }
);

// One feedback per student per event
feedbackSchema.index({ event: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('EventFeedback', feedbackSchema);
