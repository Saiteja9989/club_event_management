import React, { useState, useRef, useEffect } from 'react';
import { CalendarPlus, ChevronDown, ExternalLink, Download } from 'lucide-react';
import { buildGoogleCalendarUrl, downloadICS } from '../../utils/calendarExport';

export default function AddToCalendarButton({ event, size = 'sm', className = '' }) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const btnRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
        width: '208px',
        zIndex: 9999,
      });
    }
    setOpen((v) => !v);
  };

  const sizeClasses = size === 'sm' ? 'text-xs px-3 py-1.5 gap-1.5' : 'text-sm px-4 py-2 gap-2';

  return (
    <div ref={btnRef} className="relative inline-block">
      <button
        onClick={handleToggle}
        className={`flex items-center rounded-md border border-border bg-card hover:bg-muted transition-colors font-medium text-foreground ${sizeClasses} ${className}`}
      >
        <CalendarPlus className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        Add to Calendar
        <ChevronDown className={`${size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} ml-0.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div style={dropdownStyle} className="rounded-lg border border-border bg-card shadow-xl overflow-hidden">
          {/* Google Calendar */}
          <a
            href={buildGoogleCalendarUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors"
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg"
              alt="Google Calendar"
              className="h-4 w-4"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <span className="flex-1 font-medium">Google Calendar</span>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </a>

          <div className="border-t border-border" />

          {/* Download .ics */}
          <button
            onClick={() => { downloadICS(event); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors text-left"
          >
            <Download className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-medium">Download .ics</p>
              <p className="text-xs text-muted-foreground">Outlook, Apple, Samsung…</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
