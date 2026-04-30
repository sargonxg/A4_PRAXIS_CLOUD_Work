'use client';

/**
 * Admin — Domain editor
 *
 * Lists the 11 domains. Per-card inline JSON editor with Zod validation
 * server-side. Non-admins see a 403 via the API; the page still loads
 * (it's client-side) but every call fails cleanly.
 *
 * Spec: docs/superpowers/specs/2026-04-19-domain-taxonomy-stabilization-design.md §9
 */

import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import type { MergedDomainConfig } from '@/types/domain';
import { cn } from '@/lib/utils/cn';

type IconName = keyof typeof Icons;

function iconFor(name: string): React.ComponentType<{ className?: string }> {
  const Icon = Icons[name as IconName] as React.ComponentType<{ className?: string }> | undefined;
  return Icon ?? Icons.Circle;
}

interface EditorState {
  lensWeights: string;
  preferredFeeds: string;
  frameworks: string;
  promptOverrides: string;
  description: string;
  status: 'idle' | 'saving' | 'saved' | 'error';
  errorMessage?: string;
  issues?: Array<{ path: (string | number)[]; message: string }>;
}

function domainToEditor(d: MergedDomainConfig): EditorState {
  return {
    lensWeights: JSON.stringify(d.lensWeights, null, 2),
    preferredFeeds: JSON.stringify(d.preferredFeeds, null, 2),
    frameworks: JSON.stringify(d.frameworks, null, 2),
    promptOverrides: JSON.stringify(d.promptOverrides, null, 2),
    description: d.description,
    status: 'idle',
  };
}

function parseEditor(editor: EditorState): {
  ok: true;
  patch: Record<string, unknown>;
} | { ok: false; field: string } {
  try {
    const patch: Record<string, unknown> = {
      description: editor.description,
      lensWeights: JSON.parse(editor.lensWeights),
      preferredFeeds: JSON.parse(editor.preferredFeeds),
      frameworks: JSON.parse(editor.frameworks),
      promptOverrides: JSON.parse(editor.promptOverrides),
    };
    return { ok: true, patch };
  } catch (err) {
    return { ok: false, field: (err as Error).message };
  }
}

