const User = require('../models/user.model');
const { generateToken } = require('../utils/jwt.util');
exports.register = async (req, res) => {
  try {
    const { name, email, rollNumber, password } = req.body;

    if (!name || !email || !rollNumber || !password) {
      return res.status(400).json({ 
        message: 'Name, email, roll number, and password are all required for student registration' 
      });
    }

    let user = await User.findOne({ $or: [{ email }, { rollNumber }] });
    if (user) {
      if (user.email === email) return res.status(400).json({ message: 'Email already exists' });
      return res.status(400).json({ message: 'Roll number already registered' });
    }

    user = new User({
      name,
      email,
      rollNumber,
      password,
      role: 'student' // Forced – no way to register as leader/admin
    });

    await user.save();

    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        rollNumber: user.rollNumber,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Duplicate email or roll number' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        rollNumber: user.rollNumber,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};