import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'PRAXIS by TACITUS — Conflict Intelligence Platform';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #050A18 0%, #0B1120 40%, #1B3A5C 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Georgia, serif',
          position: 'relative',
        }}
      >
        {/* Gold accent line at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, #C8961E, #E8B931, #F0CA4D, #E8B931, #C8961E)',
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 80,
            height: 80,
            borderRadius: 20,
            backgroundColor: '#1B3A5C',
            border: '2px solid rgba(232, 185, 49, 0.3)',
            marginBottom: 32,
          }}
        >
          <span style={{ fontSize: 42, color: '#FFFFFF', fontWeight: 700 }}>P</span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: '#F1F5F9',
            letterSpacing: '0.06em',
            fontVariant: 'small-caps',
            marginBottom: 8,
          }}
        >
          praxis
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#E8B931',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: 40,
          }}
        >
          by tacitus
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 24,
            color: '#CBD5E1',
            maxWidth: 700,
            textAlign: 'center',
            lineHeight: 1.4,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          The AI-native conflict intelligence platform for peace and security professionals
        </div>

        {/* Bottom badges */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 48,
            position: 'absolute',
            bottom: 40,
          }}
        >
          {['Gemini AI', 'Glasl Model', 'Conflict Grammar', '30+ Tools'].map((badge) => (
            <div
              key={badge}
              style={{
                fontSize: 12,
                color: '#94A3B8',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: 20,
                padding: '6px 16px',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {badge}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
