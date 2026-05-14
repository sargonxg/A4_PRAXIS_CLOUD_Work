'use client';

import { useEffect, useState } from 'react';
import type { MergedPathConfig } from '@/lib/path/types';
import { cn } from '@/lib/utils/cn';

interface EditorState {
  description: string;
  toolBundle: string;
  timeHorizonDefault: string;
  lensTop3: string;
  lensWeights: string;
  frameworkPath: string;
  audienceDefault: string;
  sourceMix: string;
  promptVoice: string;
  outputDefaults: string;
  contextRecipe: string;
  creditMultiplier: string;
  promptOverrides: string;
  status: 'idle' | 'saving' | 'saved' | 'error';
  errorMessage?: string;
}

function pathToEditor(path: MergedPathConfig): EditorState {
  return {
    description: path.description,
    toolBundle: JSON.stringify(path.toolBundle, null, 2),
    timeHorizonDefault: path.timeHorizonDefault,
    lensTop3: JSON.stringify(path.lensTop3, null, 2),
    lensWeights: JSON.stringify(path.lensWeights, null, 2),
    frameworkPath: JSON.stringify(path.frameworkPath, null, 2),
    audienceDefault: path.audienceDefault,
    sourceMix: JSON.stringify(path.sourceMix, null, 2),
    promptVoice: JSON.stringify(path.promptVoice, null, 2),
    outputDefaults: JSON.stringify(path.outputDefaults, null, 2),
    contextRecipe: JSON.stringify(path.contextRecipe, null, 2),
    creditMultiplier: String(path.creditMultiplier ?? 1),
    promptOverrides: JSON.stringify(path.promptOverrides, null, 2),
    status: 'idle',
  };
}