export default function AdminDomainsPage() {
  const [domains, setDomains] = useState<MergedDomainConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [editors, setEditors] = useState<Record<string, EditorState>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/admin/domains')
      .then(async (r) => {
        if (r.status === 403) {
          throw new Error('Forbidden — not on the admin allowlist.');
        }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: { domains: MergedDomainConfig[] }) => {
        if (cancelled) return;
        setDomains(data.domains);
        const next: Record<string, EditorState> = {};
        for (const d of data.domains) next[d.id] = domainToEditor(d);
        setEditors(next);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setAuthError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const saveDomain = async (id: string) => {
    const editor = editors[id];
    if (!editor) return;
    const parsed = parseEditor(editor);
    if (!parsed.ok) {
      setEditors((prev) => ({
        ...prev,
        [id]: { ...editor, status: 'error', errorMessage: `Invalid JSON: ${parsed.field}` },
      }));
      return;
    }
    setEditors((prev) => ({ ...prev, [id]: { ...editor, status: 'saving', errorMessage: undefined } }));
    try {
      const res = await fetch(`/api/admin/domains/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.patch),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Save failed' }));
        setEditors((prev) => ({
          ...prev,
          [id]: {
            ...editor,
            status: 'error',
            errorMessage: data.error ?? `HTTP ${res.status}`,
            issues: data.issues,
          },
        }));
        return;
      }
      setEditors((prev) => ({ ...prev, [id]: { ...editor, status: 'saved', errorMessage: undefined } }));
      setTimeout(() => {
        setEditors((prev) =>
          prev[id] ? { ...prev, [id]: { ...prev[id], status: 'idle' } } : prev,
        );
      }, 2500);
    } catch (err) {
      setEditors((prev) => ({
        ...prev,
        [id]: { ...editor, status: 'error', errorMessage: (err as Error).message },
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-navy-500">
        Loading domains…
      </div>
    );
  }

  if (authError) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-crimson/30 bg-crimson/5 p-6 text-sm text-navy-800">
        <p className="font-semibold text-crimson">Admin access required</p>
        <p className="mt-2 text-navy-600">{authError}</p>
        <p className="mt-3 text-xs text-navy-500">
          Sign in with a verified email in <code className="rounded bg-navy-100 px-1">ADMIN_EMAIL_ALLOWLIST</code>
          or add your uid to <code className="rounded bg-navy-100 px-1">ADMIN_ALLOWLIST</code> and redeploy.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      <header>
        <h1 className="text-2xl font-bold text-navy-900">Domain Taxonomy</h1>
        <p className="mt-1 text-sm text-navy-500">
          Live configuration for the 11 PRAXIS domains. Changes take effect within 5 minutes (cache TTL)
          or immediately for the editing admin. Every save bumps the domain version and writes a history snapshot.
        </p>
      </header>

      {domains.map((d) => {
        const Icon = iconFor(d.icon);
        const editor = editors[d.id];
        if (!editor) return null;
        return (
          <section
            key={d.id}
            className="rounded-xl border border-navy-200 bg-white p-5 shadow-sm"
            aria-label={`${d.name} editor`}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${d.colorHex}14`, color: d.colorHex }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-navy-900">{d.name}</h2>
                <p className="text-xs text-navy-500">
                  <code className="rounded bg-navy-50 px-1.5 py-0.5">{d.id}</code> · v{d.version}
                  {d.parentId ? ` · extends ${d.parentId}` : ' · baseline'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => saveDomain(d.id)}
                disabled={editor.status === 'saving'}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-xs font-semibold transition',
                  editor.status === 'saving' && 'cursor-not-allowed opacity-60',
                  editor.status === 'saved'
                    ? 'border-sage bg-sage/10 text-sage'
                    : 'border-diplomatic-blue bg-diplomatic-blue text-white hover:bg-diplomatic-blue/90',
                )}
              >
                {editor.status === 'saving'
                  ? 'Saving…'
                  : editor.status === 'saved'
                    ? 'Saved ✓'
                    : 'Save'}
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <EditorField
                label="description"
                helper="1-2 sentences. Shown in pickers."
                value={editor.description}
                onChange={(v) =>
                  setEditors((prev) => ({ ...prev, [d.id]: { ...editor, description: v } }))
                }
                rows={2}
              />
              <EditorField
                label="lensWeights (JSON)"
                helper="0.0–2.0 per lens. Missing lenses inherit from generic."
                value={editor.lensWeights}
                onChange={(v) =>
                  setEditors((prev) => ({ ...prev, [d.id]: { ...editor, lensWeights: v } }))
                }
                rows={5}
                mono
              />
              <EditorField
                label="preferredFeeds (JSON array)"
                helper="Feed ids that should rank higher for this domain. Empty = inherit."
                value={editor.preferredFeeds}
                onChange={(v) =>
                  setEditors((prev) => ({ ...prev, [d.id]: { ...editor, preferredFeeds: v } }))
                }
                rows={3}
                mono
              />
              <EditorField
                label="frameworks (JSON array)"
                helper="Analytical framework ids to suggest first."
                value={editor.frameworks}
                onChange={(v) =>
                  setEditors((prev) => ({ ...prev, [d.id]: { ...editor, frameworks: v } }))
                }
                rows={3}
                mono
              />
              <EditorField
                label="promptOverrides (JSON object)"
                helper="{ toolId: prompt-fragment } — injected into that tool's system prompt."
                value={editor.promptOverrides}
                onChange={(v) =>
                  setEditors((prev) => ({ ...prev, [d.id]: { ...editor, promptOverrides: v } }))
                }
                rows={4}
                mono
              />
            </div>

            {editor.errorMessage && (
              <p className="mt-3 rounded-md border border-crimson/30 bg-crimson/5 px-3 py-2 text-xs text-crimson">
                {editor.errorMessage}
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}

function EditorField({
  label,
  helper,
  value,
  onChange,
  rows,
  mono,
}: {
  label: string;
  helper: string;
  value: string;
  onChange: (v: string) => void;
  rows: number;
  mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-navy-500">{label}</span>
      <span className="block text-[10px] text-navy-400">{helper}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className={cn(
          'mt-1 block w-full rounded-md border border-navy-200 bg-white px-3 py-2 text-xs text-navy-900 focus:border-diplomatic-blue focus:outline-none',
          mono && 'font-mono',
        )}
      />
    </label>
  );
}
