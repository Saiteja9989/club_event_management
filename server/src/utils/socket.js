// src/utils/socket.js
// Socket.io instance + helper to emit notifications
let io;

// clubId -> Map(socketId -> { userId, name })
const clubOnlineUsers = new Map();

const initSocket = (httpServer) => {
  const { Server } = require('socket.io');
  io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    // Notification room — join userId room
    socket.on('join', (userId) => {
      if (userId) socket.join(userId.toString());
    });

    // Club chat — join club room
    socket.on('join_club_chat', ({ clubId, userId, name }) => {
      if (!clubId) return;
      socket.join(`club_${clubId}`);
      socket.data.clubId = clubId;
      socket.data.userId = userId;
      socket.data.name = name;

      if (!clubOnlineUsers.has(clubId)) clubOnlineUsers.set(clubId, new Map());
      clubOnlineUsers.get(clubId).set(socket.id, { userId, name });

      io.to(`club_${clubId}`).emit('club_online_users',
        Array.from(clubOnlineUsers.get(clubId).values())
      );
    });

    // Club chat — leave club room
    socket.on('leave_club_chat', ({ clubId }) => {
      if (!clubId) return;
      socket.leave(`club_${clubId}`);
      if (clubOnlineUsers.has(clubId)) {
        clubOnlineUsers.get(clubId).delete(socket.id);
        io.to(`club_${clubId}`).emit('club_online_users',
          Array.from(clubOnlineUsers.get(clubId).values())
        );
      }
    });

    // Typing indicators
    socket.on('club_typing', ({ clubId, name }) => {
      socket.to(`club_${clubId}`).emit('club_typing', { name });
    });

    socket.on('club_stop_typing', ({ clubId }) => {
      socket.to(`club_${clubId}`).emit('club_stop_typing');
    });

    // Cleanup on disconnect
    socket.on('disconnect', () => {
      const { clubId } = socket.data;
      if (clubId && clubOnlineUsers.has(clubId)) {
        clubOnlineUsers.get(clubId).delete(socket.id);
        io.to(`club_${clubId}`).emit('club_online_users',
          Array.from(clubOnlineUsers.get(clubId).values())
        );
      }
    });
  });

  return io;
};

const getIO = () => io;

/**
 * Save notification to DB and push to user via socket
 * @param {ObjectId|string} recipientId
 * @param {{ type, title, message, link? }} payload
 */
const emitNotification = async (recipientId, payload) => {
  try {
    const Notification = require('../models/notification.model');
    const notif = await Notification.create({
      recipient: recipientId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      link: payload.link || null,
    });

    if (io) {
      io.to(recipientId.toString()).emit('notification', {
        _id: notif._id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        link: notif.link,
        read: false,
        createdAt: notif.createdAt,
      });
    }
  } catch (err) {
    console.error('emitNotification error:', err.message);
  }
};

module.exports = { initSocket, getIO, emitNotification };
