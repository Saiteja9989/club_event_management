// src/routes/student.routes.js
const express = require('express');
const router = express.Router();
const { getStudentDashboardStats } = require('../controllers/student.controller');
const { protect } = require('../middlewares/auth.middleware');


// Only students can access dashboard stats
router.get('/dashboard/stats', protect, getStudentDashboardStats);

module.exports = router;