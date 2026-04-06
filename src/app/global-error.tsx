'use client';

/**
 * global-error.tsx catches crashes inside the root layout itself
 * (e.g. AuthProvider failure, Analytics init error).
 * Must include <html> and <body> — it replaces the root layout entirely.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0F172A', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{
          display: 'flex',
          minHeight: '100vh',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          gap: '1.5rem',
        }}>
          <div style={{ fontSize: '2rem', letterSpacing: '0.15em', color: '#E8B931', fontWeight: 700 }}>
            PRAXIS
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
            Something went wrong
          </h1>
          <p style={{ color: '#94a3b8', maxWidth: '28rem', margin: 0, lineHeight: 1.6 }}>
            A critical error occurred while loading the platform. Our team has been notified.
            {error.digest && (
              <span style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748b' }}>
                Error ID: {error.digest}
              </span>
            )}
          </p>
          <button
            onClick={reset}
            style={{
              padding: '0.625rem 1.5rem',
              background: '#10B981',
              color: '#fff',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
