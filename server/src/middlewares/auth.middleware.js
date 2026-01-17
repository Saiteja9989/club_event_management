const jwt = require('jsonwebtoken');
const config = require('../config/env');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized - no token' });
    }

    const decoded = jwt.verify(token, config.jwtSecret);

    req.user = decoded;  // Attach decoded user info (id, role, rollNumber, etc.) to request
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: 'Not authorized - invalid token' });
  }
};

module.exports = { protect };