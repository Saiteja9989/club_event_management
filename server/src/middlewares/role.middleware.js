const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied - Admin only' });
  }
  next();
};

const leaderOnly = (req, res, next) => {
  if (req.user.role !== 'leader') {
    return res.status(403).json({ message: 'Access denied - Club Leader only' });
  }
  next();
};

const studentOnly = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Access denied - Student only' });
  }
  next();
};

module.exports = { adminOnly, leaderOnly, studentOnly };