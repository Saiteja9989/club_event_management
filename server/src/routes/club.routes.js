const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/auth.middleware');
const { adminOnly,studentOnly,leaderOnly } = require('../middlewares/role.middleware');
const clubController = require('../controllers/club.controller');

router.post('/', protect, adminOnly, clubController.createClub);
router.patch('/:clubId/assign-leader', protect, adminOnly, clubController.assignLeader);

// Student join request (protected + student only)
router.post('/:clubId/join', protect, studentOnly, clubController.requestJoin);

// Leader views pending requests for their club
router.get('/pending-requests', protect, leaderOnly, clubController.getPendingRequests);

// Leader reviews (approve/reject) a request
router.patch('/requests/:requestId/review', protect, leaderOnly, clubController.reviewRequest);

module.exports = router;

