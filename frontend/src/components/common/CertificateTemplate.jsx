import React from 'react';

// Corner ornament SVG (decorative flourish)
const CornerOrnament = ({ rotate = 0 }) => (
  <svg
    width="72" height="72" viewBox="0 0 72 72"
    style={{ transform: `rotate(${rotate}deg)`, display: 'block' }}
  >
    <path d="M4 4 L4 36 Q4 4 36 4 Z" fill="#c9a035" opacity="0.9" />
    <path d="M4 4 L4 28 Q4 4 28 4 Z" fill="#1a2744" opacity="0.8" />
    <circle cx="8" cy="8" r="3" fill="#c9a035" />
    <circle cx="20" cy="8" r="1.5" fill="#c9a035" opacity="0.7" />
    <circle cx="8" cy="20" r="1.5" fill="#c9a035" opacity="0.7" />
    <path d="M16 4 Q36 4 36 16 Q36 36 4 36 Q4 16 16 4" fill="none" stroke="#c9a035" strokeWidth="1" opacity="0.5" />
  </svg>
);

const DiamondDivider = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0 18px' }}>
    <div style={{ height: '1.5px', flex: 1, maxWidth: '220px', background: 'linear-gradient(to right, transparent, #c9a035)' }} />
    <div style={{ width: '7px', height: '7px', background: '#c9a035', transform: 'rotate(45deg)' }} />
    <div style={{ width: '10px', height: '10px', border: '2px solid #c9a035', transform: 'rotate(45deg)' }} />
    <div style={{ width: '7px', height: '7px', background: '#c9a035', transform: 'rotate(45deg)' }} />
    <div style={{ height: '1.5px', flex: 1, maxWidth: '220px', background: 'linear-gradient(to left, transparent, #c9a035)' }} />
  </div>
);

