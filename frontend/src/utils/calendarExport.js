/**
 * Generates and downloads an .ics calendar file for a given event.
 * Works with Google Calendar, Apple Calendar, Outlook, and any calendar app.
 */

function parseStartTime(timeStr) {
  if (!timeStr) return { hours: 10, minutes: 0 };

  // Handle range like "10:00 AM - 2:00 PM" → take first part
  const startPart = timeStr.split('-')[0].trim();

  // 12-hour: "10:30 AM", "2:00 PM"
  const match12 = startPart.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const period = match12[3].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return { hours, minutes };
  }

  // 24-hour: "14:30", "09:00"
  const match24 = startPart.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    return { hours: parseInt(match24[1], 10), minutes: parseInt(match24[2], 10) };
  }

  return { hours: 10, minutes: 0 };
}

function formatICSDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    date.getFullYear() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    'T' +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    '00'
  );
}

function escapeICS(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function buildGoogleCalendarUrl(event) {
  const eventDate = new Date(event.date);
  const { hours, minutes } = parseStartTime(event.time);

  const startDate = new Date(eventDate);
  startDate.setHours(hours, minutes, 0, 0);

  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 2);

  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (d) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

  const clubName = event.clubName || event.club?.name || 'Club';
  const details = [
    event.description || '',
    `Organized by: ${clubName}`,
    event.time ? `Time: ${event.time}` : '',
  ].filter(Boolean).join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title || 'Event',
    dates: `${fmt(startDate)}/${fmt(endDate)}`,
    details,
    location: event.venue || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadICS(event) {
  const eventDate = new Date(event.date);
  const { hours, minutes } = parseStartTime(event.time);

  const startDate = new Date(eventDate);
  startDate.setHours(hours, minutes, 0, 0);

  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 2); // default 2-hour duration

  const clubName = event.clubName || event.club?.name || 'Club';

  const description = [
    event.description || '',
    `Organized by: ${clubName}`,
    event.time ? `Time: ${event.time}` : '',
  ]
    .filter(Boolean)
    .join('\\n');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ClubHub//Event//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `SUMMARY:${escapeICS(event.title)}`,
    `DTSTART:${formatICSDate(startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `LOCATION:${escapeICS(event.venue)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    `UID:clubhub-${event._id}@clubhub`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = (event.title || 'Event').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);
  link.download = `${safeName}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
