'use client';

import { useState } from 'react';

type Stage = 'idle' | 'export-prompt' | 'confirm';

export function DangerZone() {
  const [stage, setStage] = useState<Stage>('idle');
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function exportNow() {
    window.location.href = '/api/profile/export';
  }

  async function deleteNow() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch('/api/profile', { method: 'DELETE' });
      if (r.ok) {
        setDone(true);
      } else {
        setError('Delete failed. Please try again or contact support.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="text-sm text-emerald-800">
          Profile deleted. Situations and past reports remain accessible; you can re-onboard at
          any time from the onboarding page.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-xl border border-red-300 bg-red-50/50 p-5">
      <h2 className="text-sm font-semibold text-red-900">Danger Zone</h2>
      <p className="text-xs text-red-700">
        Deleting your profile scrubs PII from your analyst record (organisation, team, mandate,
        regions, red lines, embedding). Situations and tool outputs are <em>not</em> deleted and
        remain accessible to your account. Exports include everything.
      </p>

      {error && (
        <p role="alert" className="text-xs text-red-800">
          {error}
        </p>
      )}

      {stage === 'idle' && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={exportNow}
            className="rounded border border-red-500 px-3 py-1.5 text-xs text-red-700 hover:bg-red-100"
          >
            Export profile JSON
          </button>
          <button
            type="button"
            onClick={() => setStage('export-prompt')}
            className="rounded bg-red-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-700"
          >
            Delete my profile
          </button>
        </div>
      )}

      {stage === 'export-prompt' && (
        <div className="space-y-2">
          <p className="text-xs text-red-700">Export a backup first? (Recommended)</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={exportNow}
              className="rounded border border-red-500 px-3 py-1.5 text-xs text-red-700 hover:bg-red-100"
            >
              Export JSON
            </button>
            <button
              type="button"
              onClick={() => setStage('confirm')}
              className="rounded bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700"
            >
              Skip export, continue
            </button>
            <button
              type="button"
              onClick={() => setStage('idle')}
              className="text-xs text-navy-500 underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {stage === 'confirm' && (
        <div className="space-y-2">
          <p className="text-xs text-red-900">
            Type <code className="rounded bg-white px-1 font-mono">delete</code> to confirm:
          </p>
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoFocus
            aria-label="Type delete to confirm"
            className="w-full rounded border border-red-300 px-2 py-1 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={deleteNow}
              disabled={typed !== 'delete' || busy}
              className="rounded bg-red-700 px-3 py-1.5 text-xs text-white hover:bg-red-800 disabled:bg-red-300"
            >
              {busy ? 'Deleting…' : 'Delete permanently'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStage('idle');
                setTyped('');
              }}
              className="text-xs text-navy-500 underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
