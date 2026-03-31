/**
 * ClubHub — Premium HTML Email Templates
 * All templates are fully responsive, inline-styled for email clients.
 */

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const BRAND = {
  primary: '#4F46E5',       // indigo-600
  primaryDark: '#3730A3',   // indigo-800
  accent: '#818CF8',        // indigo-400
  bg: '#F8F9FF',
  white: '#FFFFFF',
  text: '#1E1B4B',
  muted: '#6B7280',
  border: '#E0E7FF',
  success: '#10B981',
  warning: '#F59E0B',
};

// ── Shared wrapper ────────────────────────────────────────────────────────────
function wrap(content, preheader = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>ClubHub</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bg};font-family:'Segoe UI',Arial,sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:${BRAND.bg};">${preheader}</div>` : ''}

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.bg};padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,${BRAND.primary} 0%,${BRAND.primaryDark} 100%);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <div style="display:inline-flex;align-items:center;gap:10px;">
                    <div style="background:rgba(255,255,255,0.2);border-radius:10px;width:42px;height:42px;display:inline-block;line-height:42px;text-align:center;font-size:22px;">🎓</div>
                    <span style="font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.5px;vertical-align:middle;margin-left:8px;">ClubHub</span>
                  </div>
                  <p style="color:rgba(255,255,255,0.75);font-size:13px;margin:8px 0 0;">College Club & Event Management</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="background:${BRAND.white};padding:0;border-left:1px solid ${BRAND.border};border-right:1px solid ${BRAND.border};">
            ${content}
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#F1F5FF;border-radius:0 0 16px 16px;padding:28px 40px;text-align:center;border:1px solid ${BRAND.border};border-top:none;">
            <p style="color:${BRAND.muted};font-size:12px;margin:0 0 8px;">
              You received this email because you have an account on ClubHub.
            </p>
            <p style="margin:0;">
              <a href="${BASE_URL}" style="color:${BRAND.primary};font-size:12px;text-decoration:none;font-weight:600;">Visit ClubHub</a>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              <a href="${BASE_URL}/login" style="color:${BRAND.primary};font-size:12px;text-decoration:none;font-weight:600;">Login</a>
            </p>
            <p style="color:#9CA3AF;font-size:11px;margin:12px 0 0;">© ${new Date().getFullYear()} ClubHub · All rights reserved</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Reusable section helpers ──────────────────────────────────────────────────
function hero(emoji, title, subtitle) {
  return `
  <div style="padding:40px 40px 24px;text-align:center;">
    <div style="font-size:56px;margin-bottom:16px;">${emoji}</div>
    <h1 style="color:${BRAND.text};font-size:26px;font-weight:800;margin:0 0 10px;letter-spacing:-0.5px;">${title}</h1>
    <p style="color:${BRAND.muted};font-size:15px;line-height:1.6;margin:0;">${subtitle}</p>
  </div>`;
}

function divider() {
  return `<div style="height:1px;background:${BRAND.border};margin:0 40px;"></div>`;
}

function infoRow(label, value) {
  return `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;">
      <span style="color:${BRAND.muted};font-size:13px;font-weight:500;">${label}</span>
    </td>
    <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;text-align:right;">
      <span style="color:${BRAND.text};font-size:13px;font-weight:700;">${value}</span>
    </td>
  </tr>`;
}

function ctaButton(text, url, color = BRAND.primary) {
  return `
  <div style="text-align:center;margin:28px 0;">
    <a href="${url}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;letter-spacing:0.2px;">
      ${text} &rarr;
    </a>
  </div>`;
}

function badge(text, color = BRAND.primary) {
  return `<span style="background:${color}18;color:${color};font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;display:inline-block;">${text}</span>`;
}

