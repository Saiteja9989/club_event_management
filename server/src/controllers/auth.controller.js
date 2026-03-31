const User = require('../models/user.model');
const { generateToken } = require('../utils/jwt.util');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { emitNotification } = require('../utils/socket');

/**
 * Register a new student
 * Public access - no authentication required
 * Creates a new user with role "student" only
 */
exports.register = async (req, res) => {
  try {
    const { name, email, rollNumber, password } = req.body;

    if (!name || !email || !rollNumber || !password) {
      return res.status(400).json({ message: "Name, email, roll number, and password required" });
    }

    let user = await User.findOne({ $or: [{ email }, { rollNumber }] });
    if (user) {
      if (user.email === email) return res.status(400).json({ message: "Email already exists" });
      return res.status(400).json({ message: "Roll number already registered" });
    }

    user = new User({
      name,
      email,
      rollNumber,
      password,
      role: "student",
    });

    await user.save();

    // Notify all admins of new registration
    User.find({ role: 'admin' }).select('_id').lean().then((admins) => {
      admins.forEach((admin) => {
        emitNotification(admin._id, {
          type: 'new_user_registered',
          title: 'New User Registered',
          message: `${user.name} (${user.rollNumber}) just created an account.`,
          link: '/admin/users',
        });
      });
    }).catch(() => {});

    const token = generateToken(user);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, rollNumber: user.rollNumber, role: user.role },
    });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) return res.status(400).json({ message: "Duplicate email or roll number" });
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Login user
 * Public access - no authentication required
 * Returns JWT token on success
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ← ADD THIS CHECK
    if (!user.isActive) {
      return res.status(403).json({ 
        message: "Your account is blocked. Contact admin." 
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        rollNumber: user.rollNumber,
        role: user.role,
        clubId: user.clubId || null,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // IMPORTANT: Do NOT reveal user existence
      return res.status(200).json({
        message: 'If the email exists, a reset link has been sent.',
      });
    }

    // 1️⃣ Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 2️⃣ Hash token before saving
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // 3️⃣ Save to DB
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    // 4️⃣ Reset link
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    res.status(200).json({
      message: 'If the email exists, a reset link has been sent.',
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user._id;

    if (!name && !email) {
      return res.status(400).json({ message: 'Nothing to update' });
    }

    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: userId } });
      if (existing) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    const updates = {};
    if (name) updates.name = name.trim();
    if (email) updates.email = email.trim();

    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('name email rollNumber role');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;
    console.log("RESET BODY:", req.body);


    // 1️⃣ Validate input
    if (!password || password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: 'Passwords do not match',
      });
    }

    // 2️⃣ Hash token from URL
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // 3️⃣ Find valid user
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired reset token',
      });
    }

    user.password = password

    // 5️⃣ Clear reset fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login.',
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
