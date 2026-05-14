'use client';

/**
 * ShareCapsuleButton — opens a modal with a signed URL + expiry.
 *
 * Brief: Claude Code CC-8. Calls /api/capsules/{id}/share (Codex
 * CX-7) to mint a one-time share token and renders the resulting URL
 * with a copy-to-clipboard button.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Copy, X, Loader2 } from 'lucide-react';

export function ShareCapsuleButton({ capsuleId }: { capsuleId: string | null }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function mintLink() {
    if (!capsuleId) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/capsules/${encodeURIComponent(capsuleId)}/share`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const body = (await res.json()) as { url?: string; expiresAt?: string };
      if (body.url) {
        setShareUrl(body.url);
        setExpiresAt(body.expiresAt ?? null);
      } else {
        throw new Error('no url returned');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'share failed');
    } finally {
      setPending(false);
    }
  }

  async function copy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          if (!shareUrl) void mintLink();
        }}
        disabled={!capsuleId}
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50"
      >
        <Share2 className="h-3 w-3" />
        Share
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Share capsule"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-[#0F172A]/55 backdrop-blur-sm"
              aria-label="Close share modal backdrop"
            />
            <motion.div
              initial={{ y: 12, scale: 0.98, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 12, scale: 0.98, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 28 }}
              className="relative z-10 w-full max-w-md rounded-xl border border-slate-300 bg-white p-5 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute right-3 top-3 rounded-md p-1 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8A5A00]">share</p>
              <h2 className="mt-1 font-serif text-xl text-slate-950">Send this capsule</h2>
              <p className="mt-1 text-xs text-slate-600">
                Recipients land on a signed import page. They can accept or decline; nothing
                installs without consent.
              </p>

              <div className="mt-3 rounded-md border border-slate-300 bg-slate-50 p-2 font-mono text-[11px] text-slate-800">
                {pending ? (
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <Loader2 className="h-3 w-3 animate-spin" /> minting link…
                  </span>
                ) : shareUrl ? (
                  <span className="break-all">{shareUrl}</span>
                ) : (
                  <span className="text-slate-500">{error ? `error: ${error}` : 'no link yet'}</span>
                )}
              </div>
              {expiresAt ? (
                <p className="mt-1 text-[10px] text-slate-500">
                  expires {new Date(expiresAt).toLocaleString()}
                </p>
              ) : null}

              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => void mintLink()}
                  disabled={pending}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50"
                >
                  Regenerate
                </button>
                <button
                  type="button"
                  onClick={() => void copy()}
                  disabled={!shareUrl}
                  className="inline-flex items-center gap-1 rounded-md bg-[#111827] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  <Copy className="h-3 w-3" />
                  {copied ? 'Copied' : 'Copy link'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