function parseEditor(editor: EditorState): { ok: true; patch: Record<string, unknown> } | { ok: false; error: string } {
  try {
    const multiplier = Number(editor.creditMultiplier);
    return {
      ok: true,
      patch: {
        description: editor.description,
        toolBundle: JSON.parse(editor.toolBundle),
        timeHorizonDefault: editor.timeHorizonDefault,
        lensTop3: JSON.parse(editor.lensTop3),
        lensWeights: JSON.parse(editor.lensWeights),
        frameworkPath: JSON.parse(editor.frameworkPath),
        audienceDefault: editor.audienceDefault,
        sourceMix: JSON.parse(editor.sourceMix),
        promptVoice: JSON.parse(editor.promptVoice),
        outputDefaults: JSON.parse(editor.outputDefaults),
        contextRecipe: JSON.parse(editor.contextRecipe),
        creditMultiplier: Number.isFinite(multiplier) ? multiplier : 1,
        promptOverrides: JSON.parse(editor.promptOverrides),
      },
    };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export default function AdminPathsPage() {
  const [paths, setPaths] = useState<MergedPathConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [editors, setEditors] = useState<Record<string, EditorState>>({});

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/paths')
      .then(async (res) => {
        if (res.status === 403) throw new Error('Forbidden — not on the admin allowlist.');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: { paths: MergedPathConfig[] }) => {
        if (cancelled) return;
        setPaths(data.paths);
        setEditors(Object.fromEntries(data.paths.map((path) => [path.id, pathToEditor(path)])));
      })
      .catch((err: Error) => {
        if (!cancelled) setAuthError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const savePath = async (id: string) => {
    const editor = editors[id];
    if (!editor) return;
    const parsed = parseEditor(editor);
    if (!parsed.ok) {
      setEditors((prev) => ({ ...prev, [id]: { ...editor, status: 'error', errorMessage: `Invalid JSON: ${parsed.error}` } }));
      return;
    }
    setEditors((prev) => ({ ...prev, [id]: { ...editor, status: 'saving', errorMessage: undefined } }));
    const res = await fetch(`/api/admin/paths/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.patch),
    }).catch((err: Error) => err);
    if (res instanceof Error || !res.ok) {
      const body = res instanceof Error ? { error: res.message } : await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      setEditors((prev) => ({ ...prev, [id]: { ...editor, status: 'error', errorMessage: body.error ?? 'Save failed' } }));
      return;
    }
    setEditors((prev) => ({ ...prev, [id]: { ...editor, status: 'saved', errorMessage: undefined } }));
    setTimeout(() => {
      setEditors((prev) => prev[id] ? { ...prev, [id]: { ...prev[id], status: 'idle' } } : prev);
    }, 2500);
  };

  if (loading) return <div className="flex h-64 items-center justify-center text-sm text-navy-500">Loading paths...</div>;

  if (authError) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-crimson/30 bg-crimson/5 p-6 text-sm text-navy-800">
        <p className="font-semibold text-crimson">Admin access required</p>
        <p className="mt-2 text-navy-600">{authError}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      <header>
        <h1 className="text-2xl font-bold text-navy-900">Path Core</h1>
        <p className="mt-1 text-sm text-navy-500">
          Versioned operator overlays for domain DNA. These ten paths tune tools, time horizon, source ranking, prompt voice, output defaults, and credit multipliers.
        </p>
      </header>

      {paths.map((path) => {
        const editor = editors[path.id];
        if (!editor) return null;
        return (
          <section key={path.id} className="rounded-xl border border-navy-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-navy-900">{path.name}</h2>
                <p className="text-xs text-navy-500">
                  <code className="rounded bg-navy-50 px-1.5 py-0.5">{path.id}</code> · {path.domainId} · v{path.version}
                </p>
              </div>
              <button
                type="button"
                onClick={() => savePath(path.id)}
                disabled={editor.status === 'saving'}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-xs font-semibold transition',
                  editor.status === 'saving' && 'cursor-not-allowed opacity-60',
                  editor.status === 'saved'
                    ? 'border-sage bg-sage/10 text-sage'
                    : 'border-diplomatic-blue bg-diplomatic-blue text-white hover:bg-diplomatic-blue/90',
                )}
              >
                {editor.status === 'saving' ? 'Saving...' : editor.status === 'saved' ? 'Saved' : 'Save'}
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <EditorField label="description" value={editor.description} rows={3} onChange={(v) => setEditors((prev) => ({ ...prev, [path.id]: { ...editor, description: v } }))} />
              <EditorField label="toolBundle JSON" value={editor.toolBundle} rows={3} mono onChange={(v) => setEditors((prev) => ({ ...prev, [path.id]: { ...editor, toolBundle: v } }))} />
              <EditorField label="timeHorizonDefault" value={editor.timeHorizonDefault} rows={1} onChange={(v) => setEditors((prev) => ({ ...prev, [path.id]: { ...editor, timeHorizonDefault: v } }))} />
              <EditorField label="audienceDefault" value={editor.audienceDefault} rows={1} onChange={(v) => setEditors((prev) => ({ ...prev, [path.id]: { ...editor, audienceDefault: v } }))} />
              <EditorField label="lensTop3 JSON" value={editor.lensTop3} rows={3} mono onChange={(v) => setEditors((prev) => ({ ...prev, [path.id]: { ...editor, lensTop3: v } }))} />
              <EditorField label="lensWeights JSON" value={editor.lensWeights} rows={3} mono onChange={(v) => setEditors((prev) => ({ ...prev, [path.id]: { ...editor, lensWeights: v } }))} />
              <EditorField label="frameworkPath JSON" value={editor.frameworkPath} rows={3} mono onChange={(v) => setEditors((prev) => ({ ...prev, [path.id]: { ...editor, frameworkPath: v } }))} />
              <EditorField label="sourceMix JSON" value={editor.sourceMix} rows={4} mono onChange={(v) => setEditors((prev) => ({ ...prev, [path.id]: { ...editor, sourceMix: v } }))} />
              <EditorField label="promptVoice JSON" value={editor.promptVoice} rows={4} mono onChange={(v) => setEditors((prev) => ({ ...prev, [path.id]: { ...editor, promptVoice: v } }))} />
              <EditorField label="outputDefaults JSON" value={editor.outputDefaults} rows={4} mono onChange={(v) => setEditors((prev) => ({ ...prev, [path.id]: { ...editor, outputDefaults: v } }))} />
              <EditorField label="contextRecipe JSON" value={editor.contextRecipe} rows={3} mono onChange={(v) => setEditors((prev) => ({ ...prev, [path.id]: { ...editor, contextRecipe: v } }))} />
              <EditorField label="creditMultiplier" value={editor.creditMultiplier} rows={1} onChange={(v) => setEditors((prev) => ({ ...prev, [path.id]: { ...editor, creditMultiplier: v } }))} />
              <div className="md:col-span-2">
                <EditorField label="promptOverrides JSON" value={editor.promptOverrides} rows={4} mono onChange={(v) => setEditors((prev) => ({ ...prev, [path.id]: { ...editor, promptOverrides: v } }))} />
              </div>
            </div>

            {editor.errorMessage && (
              <p className="mt-3 rounded-md border border-crimson/30 bg-crimson/5 px-3 py-2 text-xs text-crimson">{editor.errorMessage}</p>
            )}
          </section>
        );
      })}
    </div>
  );
}

function EditorField({
  label,
  value,
  rows,
  onChange,
  mono,
}: {
  label: string;
  value: string;
  rows: number;
  onChange: (value: string) => void;
  mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-navy-500">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className={cn(
          'mt-1 block w-full rounded-md border border-navy-200 bg-white px-3 py-2 text-xs text-navy-900 focus:border-diplomatic-blue focus:outline-none',
          mono && 'font-mono',
        )}
      />
    </label>
  );
}
