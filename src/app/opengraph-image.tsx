import { ImageResponse } from 'next/og';

export const alt = 'PRAXIS by TACITUS — reasoning and policy products from expert ContextCapsules.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const NAVY_950 = '#050A18';
const NAVY_900 = '#0B1120';
const NAVY_700 = '#1B3A5C';
const NAVY_400 = '#94A3B8';
const NAVY_200 = '#CBD5E1';
const NAVY_100 = '#E2E8F0';
const GOLD_500 = '#E8B931';
const GOLD_400 = '#F0CA4D';
const GOLD_300 = '#F5DA7A';
const DIPLOMATIC = '#4B92DB';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background:
            `linear-gradient(135deg, ${NAVY_950} 0%, ${NAVY_900} 45%, ${NAVY_700} 100%)`,
          position: 'relative',
          fontFamily: 'Georgia, serif',
          color: NAVY_100,
        }}
      >
        {/* Gold accent line at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 5,
            background: `linear-gradient(90deg, transparent, ${GOLD_500} 18%, ${GOLD_300} 50%, ${GOLD_500} 82%, transparent)`,
          }}
        />

        {/* Decorative portal ring on the right */}
        <div
          style={{
            position: 'absolute',
            top: -180,
            right: -180,
            width: 720,
            height: 720,
            borderRadius: 9999,
            background:
              `radial-gradient(circle, rgba(232,185,49,0.18) 0%, rgba(232,185,49,0.06) 38%, transparent 70%)`,
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 440,
            height: 440,
            borderRadius: 9999,
            border: `2px solid rgba(232, 185, 49, 0.32)`,
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 30,
            right: 30,
            width: 320,
            height: 320,
            borderRadius: 9999,
            border: `1px solid rgba(75, 146, 219, 0.45)`,
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 110,
            right: 110,
            width: 160,
            height: 160,
            borderRadius: 9999,
            background:
              `radial-gradient(circle, rgba(75,146,219,0.55) 0%, rgba(75,146,219,0.0) 70%)`,
            display: 'flex',
          }}
        />

        {/* Header row — TACITUS + PRAXIS pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '56px 64px 0 64px',
          }}
        >
          <div
            style={{
              fontSize: 26,
              letterSpacing: '0.18em',
              fontWeight: 600,
              color: '#FFFFFF',
            }}
          >
            TACITUS
          </div>
          <div
            style={{
              fontSize: 12,
              letterSpacing: '0.22em',
              fontWeight: 700,
              color: GOLD_400,
              padding: '6px 12px',
              border: `1px solid rgba(232, 185, 49, 0.45)`,
              borderRadius: 9999,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            PRAXIS
          </div>
          <div style={{ flex: 1, display: 'flex' }} />
          <div
            style={{
              fontSize: 13,
              color: NAVY_400,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              fontFamily: 'system-ui, sans-serif',
              fontWeight: 600,
            }}
          >
            praxis.tacitus.me
          </div>
        </div>

        {/* Main block */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '40px 64px 0 64px',
            marginTop: 'auto',
            marginBottom: 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 22,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 9999,
                background: GOLD_500,
                display: 'flex',
              }}
            />
            <div
              style={{
                fontSize: 14,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: GOLD_400,
                fontFamily: 'system-ui, sans-serif',
                fontWeight: 700,
              }}
            >
              Expert ContextCapsules for policy work
            </div>
          </div>

          {/* Headline */}
          <div
            style={{
              fontSize: 86,
              lineHeight: 1.04,
              color: '#FFFFFF',
              fontWeight: 600,
              letterSpacing: '-0.01em',
              maxWidth: 1000,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span>ContextCapsules</span>
            <span>for <span style={{ color: GOLD_400 }}>policy analysis</span>.</span>
          </div>

          {/* Subhead */}
          <div
            style={{
              marginTop: 28,
              fontSize: 24,
              lineHeight: 1.4,
              color: NAVY_200,
              maxWidth: 920,
              fontFamily: 'system-ui, sans-serif',
              display: 'flex',
            }}
          >
            Compose reasoning and policy products from reusable blocks that capture how analysts think, frame issues, and structure decisions.
          </div>
        </div>

        {/* Chapter strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '0 64px 48px 64px',
            flexWrap: 'wrap',
          }}
        >
          {['Capsules', 'Documents', 'Sources', 'Policy Tools', 'Outputs'].map((s) => (
            <div
              key={s}
              style={{
                fontSize: 20,
                color: '#FFFFFF',
                border: `1px solid rgba(75, 146, 219, 0.45)`,
                background: 'rgba(75, 146, 219, 0.10)',
                borderRadius: 10,
                padding: '12px 18px',
                fontFamily: 'system-ui, sans-serif',
                fontWeight: 700,
                letterSpacing: '0.03em',
                display: 'flex',
              }}
            >
              {s}
            </div>
          ))}
          <div style={{ flex: 1, display: 'flex' }} />
          <div
            style={{
              fontSize: 13,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: GOLD_400,
              fontFamily: 'system-ui, sans-serif',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ color: DIPLOMATIC }}>praxis.tacitus.me</span>
            <span style={{ color: NAVY_400 }}>·</span>
            <span>Context · Source · Gap · Handoff</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
