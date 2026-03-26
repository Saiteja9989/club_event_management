const mongoose = require('mongoose');
const EventFeedback = require('../models/feedback.model');
const EventRegistration = require('../models/eventRegistration.model');
const Event = require('../models/event.model');

// POST /api/events/:eventId/feedback — student submits or updates feedback
exports.submitFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { rating, review } = req.body;
    const studentId = (req.user._id || req.user.id).toString();

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Must have attended the event
    const registration = await EventRegistration.findOne({
      event: eventId,
      student: studentId,
      attended: true,
    });
    if (!registration) {
      return res.status(403).json({ message: 'You must attend the event before leaving feedback' });
    }

    // Upsert — allow editing own review
    const feedback = await EventFeedback.findOneAndUpdate(
      { event: eventId, student: studentId },
      { rating, review: review?.trim() || '' },
      { upsert: true, new: true, runValidators: true }
    ).populate('student', 'name rollNumber');

    res.status(200).json({ feedback });
  } catch (err) {
    console.error('submitFeedback error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/events/:eventId/feedback/summary — avg rating + distribution (any auth)
exports.getFeedbackSummary = async (req, res) => {
  try {
    const { eventId } = req.params;

    const result = await EventFeedback.aggregate([
      { $match: { event: new mongoose.Types.ObjectId(eventId) } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
          five:  { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          four:  { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          three: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          two:   { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          one:   { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
        },
      },
    ]);

    if (!result.length) {
      return res.json({ avgRating: 0, count: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
    }

    const r = result[0];
    res.json({
      avgRating: Math.round(r.avgRating * 10) / 10,
      count: r.count,
      distribution: { 5: r.five, 4: r.four, 3: r.three, 2: r.two, 1: r.one },
    });
  } catch (err) {
    console.error('getFeedbackSummary error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/events/:eventId/feedback — all reviews (leader/admin)
exports.getEventFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;

    const [feedback, summary] = await Promise.all([
      EventFeedback.find({ event: eventId })
        .populate('student', 'name rollNumber')
        .sort({ createdAt: -1 }),
      EventFeedback.aggregate([
        { $match: { event: new mongoose.Types.ObjectId(eventId) } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            count: { $sum: 1 },
            five:  { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
            four:  { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
            three: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
            two:   { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
            one:   { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const s = summary[0] || {};
    res.json({
      feedback,
      summary: {
        avgRating: s.avgRating ? Math.round(s.avgRating * 10) / 10 : 0,
        count: s.count || 0,
        distribution: { 5: s.five || 0, 4: s.four || 0, 3: s.three || 0, 2: s.two || 0, 1: s.one || 0 },
      },
    });
  } catch (err) {
    console.error('getEventFeedback error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/events/:eventId/feedback/mine — student's own feedback
exports.getMyFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;
    const studentId = (req.user._id || req.user.id).toString();

    const feedback = await EventFeedback.findOne({ event: eventId, student: studentId });
    res.json({ feedback: feedback || null });
  } catch (err) {
    console.error('getMyFeedback error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
