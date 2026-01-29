const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },

    description: {
      type: String,
      required: [true, "Event description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    date: {
      type: Date,
      required: [true, "Event date is required"],
    },

    time: {
      type: String,
      required: [true, "Event time is required"],
      // You can add validation like: match: /^\d{2}:\d{2} - \d{2}:\d{2}$/
    },

    venue: {
      type: String,
      required: [true, "Venue is required"],
      trim: true,
    },

    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: [true, "Club reference is required"],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator reference is required"],
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      required: true,
    },

    visibility: {
      type: String,
      enum: ["club-only", "open-to-all"],
      default: "club-only",
      required: true,
    },

    maxParticipants: {
      type: Number,
      default: 100,
      min: [1, "Maximum participants must be at least 1"],
    },

    // Poster is completely OPTIONAL – no required field
    poster: {
      type: String,
      default: null, // or "" if you prefer empty string
      trim: true,
    },
   
clubName: { type: String },
    price: {
      type: Number,
      default: 0,
      min: [0, "Price cannot be negative"],
    },

    isPaid: {
      type: Boolean,
      default: false,
    },

    // Optional registration deadline
    registrationDeadline: {
      type: Date,
      default: null,
    },
    
    attended: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],

    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // automatically adds/handles createdAt & updatedAt
  },
);

// Optional: Add index for faster queries
eventSchema.index({ club: 1, status: 1 });
eventSchema.index({ date: 1 });

module.exports = mongoose.model("Event", eventSchema);