// =============================================================================
// 1. WELCOME EMAIL — on student registration
// =============================================================================
function welcomeEmail({ name, email, role = 'student' }) {
  const roleLabel = role === 'leader' ? 'Club Leader' : role === 'admin' ? 'Administrator' : 'Student';
  const content = `
  ${hero('🎉', `Welcome to ClubHub, ${name}!`, 'Your campus club life just got a whole lot easier.')}
  ${divider()}
  <div style="padding:32px 40px;">
    <p style="color:${BRAND.text};font-size:15px;line-height:1.7;margin:0 0 20px;">
      Hi <strong>${name}</strong>, we're thrilled to have you join ClubHub — the all-in-one platform for college clubs and events.
      Your account has been created successfully as a <strong>${roleLabel}</strong>.
    </p>

    <!-- What you can do -->
    <div style="background:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:12px;padding:24px;margin-bottom:24px;">
      <p style="color:${BRAND.primary};font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">What you can do on ClubHub</p>
      ${[
        ['🏛️', 'Browse & join campus clubs', 'Submit membership requests and connect with like-minded students'],
        ['📅', 'Discover & register for events', 'From technical workshops to cultural fests — never miss an event'],
        ['📱', 'Your QR code ticket', 'Get a unique QR for each event and use it for instant attendance'],
        ['🏆', 'Download certificates', 'Earn participation certificates for every event you attend'],
        ['🤖', 'AI Assistant', 'Ask our chatbot anything about ClubHub — available 24/7'],
      ].map(([icon, title, desc]) => `
        <div style="display:flex;align-items:flex-start;margin-bottom:14px;">
          <div style="font-size:20px;margin-right:12px;margin-top:2px;">${icon}</div>
          <div>
            <p style="color:${BRAND.text};font-size:14px;font-weight:700;margin:0 0 2px;">${title}</p>
            <p style="color:${BRAND.muted};font-size:13px;margin:0;">${desc}</p>
          </div>
        </div>`).join('')}
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FF;border:1px solid ${BRAND.border};border-radius:10px;padding:16px;margin-bottom:24px;">
      <tbody>
        ${infoRow('Email', email)}
        ${infoRow('Role', roleLabel)}
        ${infoRow('Platform', 'ClubHub')}
      </tbody>
    </table>

    ${ctaButton('Go to Dashboard', `${BASE_URL}/`)}

    <p style="color:${BRAND.muted};font-size:13px;line-height:1.6;text-align:center;margin:0;">
      Need help? Chat with our AI assistant or contact your club admin.
    </p>
  </div>`;
  return wrap(content, `Welcome to ClubHub, ${name}! Your account is ready.`);
}

// =============================================================================
// 2. PASSWORD RESET EMAIL
// =============================================================================
function passwordResetEmail({ name, resetLink }) {
  const content = `
  ${hero('🔐', 'Reset Your Password', 'We received a request to reset your ClubHub password.')}
  ${divider()}
  <div style="padding:32px 40px;">
    <p style="color:${BRAND.text};font-size:15px;line-height:1.7;margin:0 0 24px;">
      Hi <strong>${name}</strong>, click the button below to reset your password.
      This link is valid for <strong>15 minutes</strong> only.
    </p>

    ${ctaButton('Reset My Password', resetLink, BRAND.primary)}

    <div style="background:#FEF3C7;border:1px solid #FCD34D;border-radius:10px;padding:16px 20px;margin:24px 0;">
      <p style="color:#92400E;font-size:13px;margin:0;line-height:1.6;">
        ⚠️ <strong>Didn't request this?</strong> Ignore this email — your password will remain unchanged.
        If you're concerned about your account security, please contact your administrator.
      </p>
    </div>

    <p style="color:${BRAND.muted};font-size:13px;line-height:1.6;">
      If the button doesn't work, copy and paste this link into your browser:<br/>
      <a href="${resetLink}" style="color:${BRAND.primary};word-break:break-all;font-size:12px;">${resetLink}</a>
    </p>
  </div>`;
  return wrap(content, `Reset your ClubHub password — link expires in 15 minutes.`);
}

