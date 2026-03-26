import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Loader2, Minimize2, Maximize2, Trash2 } from 'lucide-react';
import API from '../../api/chatApi';

const SUGGESTIONS = [
  'How do I join a club?',
  'How to register for an event?',
  'Where is my QR code?',
  'How to download certificate?',
  'How to change language?',
];

function Message({ msg }) {
  const isBot = msg.role === 'assistant';
  return (
    <div className={`flex gap-2.5 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
      {isBot && (
        <div className="h-7 w-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}
      <div
        className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
          isBot
            ? 'bg-card border border-border text-foreground rounded-tl-sm'
            : 'bg-indigo-600 text-white rounded-tr-sm'
        }`}
      >
        {msg.content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2.5">
      <div className="h-7 w-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-tl-sm">
        <div className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm ClubHub Assistant 🤖\nHow can I help you today?" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      inputRef.current?.focus();
    }
  }, [open, minimized, messages]);

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    setInput('');
    setShowSuggestions(false);
    const userMsg = { role: 'user', content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await API.chat(newMessages.filter(m => m.role !== 'system'));
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Sorry, I\'m having trouble connecting. Please try again.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: "Hi! I'm ClubHub Assistant 🤖\nHow can I help you today?" }]);
    setShowSuggestions(true);
  };

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-indigo-600 text-white shadow-2xl hover:bg-indigo-700 transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
          title="ClubHub AI Assistant"
        >
          <Bot className="h-6 w-6" />
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div
          className={`fixed bottom-6 right-6 z-50 w-[360px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
            minimized ? 'h-14' : 'h-[520px]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-indigo-600 text-white shrink-0">
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">ClubHub Assistant</p>
              <p className="text-[10px] text-indigo-200">Powered by Groq · Llama 3.3</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                title="Clear chat"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setMinimized(v => !v)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              >
                {minimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-background">
                {messages.map((msg, i) => <Message key={i} msg={msg} />)}
                {loading && <TypingIndicator />}
                <div ref={bottomRef} />
              </div>

              {/* Suggestions */}
              {showSuggestions && (
                <div className="px-4 pb-2 flex flex-wrap gap-1.5 bg-background">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-xs px-3 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="flex items-end gap-2 px-3 py-3 border-t border-border bg-card shrink-0">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask anything about ClubHub..."
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all max-h-24 overflow-y-auto"
                  style={{ minHeight: '38px' }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
                  }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shrink-0"
                >
                  {loading
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Send className="h-4 w-4" />
                  }
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
