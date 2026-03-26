// src/pages/ClubChat.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import clubsApi from '../api/clubsApi';
import DashboardLayout from '../components/layout/DashboardLayout';
import { ArrowLeft, Pin, Send, ChevronDown, Users, Loader2, Crown, Smile, Paperclip, X, FileText, Download, ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🎉', '🔥', '👏'];

const EMOJI_GRID = [
  '😀','😁','😂','🤣','😊','😍','🥰','😘','😎','🤩',
  '😢','😭','😤','😡','🤔','🤗','😴','🥳','🤯','😱',
  '👍','👎','👏','🙌','🤝','🤞','✌️','🫶','💪','🙏',
  '❤️','🧡','💛','💚','💙','💜','🖤','🤍','💔','💯',
  '🔥','✨','🎉','🎊','🎈','🏆','🥇','⭐','💡','🚀',
  '😴','🤢','🥺','🫡','🤭','😏','🫠','🥸','🤓','😬',
];

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function getAvatarColor(name = '') {
  const colors = ['bg-indigo-500', 'bg-teal-500', 'bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-purple-500', 'bg-blue-500', 'bg-orange-500'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function timeAgo(date) {
  const d = new Date(date);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function dateSeparator(date) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function shouldShowSeparator(messages, index) {
  if (index === 0) return true;
  const prev = new Date(messages[index - 1].createdAt);
  const curr = new Date(messages[index].createdAt);
  return prev.toDateString() !== curr.toDateString();
}

function isGrouped(messages, index) {
  if (index === 0) return false;
  const prev = messages[index - 1];
  const curr = messages[index];
  if (prev.sender._id !== curr.sender._id) return false;
  const diff = new Date(curr.createdAt) - new Date(prev.createdAt);
  return diff < 5 * 60 * 1000;
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ClubChat() {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [messages, setMessages] = useState([]);
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [clubInfo, setClubInfo] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const [hoveredMsg, setHoveredMsg] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // File attachment state
  const [pendingFile, setPendingFile] = useState(null); // { file, preview, type }
  const [uploading, setUploading] = useState(false);

  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const typingRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const { t } = useTranslation();
  const myId = user?._id || user?.id;
  const isLeader = clubInfo?.leader?._id === myId || clubInfo?.leader?.toString() === myId;

  // Fetch messages on mount
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await clubsApi.getMessages(clubId);
        setMessages(res.data.messages || []);
        setPinnedMessage(res.data.pinnedMessage || null);
        setClubInfo(res.data.club || null);
        setHasMore(res.data.hasMore);
      } catch {
        // access denied or error
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [clubId]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!loading) setTimeout(() => scrollToBottom('auto'), 100);
  }, [loading]);

  // Close emoji picker on outside click
  useEffect(() => {
    const handler = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Socket setup — re-join on reconnect to fix real-time updates
  useEffect(() => {
    if (!socket || !user) return;

    const joinRoom = () => {
      console.log('[ClubChat] joining room', clubId, 'connected=', socket.connected);
      socket.emit('join_club_chat', { clubId, userId: myId, name: user?.name });
    };

    // Always emit immediately — socket.io buffers if not yet connected
    // Also re-join on every reconnect
    joinRoom();
    socket.on('connect', joinRoom);

    const onMessage = (msg) => {
      console.log('[ClubChat] received club_message', msg._id);
      setMessages((prev) => {
        // Deduplicate: if already added optimistically, skip
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      if (isAtBottomRef.current) {
        setTimeout(() => scrollToBottom('smooth'), 50);
      } else {
        setNewCount((c) => c + 1);
      }
    };

    const onOnlineUsers = (users) => setOnlineUsers(users);

    const onTyping = ({ name }) => {
      setTypingUsers((prev) => (prev.includes(name) ? prev : [...prev, name]));
      clearTimeout(typingRef.current);
      typingRef.current = setTimeout(() => setTypingUsers([]), 3000);
    };

    const onStopTyping = () => setTypingUsers([]);

    const onReaction = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
      );
    };

    const onPin = ({ message, isPinned }) => {
      setPinnedMessage(isPinned ? message : null);
      setMessages((prev) =>
        prev.map((m) => (m._id === message._id ? { ...m, isPinned } : m))
      );
    };

    socket.on('club_message', onMessage);
    socket.on('club_online_users', onOnlineUsers);
    socket.on('club_typing', onTyping);
    socket.on('club_stop_typing', onStopTyping);
    socket.on('club_reaction', onReaction);
    socket.on('club_pin', onPin);

    return () => {
      socket.emit('leave_club_chat', { clubId });
      socket.off('connect', joinRoom);
      socket.off('club_message', onMessage);
      socket.off('club_online_users', onOnlineUsers);
      socket.off('club_typing', onTyping);
      socket.off('club_stop_typing', onStopTyping);
      socket.off('club_reaction', onReaction);
      socket.off('club_pin', onPin);
    };
  }, [socket, clubId, myId]); // eslint-disable-line react-hooks/exhaustive-deps

  function scrollToBottom(behavior = 'smooth') {
    bottomRef.current?.scrollIntoView({ behavior });
    setNewCount(0);
  }

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    isAtBottomRef.current = atBottom;
    setShowScrollBtn(!atBottom);
    if (atBottom) setNewCount(0);
    if (el.scrollTop < 80 && hasMore && !loadingMore) loadMore();
  }

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    try {
      const oldest = messages[0]?.createdAt;
      const res = await clubsApi.getMessages(clubId, { before: oldest });
      const older = res.data.messages || [];
      const prevHeight = containerRef.current?.scrollHeight;
      setMessages((prev) => [...older, ...prev]);
      setHasMore(res.data.hasMore);
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight - prevHeight;
        }
      }, 0);
    } catch { /* ignore */ } finally {
      setLoadingMore(false);
    }
  }, [clubId, hasMore, loadingMore, messages]);

  const handleSend = async () => {
    const text = input.trim();
    if ((!text && !pendingFile) || sending || uploading) return;

    setSending(true);
    socket?.emit('club_stop_typing', { clubId });
    setInput('');
    setShowEmojiPicker(false);

    try {
      let attachment = null;

      if (pendingFile) {
        setUploading(true);
        const uploadRes = await clubsApi.uploadAttachment(clubId, pendingFile.file);
        attachment = uploadRes.data;
        setPendingFile(null);
        setUploading(false);
      }

      const res = await clubsApi.sendMessage(clubId, text, attachment);
      const sent = res.data.message;

      // Optimistic update — show immediately for the sender
      setMessages((prev) => {
        if (prev.some((m) => m._id === sent._id)) return prev;
        return [...prev, sent];
      });
      setTimeout(() => scrollToBottom('smooth'), 50);
    } catch {
      /* ignore */
    } finally {
      setSending(false);
      setUploading(false);
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = '44px';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!socket) return;
    socket.emit('club_typing', { clubId, name: user?.name });
    clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => {
      socket.emit('club_stop_typing', { clubId });
    }, 2000);
  };

  const handleEmojiInsert = (emoji) => {
    const ta = textareaRef.current;
    if (!ta) {
      setInput((prev) => prev + emoji);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newVal = input.slice(0, start) + emoji + input.slice(end);
    setInput(newVal);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const preview = isImage ? URL.createObjectURL(file) : null;
    setPendingFile({ file, preview, type: isImage ? 'image' : 'document', name: file.name, size: file.size });
    e.target.value = '';
  };

  const handleReact = async (messageId, emoji) => {
    try {
      await clubsApi.toggleReaction(clubId, messageId, emoji);
    } catch { /* ignore */ }
  };

  const handlePin = async (messageId) => {
    try {
      await clubsApi.pinMessage(clubId, messageId);
    } catch { /* ignore */ }
  };

  const onlineIds = new Set(onlineUsers.map((u) => u.userId));
  const allMembers = clubInfo ? [
    ...(clubInfo.leader ? [{ ...clubInfo.leader, isLeader: true }] : []),
    ...(clubInfo.members || []).filter((m) => m._id !== clubInfo.leader?._id),
  ] : [];

  const canSend = (input.trim() || pendingFile) && !sending && !uploading;

  return (
    <DashboardLayout title={clubInfo?.name || 'Club Chat'}>
      <div className="flex h-[calc(100vh-4rem)] -m-6 overflow-hidden">

        {/* ── Main Chat Area ── */}
        <div className="flex flex-col flex-1 min-w-0 bg-background">

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className={`h-10 w-10 rounded-xl ${getAvatarColor(clubInfo?.name)} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
              {getInitials(clubInfo?.name)}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-foreground text-base leading-tight truncate">
                {clubInfo?.name || '...'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {allMembers.length} members •{' '}
                <span className="text-emerald-500 font-medium">{onlineUsers.length} online</span>
              </p>
            </div>

            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
              title="Toggle members"
            >
              <Users className="h-5 w-5" />
            </button>
          </div>

          {/* Pinned Message */}
          {pinnedMessage && (
            <div className="flex items-start gap-2 px-4 py-2 bg-primary/5 border-b border-primary/10 text-sm shrink-0">
              <Pin className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0">
                <span className="text-primary font-semibold text-xs">Pinned · {pinnedMessage.sender?.name}</span>
                <p className="text-foreground truncate">{pinnedMessage.content || (pinnedMessage.attachment?.name)}</p>
              </div>
            </div>
          )}

          {/* Messages */}
          <div
            ref={containerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5 scroll-smooth"
          >
            {loadingMore && (
              <div className="flex justify-center py-2">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <div className="text-5xl mb-4">💬</div>
                <p className="font-medium text-lg">{t('chat.no_messages')}</p>
                <p className="text-sm mt-1">{t('chat.start_conversation')}</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMine = msg.sender?._id === myId || msg.sender?._id?.toString() === myId;
                const grouped = isGrouped(messages, idx);
                const showSep = shouldShowSeparator(messages, idx);
                const senderIsLeader = msg.sender?.role === 'leader' || msg.sender?._id === clubInfo?.leader?._id;

                return (
                  <React.Fragment key={msg._id}>
                    {/* Date separator */}
                    {showSep && (
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-muted-foreground font-medium px-2">
                          {dateSeparator(msg.createdAt)}
                        </span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                    )}

                    {/* Message row */}
                    <div
                      className={`flex items-end gap-2 group ${isMine ? 'flex-row-reverse' : 'flex-row'} ${grouped ? 'mt-0.5' : 'mt-3'}`}
                      onMouseEnter={() => setHoveredMsg(msg._id)}
                      onMouseLeave={() => setHoveredMsg(null)}
                    >
                      {/* Avatar */}
                      <div className={`shrink-0 ${grouped ? 'w-8 opacity-0' : 'w-8'}`}>
                        {!grouped && (
                          <div className={`relative h-8 w-8 rounded-full ${getAvatarColor(msg.sender?.name)} flex items-center justify-center text-white text-xs font-bold`}>
                            {getInitials(msg.sender?.name)}
                            {senderIsLeader && (
                              <Crown className="absolute -top-1.5 -right-1 h-3 w-3 text-amber-400 drop-shadow" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Bubble + actions */}
                      <div className={`flex flex-col max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
                        {/* Sender name */}
                        {!grouped && !isMine && (
                          <span className="text-xs text-muted-foreground font-semibold mb-1 ml-1">
                            {msg.sender?.name}
                            {senderIsLeader && <span className="ml-1 text-amber-500">· {t('chat.leader')}</span>}
                          </span>
                        )}

                        {/* Bubble */}
                        <div className="relative">
                          <div
                            className={`relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm
                              ${isMine
                                ? 'bg-primary text-primary-foreground rounded-br-sm'
                                : 'bg-card border border-border text-foreground rounded-bl-sm'
                              }`}
                          >
                            {/* Attachment rendering */}
                            {msg.attachment?.url && (
                              <div className="mb-2">
                                {msg.attachment.type === 'image' ? (
                                  <img
                                    src={msg.attachment.url}
                                    alt={msg.attachment.name}
                                    className="max-w-xs max-h-60 rounded-xl object-cover cursor-pointer"
                                    onClick={() => window.open(msg.attachment.url, '_blank')}
                                  />
                                ) : (
                                  <a
                                    href={msg.attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${isMine ? 'border-white/20 hover:bg-white/10' : 'border-border hover:bg-muted'}`}
                                  >
                                    <FileText className="h-5 w-5 shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium truncate">{msg.attachment.name}</p>
                                      <p className="text-[10px] opacity-70">{formatFileSize(msg.attachment.size)}</p>
                                    </div>
                                    <Download className="h-4 w-4 shrink-0 opacity-70" />
                                  </a>
                                )}
                              </div>
                            )}
                            {msg.content}
                          </div>

                          {/* Hover toolbar */}
                          {hoveredMsg === msg._id && (
                            <div
                              className={`absolute -top-8 flex items-center gap-1 bg-card border border-border rounded-lg shadow-md px-1.5 py-1 z-10 ${isMine ? 'right-0' : 'left-0'}`}
                            >
                              {QUICK_EMOJIS.map((e) => (
                                <button
                                  key={e}
                                  onClick={() => handleReact(msg._id, e)}
                                  className="text-base hover:scale-125 transition-transform p-0.5"
                                  title={e}
                                >
                                  {e}
                                </button>
                              ))}
                              {isLeader && (
                                <button
                                  onClick={() => handlePin(msg._id)}
                                  className={`p-1 rounded hover:bg-muted transition-colors ml-1 ${msg.isPinned ? 'text-primary' : 'text-muted-foreground'}`}
                                  title={msg.isPinned ? t('chat.unpin') : t('chat.pin_message')}
                                >
                                  <Pin className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Reactions */}
                        {msg.reactions?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {msg.reactions.map((r) => {
                              const reacted = r.users.some((u) => u === myId || u.toString?.() === myId);
                              return (
                                <button
                                  key={r.emoji}
                                  onClick={() => handleReact(msg._id, r.emoji)}
                                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all
                                    ${reacted
                                      ? 'bg-primary/10 border-primary/30 text-primary'
                                      : 'bg-muted border-border text-muted-foreground hover:border-primary/30'
                                    }`}
                                  title={`${r.users.length} reaction${r.users.length > 1 ? 's' : ''}`}
                                >
                                  {r.emoji} {r.users.length}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Timestamp */}
                        <span className={`text-[10px] text-muted-foreground mt-0.5 ${isMine ? 'mr-1' : 'ml-1'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                          {timeAgo(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )}

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="flex items-end gap-2 mt-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                  ···
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">
                      {typingUsers.join(', ')} {typingUsers.length > 1 ? t('chat.typing_plural') : t('chat.typing')}
                    </span>
                    <div className="flex gap-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Scroll to bottom button */}
          {showScrollBtn && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20">
              <button
                onClick={() => scrollToBottom('smooth')}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg text-sm font-medium hover:bg-primary/90 transition-all"
              >
                <ChevronDown className="h-4 w-4" />
                {newCount > 0 ? `${newCount} ${newCount > 1 ? t('chat.new_messages') : t('chat.new_message')}` : t('chat.scroll_bottom')}
              </button>
            </div>
          )}

          {/* Input Area */}
          <div className="shrink-0 border-t border-border bg-card px-4 py-3">

            {/* Pending file preview */}
            {pendingFile && (
              <div className="flex items-center gap-2 mb-2 p-2 rounded-xl bg-muted border border-border">
                {pendingFile.type === 'image' ? (
                  <img src={pendingFile.preview} alt="preview" className="h-10 w-10 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{pendingFile.name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatFileSize(pendingFile.size)}</p>
                </div>
                <button
                  onClick={() => setPendingFile(null)}
                  className="p-1 rounded-full hover:bg-muted-foreground/20 transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            )}

            {/* Emoji picker popover */}
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="mb-2 p-3 rounded-2xl border border-border bg-card shadow-xl grid grid-cols-10 gap-1"
              >
                {EMOJI_GRID.map((e) => (
                  <button
                    key={e}
                    onClick={() => handleEmojiInsert(e)}
                    className="text-xl hover:scale-125 transition-transform p-0.5 rounded"
                    title={e}
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2">
              {/* File picker */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl hover:bg-muted transition-colors text-muted-foreground shrink-0"
                title={t('chat.attach_file')}
              >
                <Paperclip className="h-5 w-5" />
              </button>

              {/* Emoji button */}
              <button
                onClick={() => setShowEmojiPicker((v) => !v)}
                className={`p-2.5 rounded-xl hover:bg-muted transition-colors shrink-0 ${showEmojiPicker ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
                title={t('chat.emoji')}
              >
                <Smile className="h-5 w-5" />
              </button>

              {/* Textarea */}
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={t('chat.type_message')}
                  rows={1}
                  className="w-full resize-none rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all max-h-32 overflow-y-auto"
                  style={{ minHeight: '44px' }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                  }}
                />
              </div>

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={!canSend}
                className="h-11 w-11 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shrink-0"
              >
                {sending || uploading
                  ? <Loader2 className="h-5 w-5 animate-spin" />
                  : <Send className="h-5 w-5" />
                }
              </button>
            </div>
          </div>
        </div>

        {/* ── Members Sidebar ── */}
        {sidebarOpen && (
          <div className="w-60 shrink-0 border-l border-border bg-card flex flex-col overflow-hidden hidden md:flex">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('chat.members')}</h3>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
              {/* Online */}
              {onlineUsers.length > 0 && (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 px-1 mb-2">
                    {t('chat.online')} — {onlineUsers.length}
                  </p>
                  {allMembers
                    .filter((m) => onlineIds.has(m._id?.toString() || m._id))
                    .map((m) => (
                      <MemberRow key={m._id} member={m} online clubLeaderId={clubInfo?.leader?._id} />
                    ))}
                  <div className="border-t border-border my-2" />
                </>
              )}

              {/* All members */}
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1 mb-2">
                {t('chat.all_members')} — {allMembers.length}
              </p>
              {allMembers
                .filter((m) => !onlineIds.has(m._id?.toString() || m._id))
                .map((m) => (
                  <MemberRow key={m._id} member={m} online={false} clubLeaderId={clubInfo?.leader?._id} />
                ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function MemberRow({ member, online, clubLeaderId }) {
  const { t } = useTranslation();
  const isLeader = member.isLeader || member._id === clubLeaderId || member._id?.toString() === clubLeaderId?.toString();
  return (
    <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted/60 transition-colors">
      <div className="relative shrink-0">
        <div className={`h-8 w-8 rounded-full ${getAvatarColor(member.name)} flex items-center justify-center text-white text-xs font-bold`}>
          {getInitials(member.name)}
        </div>
        <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card ${online ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-foreground truncate leading-tight">
          {member.name}
        </p>
        {isLeader && (
          <p className="text-[10px] text-amber-500 font-medium flex items-center gap-0.5">
            <Crown className="h-2.5 w-2.5" /> {t('chat.leader')}
          </p>
        )}
      </div>
    </div>
  );
}