// =============================================================================
// 3. LEADER APPOINTMENT EMAIL
// =============================================================================
function leaderAppointedEmail({ name, clubName }) {
  const content = `
  ${hero('👑', `Congratulations, ${name}!`, `You've been appointed as Club Leader of ${clubName}.`)}
  ${divider()}
  <div style="padding:32px 40px;">
    <p style="color:${BRAND.text};font-size:15px;line-height:1.7;margin:0 0 20px;">
      Hi <strong>${name}</strong>, the admin has appointed you as the <strong>Club Leader</strong> of
      <strong>${clubName}</strong>. You now have full leadership access on ClubHub.
    </p>

    <div style="background:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:12px;padding:24px;margin-bottom:24px;">
      <p style="color:${BRAND.primary};font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">Your Leader Capabilities</p>
      ${[
        ['📢', 'Create & manage events', 'Submit events for admin approval, upload posters, set capacity'],
        ['👥', 'Manage memberships', 'Review and approve/reject student membership requests'],
        ['📷', 'Mark attendance', 'Scan student QR codes to mark real-time attendance'],
        ['⭐', 'View feedback', 'See aggregated star ratings and reviews from event attendees'],
        ['💬', 'Club chat', 'Communicate with all club members in real time'],
      ].map(([icon, title, desc]) => `
        <div style="display:flex;align-items:flex-start;margin-bottom:14px;">
          <div style="font-size:20px;margin-right:12px;margin-top:2px;">${icon}</div>
          <div>
            <p style="color:${BRAND.text};font-size:14px;font-weight:700;margin:0 0 2px;">${title}</p>
            <p style="color:${BRAND.muted};font-size:13px;margin:0;">${desc}</p>
          </div>
        </div>`).join('')}
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:16px;margin-bottom:24px;">
      <tbody>
        ${infoRow('Club', clubName)}
        ${infoRow('Your Role', 'Club Leader')}
        ${infoRow('Access Level', 'Full Leadership Access')}
      </tbody>
    </table>

    ${ctaButton('Go to Leader Dashboard', `${BASE_URL}/leader/dashboard`, BRAND.success)}

    <p style="color:${BRAND.muted};font-size:13px;line-height:1.6;text-align:center;margin:0;">
      Congratulations again! Make <strong>${clubName}</strong> the best club on campus. 🚀
    </p>
  </div>`;
  return wrap(content, `You're now the Leader of ${clubName} on ClubHub!`);
}

