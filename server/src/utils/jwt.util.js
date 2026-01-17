const jwt = require('jsonwebtoken');
const config = require('../config/env');

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      rollNumber: user.rollNumber || null,
      clubId: user.clubId || null,
    },
    config.jwtSecret,
    { expiresIn: '7d' } // 7 days for dev; shorten in prod
  );
};

module.exports = { generateToken };