const CertificateTemplate = React.forwardRef(({ data, certId }, ref) => {
  const formattedDate = data?.eventDate
    ? new Date(data.eventDate).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '';

  const issuedDate = data?.attendedAt
    ? new Date(data.attendedAt).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '';

  return (
    <div
      ref={ref}
      style={{
        width: '1123px',
        height: '794px',
        background: '#fffef7',
        fontFamily: "'Georgia', 'Times New Roman', serif",
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Outer navy border */}
      <div style={{
        position: 'absolute', inset: '14px',
        border: '4px solid #1a2744',
        pointerEvents: 'none', zIndex: 2,
      }} />

      {/* Inner gold border */}
      <div style={{
        position: 'absolute', inset: '24px',
        border: '1.5px solid #c9a035',
        pointerEvents: 'none', zIndex: 2,
      }} />

      {/* Gold accent line (second inner) */}
      <div style={{
        position: 'absolute', inset: '28px',
        border: '0.5px solid #c9a03550',
        pointerEvents: 'none', zIndex: 2,
      }} />

      {/* Corner ornaments */}
      <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 3 }}>
        <CornerOrnament rotate={0} />
      </div>
      <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 3 }}>
        <CornerOrnament rotate={90} />
      </div>
      <div style={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 3 }}>
        <CornerOrnament rotate={180} />
      </div>
      <div style={{ position: 'absolute', bottom: '10px', left: '10px', zIndex: 3 }}>
        <CornerOrnament rotate={270} />
      </div>

      {/* Background watermark */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: 0.035, pointerEvents: 'none', zIndex: 1,
        fontSize: '140px', fontWeight: '900', color: '#1a2744',
        transform: 'rotate(-28deg)',
        letterSpacing: '16px',
        userSelect: 'none',
      }}>
        CLUBHUB
      </div>

      {/* Subtle dot pattern background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, #c9a03518 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Main content */}
      <div style={{
        position: 'relative', zIndex: 4,
        height: '100%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '52px 100px 44px',
        textAlign: 'center',
      }}>

        {/* Top header line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
          <div style={{ height: '1px', width: '50px', background: '#c9a035' }} />
          <span style={{ color: '#c9a035', fontSize: '18px', lineHeight: 1 }}>✦</span>
          <span style={{
            fontSize: '11px', letterSpacing: '5px', color: '#1a2744',
            textTransform: 'uppercase', fontFamily: "'Arial', sans-serif", fontWeight: '600',
          }}>
            ClubHub Academic Event System
          </span>
          <span style={{ color: '#c9a035', fontSize: '18px', lineHeight: 1 }}>✦</span>
          <div style={{ height: '1px', width: '50px', background: '#c9a035' }} />
        </div>

        {/* Main title */}
        <h1 style={{
          fontSize: '54px', color: '#1a2744',
          fontWeight: 'normal', margin: '0',
          letterSpacing: '3px',
        }}>
          Certificate of Participation
        </h1>

        <DiamondDivider />

        {/* Presented to */}
        <p style={{
          fontSize: '15px', color: '#666', fontStyle: 'italic',
          marginBottom: '10px', letterSpacing: '1px',
        }}>
          This is to proudly certify that
        </p>

        {/* Student name */}
        <h2 style={{
          fontSize: '46px', color: '#1a2744',
          fontStyle: 'italic', fontWeight: 'bold',
          margin: '0 0 2px 0',
          paddingBottom: '6px', paddingLeft: '24px', paddingRight: '24px',
          borderBottom: '2px solid #c9a035',
          display: 'inline-block',
        }}>
          {data?.studentName}
        </h2>

        {/* Roll number */}
        <p style={{
          fontSize: '12px', color: '#888',
          fontFamily: "'Arial', sans-serif",
          letterSpacing: '3px', textTransform: 'uppercase',
          marginTop: '8px', marginBottom: '16px',
        }}>
          Roll No: {data?.rollNumber}
        </p>

        {/* Body text */}
        <p style={{
          fontSize: '15.5px', color: '#444',
          maxWidth: '720px', lineHeight: '1.85',
        }}>
          has successfully participated in the event{' '}
          <em style={{ color: '#1a2744', fontWeight: 'bold' }}>
            &ldquo;{data?.eventTitle}&rdquo;
          </em>
          {' '}organized by{' '}
          <strong style={{ color: '#1a2744' }}>{data?.clubName}</strong>,
          held on <strong>{formattedDate}</strong> at{' '}
          <strong>{data?.eventVenue}</strong>.
        </p>

        {/* Bottom section: cert ID + seal + signature */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          width: '100%', marginTop: '32px',
        }}>
          {/* Certificate ID (bottom left) */}
          <div style={{ textAlign: 'left' }}>
            <p style={{
              fontSize: '9px', color: '#bbb',
              letterSpacing: '2px', textTransform: 'uppercase',
              fontFamily: "'Arial', sans-serif", marginBottom: '3px',
            }}>
              Certificate ID
            </p>
            <p style={{
              fontSize: '11px', fontFamily: 'monospace',
              color: '#666', letterSpacing: '1px',
            }}>
              {certId || 'CH-XXXXXX-XXXX'}
            </p>
          </div>

          {/* Gold seal (center) */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            marginBottom: '-10px',
          }}>
            <div style={{
              width: '88px', height: '88px', borderRadius: '50%',
              background: 'conic-gradient(#c9a035 0deg, #f0d878 60deg, #c9a035 120deg, #f0d878 180deg, #c9a035 240deg, #f0d878 300deg, #c9a035 360deg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '3px solid #1a2744',
              boxShadow: '0 3px 12px rgba(0,0,0,0.25), inset 0 1px 3px rgba(255,255,255,0.4)',
              position: 'relative',
            }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #f5e070, #c9a035 60%, #a87820)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                border: '1.5px solid #1a274480',
              }}>
                <span style={{ fontSize: '26px', lineHeight: 1, marginBottom: '1px' }}>★</span>
                <span style={{
                  fontSize: '7px', letterSpacing: '1px',
                  color: '#1a2744', fontWeight: '900',
                  fontFamily: "'Arial', sans-serif",
                }}>
                  VERIFIED
                </span>
              </div>
            </div>
          </div>

          {/* Leader signature (bottom right) */}
          <div style={{ textAlign: 'right', minWidth: '160px' }}>
            <p style={{
              fontSize: '14px', color: '#1a2744',
              fontStyle: 'italic', marginBottom: '2px',
              fontFamily: "'Georgia', serif",
            }}>
              {data?.leaderName}
            </p>
            <div style={{ borderTop: '1.5px solid #1a2744', paddingTop: '6px' }}>
              <p style={{
                fontSize: '10px', color: '#888',
                letterSpacing: '2px', textTransform: 'uppercase',
                fontFamily: "'Arial', sans-serif",
              }}>
                Club Leader
              </p>
              <p style={{
                fontSize: '10px', color: '#aaa',
                fontFamily: "'Arial', sans-serif",
                marginTop: '2px',
              }}>
                Issued: {issuedDate}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

CertificateTemplate.displayName = 'CertificateTemplate';

export default CertificateTemplate;
