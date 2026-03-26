const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    reactions: [
      {
        emoji: { type: String, required: true },
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      },
    ],
    isPinned: { type: Boolean, default: false },
    pinnedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    attachment: {
      url: { type: String },
      name: { type: String },
      type: { type: String }, // 'image' | 'document'
      size: { type: Number },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
