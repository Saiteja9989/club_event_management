// src/routes/notification.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const notifController = require('../controllers/notification.controller');

router.use(protect);

router.get('/', notifController.getMyNotifications);
router.patch('/mark-all-read', notifController.markAllRead);
router.patch('/:id/read', notifController.markRead);

module.exports = router;
