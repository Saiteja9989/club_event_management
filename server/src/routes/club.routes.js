const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/auth.middleware');
const { adminOnly,studentOnly,leaderOnly } = require('../middlewares/role.middleware');
const clubController = require('../controllers/club.controller');

router.post('/', protect, adminOnly, clubController.createClub);
router.patch('/:clubId/assign-leader', protect, adminOnly, clubController.assignLeader);

router.post('/:clubId/join', protect, studentOnly, clubController.requestJoinClub);
router.get('/pending-requests', protect, leaderOnly, clubController.getPendingRequests);
router.patch('/requests/:requestId/review', protect, leaderOnly, clubController.reviewJoinRequest);

module.exports = router;

module.exports = router;