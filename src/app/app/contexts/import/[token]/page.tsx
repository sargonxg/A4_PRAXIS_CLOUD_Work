'use client';

/**
 * /app/contexts/import/[token] - accept / decline a shared capsule.
 *
 * Brief: Claude Code CC-8. Validates the token via
 * /api/capsules/import/{token} (Codex CX-7) and renders the
 * inviter, capsule label, scope, expiry, plus accept/decline CTAs.
 */

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2, ShieldAlert, Inbox } from 'lucide-react';

interface ImportPreview {
  capsuleId: string;
  label: string;
  invitedBy: string;
  scope: 'user' | 'team' | 'situation';
  expiresAt?: string;
}

export default function CapsuleImportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<'accept' | 'decline' | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/capsules/import/${encodeURIComponent(token)}`, { credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) throw new Error(`status ${r.status}`);
        return (await r.json()) as ImportPreview;
      })
      .then((p) => {
        if (!cancelled) setPreview(p);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'token invalid or expired');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function decide(action: 'accept' | 'decline') {
    setPending(action);
    try {
      const res = await fetch(`/api/capsules/import/${encodeURIComponent(token)}/${action}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        const body = (await res.json()) as { capsuleId?: string };
        if (action === 'accept' && body.capsuleId) {
          window.location.href = `/app?capsuleId=${encodeURIComponent(body.capsuleId)}`;
          return;
        }
        window.location.href = '/app';
      }
    } finally {
      setPending(null);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center justify-center gap-3 p-12 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
        <p className="text-sm text-slate-700">Validating share token…</p>
      </main>
    );
  }

  if (error || !preview) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center justify-center gap-3 p-12 text-center">
        <ShieldAlert className="h-8 w-8 text-amber-700" />
        <h1 className="font-serif text-2xl text-slate-950">Share link expired</h1>
        <p className="text-sm text-slate-700">
          The token couldn't be validated ({error ?? 'unknown'}). Ask the inviter to regenerate.
        </p>
        <Link href="/app" className="text-sm font-semibold text-diplomatic-blue hover:underline">
          Back to capsules
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-8">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8A5A00]">capsule invite</p>
      <h1 className="font-serif text-2xl text-slate-950">{preview.label}</h1>
      <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
        <div className="flex items-center gap-2">
          <Inbox className="h-3.5 w-3.5 text-slate-500" />
          <span>
            Invited by <span className="font-semibold text-slate-950">{preview.invitedBy}</span>
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-600">
          Scope <span className="font-mono">{preview.scope}</span>
          {preview.expiresAt ? (
            <>
              {' '}
              · expires {new Date(preview.expiresAt).toLocaleString()}
            </>
          ) : null}
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => void decide('decline')}
          disabled={pending !== null}
          className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50"
        >
          {pending === 'decline' ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          Decline
        </button>
        <button
          type="button"
          onClick={() => void decide('accept')}
          disabled={pending !== null}
          className="inline-flex items-center gap-1 rounded-md bg-[#111827] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#243244] disabled:opacity-50"
        >
          {pending === 'accept' ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3 w-3" />}
          Accept
        </button>
      </div>
    </main>
  );
}
