'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, Check, Loader2, Save, Sparkles, UserRound, X } from 'lucide-react';

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

type UserCoreForm = {
  name: string;
  role: string;
  mandate: string;
  language: string;
  jurisdiction: string;
  formality: string;
  citationDensity: string;
  structure: string;
  quickModel: string;
  deepModel: string;
  memoModel: string;
  costCeiling: string;
};

type UserCoreResponse = {
  core?: {
    name?: string;
    description?: string | null;
    metadata?: {
      profile?: Partial<Pick<UserCoreForm, 'name' | 'role' | 'mandate' | 'language' | 'jurisdiction'>>;
      style?: Partial<Pick<UserCoreForm, 'formality' | 'citationDensity' | 'structure'>>;
      models?: {
        quick?: string;
        deep?: string;
        memo?: string;
        costCeiling?: string | number;
      };
    } | null;
  } | null;
  status?: string;
  note?: string;
};

const defaultForm: UserCoreForm = {
  name: 'Giulio Catanzariti',
  role: 'Conflict analyst',
  mandate: 'Policy and multilateral diplomacy practice',
  language: 'en-US',
  jurisdiction: '',
  formality: 'Formal',
  citationDensity: 'High',
  structure: 'Bulleted',
  quickModel: 'gemini-3-flash',
  deepModel: 'gemini-3.1-pro-preview',
  memoModel: 'gemini-3.1-pro-preview',
  costCeiling: '2.50',
};

const styles = ['Formal', 'Plain', 'Casual'] as const;
const citations = ['High', 'Medium', 'Low'] as const;
const structures = ['Narrative', 'Bulleted', 'Mix'] as const;

