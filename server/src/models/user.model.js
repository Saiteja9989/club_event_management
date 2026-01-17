const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  rollNumber: {
    type: String,
    trim: true,
    uppercase: true,
    unique: true,
    sparse: true, // Allows null for admin
    validate: {
      validator: function (value) {
        if (this.role === 'student') {
          return !!value && value.length >= 6;
        }
        return true; // leaders & admin → optional/null
      },
      message: 'Roll number is required and must be at least 6 characters for students',
    },
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['student', 'leader', 'admin'],
    default: 'student',
  },
  joinedClubs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
  }],
  clubId: { // only meaningful for leaders
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Password hash (unchanged)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  // No next()
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);