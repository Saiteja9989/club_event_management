/**
 * Clubs & Membership Routes
 * Mixed access: admin, student, leader
 */
const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/auth.middleware');
const { adminOnly, studentOnly, leaderOnly } = require('../middlewares/role.middleware');
const clubController = require('../controllers/club.controller');
const messageController = require('../controllers/message.controller');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });


// Admin only - create new club
router.post('/', protect, adminOnly, clubController.createClub);               // Creates club with no leader initially

// Admin only - list all clubs with full details
router.get('/', protect, adminOnly, clubController.getAllClubs);               // Returns clubs with populated leader/members

// Student only - browse visible clubs + membership status
router.get('/browse', protect, studentOnly, clubController.getAllClubsForStudents); // Returns safe list with isMember/hasPending flags

// Admin only - delete a club
router.delete('/:clubId', protect, adminOnly, clubController.deleteClub);      // Deletes club and cleans up references

// Student only - request to join a club
router.post('/:clubId/join', protect, studentOnly, clubController.requestJoin); // Creates pending membership request

// Leader only - view pending join requests for their club
router.get('/requests', protect, leaderOnly, clubController.getClubMembershipData); // Returns pending requests with student info

// Leader only - approve or reject a membership request
router.patch('/requests/:requestId/review', protect, leaderOnly, clubController.reviewRequest); // Updates request status and adds member if approved

// NEW: Assign leader to existing club (your existing function)
router.patch('/:clubId/assign-leader', protect, adminOnly,clubController.assignLeader);

// NEW: Remove member from club
router.delete('/:clubId/members/:userId',protect , clubController.removeMember);

router.get('/myclubs', protect, leaderOnly, clubController.getMyClubDashboard);

// Leader only - update their club name/description
router.patch('/my-club', protect, leaderOnly, clubController.updateMyClub);

// NEW: Change role of member in club (promote/demote leader)
router.patch('/:clubId/members/:userId/role', protect, adminOnly,clubController.changeMemberRole);

// ── Club Chat Routes (members + leaders) ──────────────────────────────────
router.get('/:clubId/messages', protect, messageController.getMessages);
router.post('/:clubId/messages', protect, messageController.sendMessage);
router.post('/:clubId/messages/upload', protect, upload.single('file'), messageController.uploadAttachment);
router.patch('/:clubId/messages/:messageId/pin', protect, messageController.pinMessage);
router.patch('/:clubId/messages/:messageId/react', protect, messageController.toggleReaction);

module.exports = router;