export function V7UserCoreEditor() {
  const [form, setForm] = useState<UserCoreForm>(defaultForm);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [loadNote, setLoadNote] = useState('Loading your User Core...');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/backend/cores/me')
      .then(async (response) => {
        if (!response.ok) throw new Error(`load_failed_${response.status}`);
        return (await response.json()) as UserCoreResponse;
      })
      .then((body) => {
        if (cancelled) return;
        const metadata = body.core?.metadata ?? {};
        setForm((current) => ({
          ...current,
          name: stringValue(metadata.profile?.name, body.core?.name, current.name),
          role: stringValue(metadata.profile?.role, body.core?.description, current.role),
          mandate: stringValue(metadata.profile?.mandate, current.mandate),
          language: stringValue(metadata.profile?.language, current.language),
          jurisdiction: stringValue(metadata.profile?.jurisdiction, current.jurisdiction),
          formality: stringValue(metadata.style?.formality, current.formality),
          citationDensity: stringValue(metadata.style?.citationDensity, current.citationDensity),
          structure: stringValue(metadata.style?.structure, current.structure),
          quickModel: stringValue(metadata.models?.quick, current.quickModel),
          deepModel: stringValue(metadata.models?.deep, current.deepModel),
          memoModel: stringValue(metadata.models?.memo, current.memoModel),
          costCeiling: stringValue(metadata.models?.costCeiling, current.costCeiling),
        }));
        setSaveState('saved');
        setLoadNote(body.status === 'backend_unconfigured'
          ? 'Using local Core defaults until the Python backend is configured.'
          : 'Loaded from your saved User Core.');
      })
      .catch(() => {
        if (!cancelled) {
          setSaveState('idle');
          setLoadNote('Using local Core defaults. Save will retry the Core API.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save(next = form) {
    setSaveState('saving');
    try {
      const response = await fetch('/api/backend/cores/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      if (!response.ok) throw new Error(`save_failed_${response.status}`);
      setSaveState('saved');
      setLoadNote('Saved. Ask PRAXIS will use this User Core on future turns.');
    } catch {
      setSaveState('error');
      setLoadNote('Save failed. Your local edits remain visible here.');
    }
  }

  function update(field: keyof UserCoreForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setSaveState('dirty');
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5" data-testid="v7-user-core-editor">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/app/home"
          className="inline-flex min-h-10 w-fit items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-navy-900 hover:border-navy-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        <SaveBadge state={saveState} />
      </div>

      <section className="overflow-hidden rounded-lg border border-navy-200 bg-white shadow-sm shadow-navy-950/5">
        <div className="border-b border-slate-200 bg-gradient-to-br from-white via-slate-50 to-gold-50/50 px-5 py-6 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-gold-200 bg-white px-3 py-1 text-xs font-semibold uppercase text-gold-800">
                <UserRound className="h-3.5 w-3.5" />
                My Core
              </p>
              <h1 className="mt-4 text-2xl font-semibold text-navy-950 sm:text-3xl">
                Who PRAXIS is answering for.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
                Your role, voice, default models, and cost guardrails travel with every Ask PRAXIS turn. The interface stays simple; the context travels behind the scenes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saveState === 'saving'}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-navy-950 px-4 text-sm font-semibold text-white hover:bg-navy-800 disabled:bg-slate-300"
            >
              {saveState === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save User Core
            </button>
          </div>
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-6">
          <div className="space-y-6">
            <Card title="Profile" body="This frames the answer before any Situation Core or Skill is attached.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" value={form.name} onChange={(value) => update('name', value)} />
                <Field label="Role" value={form.role} onChange={(value) => update('role', value)} />
                <Field label="Language" value={form.language} onChange={(value) => update('language', value)} />
                <Field label="Jurisdiction" value={form.jurisdiction} placeholder="Optional" onChange={(value) => update('jurisdiction', value)} />
              </div>
              <TextArea label="Mandate / desk" value={form.mandate} onChange={(value) => update('mandate', value)} />
            </Card>

            <Card title="Writing style" body="Used by memo, brief, and talking-points modes.">
              <Segmented label="Formality" options={styles} value={form.formality} onChange={(value) => update('formality', value)} />
              <Segmented label="Citation density" options={citations} value={form.citationDensity} onChange={(value) => update('citationDensity', value)} />
              <Segmented label="Structure" options={structures} value={form.structure} onChange={(value) => update('structure', value)} />
            </Card>

            <Card title="Model and cost defaults" body="Locked to Vertex-routed models; this page never stores direct provider keys.">
              <div className="grid gap-4 sm:grid-cols-2">
                <ModelSelect label="Quick" value={form.quickModel} onChange={(value) => update('quickModel', value)} />
                <ModelSelect label="Deep" value={form.deepModel} onChange={(value) => update('deepModel', value)} />
                <ModelSelect label="Memo" value={form.memoModel} onChange={(value) => update('memoModel', value)} />
                <Field label="Cost ceiling per thread" value={form.costCeiling} prefix="$" onChange={(value) => update('costCeiling', value)} />
              </div>
            </Card>
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
              <p className="font-semibold">Core status</p>
              <p className="mt-2 text-xs leading-5">{loadNote}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-700">
                <Sparkles className="h-4 w-4 text-gold-700" />
                Applied by Ask PRAXIS
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-5 text-slate-700">
                <li>Every answer starts with this User Core.</li>
                <li>Case Core adds facts, actors, sources, graph, and outputs.</li>
                <li>Analyst Skills inherit both cores before producing a result.</li>
              </ul>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase text-slate-700">Preview</p>
              <p className="mt-2 text-sm font-semibold text-navy-950">{form.name || 'Unnamed analyst'}</p>
              <p className="mt-1 text-sm leading-5 text-slate-700">{form.role || 'Role not set'} · {form.language || 'language not set'}</p>
              <p className="mt-3 text-xs leading-5 text-slate-700">
                {form.formality} tone, {form.citationDensity.toLowerCase()} citation density, {form.structure.toLowerCase()} structure.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

function Card({ title, body, children }: { title: string; body: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-navy-950">{title}</h2>
        <p className="mt-1 text-sm leading-5 text-slate-700">{body}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  prefix?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase text-slate-700">{label}</span>
      <span className="mt-1 flex min-h-11 items-center rounded-md border border-slate-200 bg-white px-3 text-sm text-navy-950 focus-within:border-navy-400">
        {prefix && <span className="mr-1 text-slate-500">{prefix}</span>}
        <input
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="w-full border-0 bg-transparent py-2 outline-none placeholder:text-slate-400"
        />
      </span>
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase text-slate-700">{label}</span>
      <textarea
        value={value}
        rows={4}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 min-h-28 w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-navy-950 outline-none placeholder:text-slate-400 focus:border-navy-400"
      />
    </label>
  );
}

function Segmented({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-700">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              value === option
                ? 'border-navy-800 bg-navy-950 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:border-navy-300 hover:text-navy-950'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function ModelSelect({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-navy-950 outline-none focus:border-navy-400"
      >
        <option value="gemini-3-flash">gemini-3-flash</option>
        <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview</option>
      </select>
    </label>
  );
}

function SaveBadge({ state }: { state: SaveState }) {
  const content = useMemo(() => {
    if (state === 'saving') return { icon: Loader2, label: 'Saving...', className: 'text-slate-700' };
    if (state === 'saved') return { icon: Check, label: 'Saved', className: 'text-emerald-700' };
    if (state === 'error') return { icon: X, label: 'Save failed', className: 'text-red-700' };
    if (state === 'dirty') return { icon: Save, label: 'Unsaved changes', className: 'text-amber-700' };
    return { icon: Check, label: 'Ready', className: 'text-slate-600' };
  }, [state]);
  const Icon = content.icon;
  return (
    <span className={`inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold ${content.className}`}>
      <Icon className={`h-4 w-4 ${state === 'saving' ? 'animate-spin' : ''}`} />
      {content.label}
    </span>
  );
}

function stringValue(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}
