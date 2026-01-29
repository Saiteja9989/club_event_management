const mongoose = require("mongoose");

const eventRegistrationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  qrToken: {
    type: String,
    required: true,
  },
  qrCode: {
    type: String, // ✅ S3 URL
    default: null,
  },
  qrGeneratedAt: Date,
  attended: {
    type: Boolean,
    default: false,
  },
  attendedAt: Date,
});

module.exports = mongoose.model("EventRegistration", eventRegistrationSchema);
