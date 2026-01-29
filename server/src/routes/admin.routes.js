/**
 * Admin Routes
 * All routes require authentication + admin role
 */
const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/auth.middleware');
const { adminOnly } = require('../middlewares/role.middleware');
const adminController = require('../controllers/admin.controller');
const userController = require('../controllers/users.controller');

router.use(protect, adminOnly); // All routes below are admin-only

// Get quick stats for admin dashboard cards
router.get('/stats', adminController.getDashboardStats);           // Returns total users, clubs, events, pending events

// Get detailed aggregated reports
router.get('/reports', adminController.getReports);            // Returns totals + attendance rate for reports page

// List all registered users
router.get('/users', userController.getAllUsers);              // Returns list of users with basic fields

// Toggle ban status (active ↔ banned)
router.patch('/users/:userId/toggle-active', userController.toggleUserActive); // Bans or unbans a user

// get full details of single user
router.get('/users/:userId/details', userController.getUserDetails); 

// delete a user by Admin
router.delete('/users/:userId', userController.deleteUser);

module.exports = router;