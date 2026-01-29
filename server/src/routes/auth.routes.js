/**
 * Authentication Routes
 * Public routes - no authentication required
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Public - anyone can register as a student
router.post('/register', authController.register);       // Creates new student account

// Public - anyone can login
router.post('/login', authController.login);             // Authenticates user and returns JWT token

// Public - request password reset link
router.post('/forgot-password', authController.forgotPassword);

// Public - reset password using token
router.post('/reset-password/:token', authController.resetPassword);

module.exports = router;