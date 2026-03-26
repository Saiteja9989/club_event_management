const Message = require('../models/message.model');
const Club = require('../models/club.model');
const { getIO } = require('../utils/socket');
const { s3, bucketName } = require('../config/s3');

async function checkMembership(userId, clubId) {
  const club = await Club.findById(clubId).lean();
  if (!club) return { allowed: false, isLeader: false };
  const isLeader = club.leader?.toString() === userId.toString();
  const isMember = club.members.some((m) => m.toString() === userId.toString());
  return { allowed: isLeader || isMember, isLeader };
}

exports.getMessages = async (req, res) => {
  try {
    const { clubId } = req.params;
    const { before, limit = 50 } = req.query;
    const userId = (req.user._id || req.user.id).toString();

    const { allowed } = await checkMembership(userId, clubId);
    if (!allowed) return res.status(403).json({ message: 'You are not a member of this club' });

    const query = { club: clubId };
    if (before) query.createdAt = { $lt: new Date(before) };

    const [messages, pinnedMessage, club] = await Promise.all([
      Message.find(query)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .populate('sender', 'name email role')
        .lean(),
      Message.findOne({ club: clubId, isPinned: true })
        .populate('sender', 'name role')
        .lean(),
      Club.findById(clubId)
        .populate('leader', 'name email role')
        .populate('members', 'name email role')
        .lean(),
    ]);

    res.json({
      messages: messages.reverse(),
      pinnedMessage: pinnedMessage || null,
      club,
      hasMore: messages.length === Number(limit),
    });
  } catch (err) {
    console.error('getMessages error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.uploadAttachment = async (req, res) => {
  try {
    const { clubId } = req.params;
    const userId = (req.user._id || req.user.id).toString();

    const { allowed } = await checkMembership(userId, clubId);
    if (!allowed) return res.status(403).json({ message: 'Not a member' });

    if (!req.file) return res.status(400).json({ message: 'No file provided' });

    const isImage = req.file.mimetype.startsWith('image/');
    const key = `clubs/chat/${clubId}/${Date.now()}-${req.file.originalname}`;

    const result = await s3.upload({
      Bucket: bucketName,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: 'public-read',
    }).promise();

    res.json({
      url: result.Location,
      name: req.file.originalname,
      type: isImage ? 'image' : 'document',
      size: req.file.size,
    });
  } catch (err) {
    console.error('uploadAttachment error:', err);
    res.status(500).json({ message: 'Upload failed' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { clubId } = req.params;
    const { content, attachment } = req.body;
    const userId = (req.user._id || req.user.id).toString();

    if (!content?.trim() && !attachment?.url) return res.status(400).json({ message: 'Message cannot be empty' });

    const { allowed } = await checkMembership(userId, clubId);
    if (!allowed) return res.status(403).json({ message: 'You are not a member of this club' });

    const msg = await Message.create({
      club: clubId,
      sender: userId,
      content: content?.trim() || '',
      ...(attachment?.url ? { attachment } : {}),
    });
    const populated = await msg.populate('sender', 'name email role');

    const io = getIO();
    if (io) io.to(`club_${clubId}`).emit('club_message', populated);

    res.status(201).json({ message: populated });
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.pinMessage = async (req, res) => {
  try {
    const { clubId, messageId } = req.params;
    const userId = (req.user._id || req.user.id).toString();

    const { isLeader } = await checkMembership(userId, clubId);
    if (!isLeader) return res.status(403).json({ message: 'Only the club leader can pin messages' });

    // Unpin all first
    await Message.updateMany({ club: clubId, isPinned: true }, { isPinned: false, pinnedBy: null });

    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found' });

    const wasPinned = msg.isPinned;
    msg.isPinned = !wasPinned;
    msg.pinnedBy = !wasPinned ? userId : null;
    await msg.save();

    const populated = await msg.populate('sender', 'name role');
    const io = getIO();
    if (io) io.to(`club_${clubId}`).emit('club_pin', { message: populated, isPinned: msg.isPinned });

    res.json({ message: populated });
  } catch (err) {
    console.error('pinMessage error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.toggleReaction = async (req, res) => {
  try {
    const { clubId, messageId } = req.params;
    const { emoji } = req.body;
    const userId = (req.user._id || req.user.id).toString();

    const { allowed } = await checkMembership(userId, clubId);
    if (!allowed) return res.status(403).json({ message: 'Not a member' });

    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found' });

    const rIdx = msg.reactions.findIndex((r) => r.emoji === emoji);
    if (rIdx === -1) {
      msg.reactions.push({ emoji, users: [userId] });
    } else {
      const uIdx = msg.reactions[rIdx].users.findIndex((u) => u.toString() === userId);
      if (uIdx === -1) {
        msg.reactions[rIdx].users.push(userId);
      } else {
        msg.reactions[rIdx].users.splice(uIdx, 1);
        if (msg.reactions[rIdx].users.length === 0) msg.reactions.splice(rIdx, 1);
      }
    }

    await msg.save();

    const io = getIO();
    if (io) io.to(`club_${clubId}`).emit('club_reaction', { messageId, reactions: msg.reactions });

    res.json({ reactions: msg.reactions });
  } catch (err) {
    console.error('toggleReaction error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
