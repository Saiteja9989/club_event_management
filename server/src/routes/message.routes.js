const express = require('express');
const router = express.Router({ mergeParams: true });
const multer = require('multer');
const { protect } = require('../middlewares/auth.middleware');
const { getMessages, sendMessage, pinMessage, toggleReaction, uploadAttachment } = require('../controllers/message.controller');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(protect);

router.get('/', getMessages);
router.post('/', sendMessage);
router.post('/upload', upload.single('file'), uploadAttachment);
router.patch('/:messageId/pin', pinMessage);
router.patch('/:messageId/react', toggleReaction);

module.exports = router;