// =============================================================================
// 4. EVENT REGISTRATION CONFIRMATION (with QR)
// =============================================================================
function eventRegistrationEmail({ studentName, eventTitle, eventDate, eventTime, venue, clubName, qrCodeUrl, isPaid = false, amount = 0 }) {
  const formattedDate = eventDate ? new Date(eventDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : eventDate;
  const content = `
  ${hero('🎟️', 'You\'re Registered!', `Your spot is confirmed for <strong>${eventTitle}</strong>`)}
  ${divider()}
  <div style="padding:32px 40px;">
    <p style="color:${BRAND.text};font-size:15px;line-height:1.7;margin:0 0 24px;">
      Hi <strong>${studentName}</strong>, your registration for <strong>${eventTitle}</strong> is confirmed.
      ${isPaid ? `Payment of <strong>₹${amount}</strong> received successfully.` : 'Your seat has been reserved.'}
      See you there!
    </p>

    <!-- Event Details Card -->
    <div style="background:linear-gradient(135deg,${BRAND.primary}08 0%,${BRAND.accent}10 100%);border:1px solid ${BRAND.border};border-radius:14px;overflow:hidden;margin-bottom:24px;">
      <div style="background:${BRAND.primary};padding:12px 20px;">
        <p style="color:#fff;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0;">Event Details</p>
      </div>
      <div style="padding:20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tbody>
            ${infoRow('📅 Date', formattedDate)}
            ${infoRow('⏰ Time', eventTime)}
            ${infoRow('📍 Venue', venue)}
            ${clubName ? infoRow('🏛️ Club', clubName) : ''}
            ${isPaid ? infoRow('💳 Payment', `₹${amount} — Confirmed`) : infoRow('🎫 Entry', 'Free')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- QR Code -->
    ${qrCodeUrl ? `
    <div style="text-align:center;background:${BRAND.bg};border:2px dashed ${BRAND.border};border-radius:14px;padding:28px;margin-bottom:24px;">
      <p style="color:${BRAND.primary};font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">Your Attendance QR Code</p>
      <img src="${qrCodeUrl}" alt="QR Code" width="180" height="180" style="border-radius:10px;border:4px solid ${BRAND.white};box-shadow:0 4px 20px rgba(79,70,229,0.15);"/>
      <p style="color:${BRAND.muted};font-size:13px;margin:16px 0 0;line-height:1.6;">
        Show this QR code to the event leader for attendance.<br/>
        You can also find it in <strong>My Events → Registered</strong>.
      </p>
    </div>` : ''}

    <!-- Reminder Notice -->
    <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <p style="color:#1D4ED8;font-size:13px;margin:0;line-height:1.6;">
        🔔 <strong>Reminder:</strong> You'll receive an automated reminder email 24 hours before the event with venue details and your QR code.
      </p>
    </div>

    ${ctaButton('View My Events', `${BASE_URL}/student/my-events`)}
  </div>`;
  return wrap(content, `Registered for ${eventTitle} — ${formattedDate}`);
}

// =============================================================================
// 5. PRE-EVENT REMINDER (24h before)
// =============================================================================
function eventReminderEmail({ studentName, eventTitle, eventDate, eventTime, venue, clubName, qrCodeUrl, hoursUntil = 24 }) {
  const formattedDate = eventDate ? new Date(eventDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : eventDate;
  const urgencyColor = hoursUntil <= 2 ? '#EF4444' : hoursUntil <= 24 ? BRAND.warning : BRAND.primary;
  const urgencyLabel = hoursUntil <= 2 ? `Starts in ${hoursUntil}h!` : hoursUntil <= 24 ? 'Tomorrow!' : `In ${Math.round(hoursUntil/24)} days`;
  const content = `
  ${hero('⏰', `Event Reminder — ${urgencyLabel}`, `${eventTitle} is coming up. Don't forget your QR code!`)}
  ${divider()}
  <div style="padding:32px 40px;">

    <!-- Countdown Badge -->
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;background:${urgencyColor}18;border:2px solid ${urgencyColor}40;border-radius:50px;padding:10px 24px;">
        <span style="color:${urgencyColor};font-size:18px;font-weight:800;">⏳ ${urgencyLabel}</span>
      </div>
    </div>

    <p style="color:${BRAND.text};font-size:15px;line-height:1.7;margin:0 0 24px;">
      Hi <strong>${studentName}</strong>, this is your reminder that <strong>${eventTitle}</strong> is happening
      <strong>${hoursUntil <= 24 ? 'tomorrow' : `in ${Math.round(hoursUntil/24)} days`}</strong>.
      Make sure you're there on time!
    </p>

    <!-- Event Card -->
    <div style="background:linear-gradient(135deg,#1E1B4B 0%,#312E81 100%);border-radius:14px;padding:24px;margin-bottom:24px;color:#fff;">
      <p style="font-size:18px;font-weight:800;margin:0 0 16px;letter-spacing:-0.3px;">${eventTitle}</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;"><span style="color:rgba(255,255,255,0.6);font-size:13px;">📅 Date</span></td>
          <td style="text-align:right;padding:6px 0;"><span style="color:#fff;font-size:13px;font-weight:600;">${formattedDate}</span></td>
        </tr>
        <tr>
          <td style="padding:6px 0;"><span style="color:rgba(255,255,255,0.6);font-size:13px;">⏰ Time</span></td>
          <td style="text-align:right;padding:6px 0;"><span style="color:#fff;font-size:13px;font-weight:600;">${eventTime}</span></td>
        </tr>
        <tr>
          <td style="padding:6px 0;"><span style="color:rgba(255,255,255,0.6);font-size:13px;">📍 Venue</span></td>
          <td style="text-align:right;padding:6px 0;"><span style="color:#A5B4FC;font-size:13px;font-weight:600;">${venue}</span></td>
        </tr>
        ${clubName ? `<tr>
          <td style="padding:6px 0;"><span style="color:rgba(255,255,255,0.6);font-size:13px;">🏛️ Club</span></td>
          <td style="text-align:right;padding:6px 0;"><span style="color:#fff;font-size:13px;font-weight:600;">${clubName}</span></td>
        </tr>` : ''}
      </table>
    </div>

    <!-- QR Code reminder -->
    ${qrCodeUrl ? `
    <div style="text-align:center;background:${BRAND.bg};border:2px dashed ${BRAND.border};border-radius:14px;padding:24px;margin-bottom:24px;">
      <p style="color:${BRAND.primary};font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">Your QR Code — Show at Entry</p>
      <img src="${qrCodeUrl}" alt="Attendance QR" width="160" height="160" style="border-radius:10px;border:3px solid ${BRAND.white};box-shadow:0 4px 20px rgba(79,70,229,0.15);"/>
      <p style="color:${BRAND.muted};font-size:12px;margin:10px 0 0;">Or find it in My Events → Registered tab</p>
    </div>` : ''}

    <!-- Checklist -->
    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <p style="color:#065F46;font-size:13px;font-weight:700;margin:0 0 10px;">✅ Pre-event Checklist</p>
      ${['Carry your college ID card','Show your QR code at the entrance','Arrive 10 minutes early','Bring a notebook if it\'s a workshop'].map(item =>
        `<p style="color:#047857;font-size:13px;margin:4px 0;">☑ ${item}</p>`
      ).join('')}
    </div>

    ${ctaButton('View Event Details', `${BASE_URL}/student/my-events`, urgencyColor)}
  </div>`;
  return wrap(content, `Reminder: ${eventTitle} is ${urgencyLabel} — ${formattedDate} at ${eventTime}`);
}

// =============================================================================
// 6. ATTENDANCE CONFIRMATION
// =============================================================================
function attendanceConfirmationEmail({ studentName, eventTitle, eventDate, venue, attendedAt, clubName }) {
  const formattedDate = eventDate ? new Date(eventDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : eventDate;
  const formattedTime = attendedAt ? new Date(attendedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
  const content = `
  ${hero('✅', 'Attendance Marked!', `Your attendance for <strong>${eventTitle}</strong> has been confirmed.`)}
  ${divider()}
  <div style="padding:32px 40px;">
    <p style="color:${BRAND.text};font-size:15px;line-height:1.7;margin:0 0 24px;">
      Hi <strong>${studentName}</strong>, your attendance at <strong>${eventTitle}</strong> has been successfully marked.
      A participation certificate is now available for download!
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:16px;margin-bottom:24px;">
      <tbody>
        ${infoRow('📅 Event Date', formattedDate)}
        ${infoRow('📍 Venue', venue)}
        ${clubName ? infoRow('🏛️ Club', clubName) : ''}
        ${formattedTime ? infoRow('⏱️ Checked-in At', formattedTime) : ''}
        ${infoRow('📋 Status', '✅ Attended')}
      </tbody>
    </table>

    <!-- Certificate CTA -->
    <div style="background:linear-gradient(135deg,#F59E0B08,#FCD34D18);border:2px solid #FCD34D;border-radius:14px;padding:24px;text-align:center;margin-bottom:24px;">
      <div style="font-size:48px;margin-bottom:8px;">🏆</div>
      <p style="color:#92400E;font-size:16px;font-weight:800;margin:0 0 6px;">Your Certificate is Ready!</p>
      <p style="color:#78350F;font-size:13px;margin:0 0 16px;line-height:1.6;">Download your participation certificate from the My Events → Attended tab.</p>
      ${ctaButton('Download Certificate', `${BASE_URL}/student/my-events`, BRAND.warning)}
    </div>

    <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:16px 20px;">
      <p style="color:#1D4ED8;font-size:13px;margin:0;line-height:1.6;">
        ⭐ <strong>Enjoyed the event?</strong> Share your feedback and rate the event from My Events → Attended tab. Your review helps organizers improve future events!
      </p>
    </div>
  </div>`;
  return wrap(content, `Attendance confirmed for ${eventTitle} — Certificate available now!`);
}

// =============================================================================
// 7. PAYMENT SUCCESS EMAIL
// =============================================================================
function paymentSuccessEmail({ studentName, eventTitle, eventDate, eventTime, venue, amount, paymentId, qrCodeUrl }) {
  const formattedDate = eventDate ? new Date(eventDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : eventDate;
  const content = `
  ${hero('💳', 'Payment Successful!', `₹${amount} paid for <strong>${eventTitle}</strong>`)}
  ${divider()}
  <div style="padding:32px 40px;">
    <p style="color:${BRAND.text};font-size:15px;line-height:1.7;margin:0 0 24px;">
      Hi <strong>${studentName}</strong>, your payment was successful and your registration is confirmed.
    </p>

    <!-- Receipt -->
    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:14px;overflow:hidden;margin-bottom:24px;">
      <div style="background:${BRAND.success};padding:12px 20px;">
        <p style="color:#fff;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0;">Payment Receipt</p>
      </div>
      <div style="padding:20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tbody>
            ${infoRow('🎟️ Event', eventTitle)}
            ${infoRow('📅 Date', formattedDate)}
            ${infoRow('⏰ Time', eventTime)}
            ${infoRow('📍 Venue', venue)}
            ${infoRow('💰 Amount Paid', `₹${amount}`)}
            ${paymentId ? infoRow('🔖 Payment ID', `<code style="font-size:11px;">${paymentId}</code>`) : ''}
            ${infoRow('✅ Status', 'Confirmed')}
          </tbody>
        </table>
      </div>
    </div>

    ${qrCodeUrl ? `
    <div style="text-align:center;background:${BRAND.bg};border:2px dashed ${BRAND.border};border-radius:14px;padding:24px;margin-bottom:24px;">
      <p style="color:${BRAND.primary};font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">Your Entry QR Code</p>
      <img src="${qrCodeUrl}" alt="QR Code" width="160" height="160" style="border-radius:10px;box-shadow:0 4px 20px rgba(79,70,229,0.15);"/>
    </div>` : ''}

    ${ctaButton('View My Events', `${BASE_URL}/student/my-events`, BRAND.success)}
  </div>`;
  return wrap(content, `Payment of ₹${amount} confirmed for ${eventTitle}`);
}

// =============================================================================
// 8. MEMBERSHIP APPROVED EMAIL
// =============================================================================
function membershipApprovedEmail({ studentName, clubName, leaderName }) {
  const content = `
  ${hero('🎊', 'Membership Approved!', `Welcome to <strong>${clubName}</strong>!`)}
  ${divider()}
  <div style="padding:32px 40px;">
    <p style="color:${BRAND.text};font-size:15px;line-height:1.7;margin:0 0 24px;">
      Hi <strong>${studentName}</strong>, great news! Your membership request for
      <strong>${clubName}</strong> has been approved by ${leaderName ? `<strong>${leaderName}</strong>` : 'the club leader'}.
      You're officially a member now! 🎉
    </p>

    <div style="background:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:12px;padding:24px;margin-bottom:24px;">
      <p style="color:${BRAND.primary};font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">You now have access to</p>
      ${[
        ['💬', 'Club Chat', 'Real-time messaging with all club members'],
        ['📅', 'Club-Only Events', 'Exclusive events visible only to club members'],
        ['📢', 'Club Announcements', 'Get notified about all club activities'],
      ].map(([icon, title, desc]) => `
        <div style="display:flex;margin-bottom:12px;">
          <div style="font-size:18px;margin-right:12px;">${icon}</div>
          <div>
            <p style="color:${BRAND.text};font-size:14px;font-weight:700;margin:0 0 2px;">${title}</p>
            <p style="color:${BRAND.muted};font-size:13px;margin:0;">${desc}</p>
          </div>
        </div>`).join('')}
    </div>

    ${ctaButton('Open Club Chat', `${BASE_URL}/student/clubs`, BRAND.success)}
  </div>`;
  return wrap(content, `Your membership to ${clubName} is approved!`);
}

module.exports = {
  welcomeEmail,
  passwordResetEmail,
  leaderAppointedEmail,
  eventRegistrationEmail,
  eventReminderEmail,
  attendanceConfirmationEmail,
  paymentSuccessEmail,
  membershipApprovedEmail,
};
