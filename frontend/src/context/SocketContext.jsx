// src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import notificationApi from '../api/notificationApi';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

// Icon + colour per notification type
export const NOTIF_META = {
  // Student
  club_joined:           { icon: 'group_add',          color: 'text-green-500'   },
  membership_rejected:   { icon: 'person_off',          color: 'text-red-500'     },
  club_removed:          { icon: 'logout',              color: 'text-orange-500'  },
  leader_assigned:       { icon: 'military_tech',       color: 'text-purple-500'  },
  event_registered:      { icon: 'confirmation_number', color: 'text-blue-500'    },
  new_event_available:   { icon: 'event_available',     color: 'text-indigo-500'  },
  payment_success:       { icon: 'payments',            color: 'text-emerald-500' },
  attendance_marked:     { icon: 'fact_check',          color: 'text-teal-500'    },
  account_created:       { icon: 'person_check',        color: 'text-purple-500'  },
  // Leader
  event_approved:        { icon: 'event_available',     color: 'text-green-500'   },
  event_rejected:        { icon: 'event_busy',          color: 'text-red-500'     },
  new_member_request:    { icon: 'person_add',          color: 'text-blue-500'    },
  new_registration:      { icon: 'how_to_reg',          color: 'text-blue-500'    },
  // Admin
  event_pending_review:  { icon: 'pending_actions',     color: 'text-amber-500'   },
  new_user_registered:   { icon: 'person_add',          color: 'text-blue-500'    },
  default:               { icon: 'notifications',       color: 'text-primary'     },
};

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);

  // Fetch stored notifications on login
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationApi.getAll();
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {
      // silently fail
    }
  }, []);

  // Connect socket when user is logged in
  useEffect(() => {
    if (!user) {
      // Disconnect if logged out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications();

    const socket = io('http://localhost:5000');
    socketRef.current = socket;
    setSocket(socket);

    socket.on('connect', () => {
      socket.emit('join', user._id || user.id);
    });

    socket.on('notification', (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((c) => c + 1);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [user]);

  const markRead = useCallback(async (id) => {
    try {
      await notificationApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* ignore */ }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  }, []);

  return (
    <SocketContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, fetchNotifications, socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
