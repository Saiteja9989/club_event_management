// src/routes/student.routes.js
const express = require('express');
const router = express.Router();
const { getStudentDashboardStats, getStudentProfile } = require('../controllers/student.controller');
const { protect } = require('../middlewares/auth.middleware');
const { studentOnly } = require('../middlewares/role.middleware');

router.get('/dashboard/stats', protect, getStudentDashboardStats);
router.get('/profile', protect, studentOnly, getStudentProfile);

module.exports = router;