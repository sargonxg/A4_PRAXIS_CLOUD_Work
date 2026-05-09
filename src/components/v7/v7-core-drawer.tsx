'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import {
  ArrowRight,
  Boxes,
  Check,
  FileText,
  GitBranch,
  Globe2,
  Library,
  Loader2,
  Plus,
  Save,
  UserRound,
  X,
} from 'lucide-react';

export type V7CoreDrawerKind = 'user' | 'situation';

export interface V7CoreDrawerSituation {
  id?: string;
  name: string;
  region?: string;
  sourceCount: number;
  documentCount: number;
  graphCount: number;
  actorCount: number;
}

interface V7CoreDrawerProps {
  open: boolean;
  kind: V7CoreDrawerKind;
  situation?: V7CoreDrawerSituation | null;
  onClose: () => void;
}

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
};

const styleOptions = ['Formal', 'Plain', 'Casual'] as const;
const citationOptions = ['High', 'Medium', 'Low'] as const;
const structureOptions = ['Narrative', 'Bulleted', 'Mix'] as const;
const situationTabs = ['Frame', 'Actors', 'Timeline', 'Sources', 'Graph', 'Outputs'] as const;
const defaultUserCoreForm: UserCoreForm = {
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

export function V7CoreDrawer({ open, kind, situation, onClose }: V7CoreDrawerProps) {
  const [activeTab, setActiveTab] = useState<(typeof situationTabs)[number]>('Frame');

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" data-testid="v7-core-drawer-root">
      <button
        type="button"
        aria-label="Close Core drawer backdrop"
        className="absolute inset-0 bg-navy-950/35"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={kind === 'user' ? 'My Core drawer' : 'Case Core drawer'}
        data-testid="v7-core-drawer"
        data-core-kind={kind}
        className="absolute right-0 top-0 flex h-full w-full max-w-full flex-col border-l border-navy-200 bg-white shadow-2xl shadow-navy-950/20 sm:w-[480px]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className={kind === 'user' ? iconBoxClass('blue') : iconBoxClass('purple')}>
              {kind === 'user' ? <UserRound className="h-5 w-5" /> : <Boxes className="h-5 w-5" />}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-slate-600">
                {kind === 'user' ? 'My Core' : 'Case Core'}
              </p>
              <h2 className="mt-1 truncate text-lg font-semibold text-navy-950">
                {kind === 'user' ? 'Who PRAXIS is answering for' : situation?.name ?? 'No active Situation'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:border-navy-300 hover:text-navy-950"
            aria-label="Close Core drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {kind === 'user' ? (
          <UserCoreDrawerBody onClose={onClose} />
        ) : (
          <SituationCoreDrawerBody
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            situation={situation}
          />
        )}
      </aside>
    </div>
  );
}

function UserCoreDrawerBody({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<UserCoreForm>(defaultUserCoreForm);
  const [loadedFromCore, setLoadedFromCore] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const latestFormRef = useRef(form);
  const latestSaveStateRef = useRef<SaveState>('idle');

  useEffect(() => {
    latestFormRef.current = form;
    latestSaveStateRef.current = saveState;
  }, [form, saveState]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/backend/cores/me')
      .then(async (response) => {
        if (!response.ok) throw new Error(`load_failed_${response.status}`);
        return (await response.json()) as UserCoreResponse;
      })
      .then((body) => {
        if (cancelled || !body.core) return;
        const metadata = body.core.metadata ?? {};
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
        setLoadedFromCore(true);
        setSaveState('saved');
      })
      .catch(() => {
        if (!cancelled) setLoadedFromCore(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = useCallback(async (nextForm = form) => {
    setSaveState('saving');
    try {
      const response = await fetch('/api/backend/cores/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextForm),
      });
      if (!response.ok) throw new Error(`save_failed_${response.status}`);
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }, [form]);

  useEffect(() => {
    if (saveState !== 'dirty') return;
    const timer = window.setTimeout(() => {
      void save();
    }, 600);
    return () => window.clearTimeout(timer);
  }, [save, saveState]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void save();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [save]);

  useEffect(() => {
    return () => {
      if (latestSaveStateRef.current !== 'dirty') return;
      const body = JSON.stringify(latestFormRef.current);
      void fetch('/api/backend/cores/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      });
    };
  }, []);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setSaveState('dirty');
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-900">
          {loadedFromCore ? 'Loaded from your saved User Core.' : 'Using local defaults until your saved User Core is available.'}
        </div>
        <div className="grid gap-4">
          <Field label="Name" value={form.name} onChange={(value) => updateField('name', value)} />
          <Field label="Role" value={form.role} onChange={(value) => updateField('role', value)} />
          <Field label="Mandate / desk" value={form.mandate} onChange={(value) => updateField('mandate', value)} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Language" value={form.language} onChange={(value) => updateField('language', value)} />
            <Field label="Jurisdiction" value={form.jurisdiction} placeholder="Optional" onChange={(value) => updateField('jurisdiction', value)} />
          </div>
        </div>

        <DrawerSection title="Style">
          <SegmentedControl label="Formality" options={styleOptions} value={form.formality} onChange={(value) => updateField('formality', value)} />
          <SegmentedControl label="Citation" options={citationOptions} value={form.citationDensity} onChange={(value) => updateField('citationDensity', value)} />
          <SegmentedControl label="Structure" options={structureOptions} value={form.structure} onChange={(value) => updateField('structure', value)} />
        </DrawerSection>

        <DrawerSection title="Models">
          <div className="grid gap-3">
            <SelectField label="Quick" value={form.quickModel} onChange={(value) => updateField('quickModel', value)} />
            <SelectField label="Deep" value={form.deepModel} onChange={(value) => updateField('deepModel', value)} />
            <SelectField label="Memo" value={form.memoModel} onChange={(value) => updateField('memoModel', value)} />
            <Field label="Cost ceiling per thread" value={form.costCeiling} prefix="$" onChange={(value) => updateField('costCeiling', value)} />
          </div>
        </DrawerSection>

        <DrawerSection title="Default attached case cores">
          <div className="space-y-2">
            <CoreListRow label="Syria Transition" detail="Active Case Core" />
            <button
              type="button"
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-dashed border-slate-300 px-3 py-2 text-sm font-semibold text-navy-800 hover:border-navy-400 hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" />
              Add case
            </button>
          </div>
        </DrawerSection>
      </div>

      <DrawerFooter saveState={saveState}>
        <Link
          href="/app/cores/me"
          onClick={onClose}
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-navy-800 hover:border-navy-300"
        >
          Open full editor
          <ArrowRight className="h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={() => void save()}
          className="inline-flex min-h-10 items-center gap-2 rounded-md bg-navy-950 px-3 py-2 text-sm font-semibold text-white hover:bg-navy-800"
        >
          <Save className="h-4 w-4" />
          Save now
        </button>
      </DrawerFooter>
    </>
  );
}

function SituationCoreDrawerBody({
  activeTab,
  setActiveTab,
  situation,
}: {
  activeTab: (typeof situationTabs)[number];
  setActiveTab: (tab: (typeof situationTabs)[number]) => void;
  situation?: V7CoreDrawerSituation | null;
}) {
  const workspaceHref = situation?.id ? `/app/workbench/${situation.id}` : '/app/workbench';
  const tabHref = (tab: string) => (situation?.id ? `/app/workbench/${situation.id}?tab=${tab}` : '/app/workbench');

  return (
    <>
      <div className="border-b border-slate-200 px-3 py-2">
        <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Case Core drawer tabs">
          {situationTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 rounded-md px-3 py-2 text-xs font-semibold ${
                activeTab === tab
                  ? 'bg-navy-950 text-white'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-navy-950'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {activeTab === 'Frame' && (
          <div className="space-y-4">
            <ReadonlyFrameField
              label="What's happening"
              value={situation ? `${situation.name} is the active case PRAXIS will use for this Ask thread.` : 'No active Situation has been selected yet.'}
            />
            <ReadonlyFrameField
              label="Why it matters"
              value={situation?.region ?? 'Open or create a Situation so PRAXIS can inherit the policy frame, actors, sources, graph, and outputs.'}
            />
            <ReadonlyFrameField
              label="What would change the assessment"
              value="Use Ask PRAXIS to surface gaps, then promote confirmed changes into the Case Core."
            />
            <ReadonlyFrameField
              label="Policy question"
              value="What should be verified, explained, drafted, or handed over next?"
            />
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-700">Ontology</p>
              <p className="mt-2 text-sm font-semibold text-navy-950">Conflict + local Situation extensions</p>
              <p className="mt-1 text-xs leading-5 text-slate-700">
                ACO primitives remain locked. Local subtypes are scoped to this Case Core.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'Actors' && (
          <ThinTab
            icon={UserRound}
            title={`${situation?.actorCount ?? 0} actors staged`}
            body="Quick-add and merge operations remain in the full workspace while the drawer keeps the case frame close to Ask PRAXIS."
            href={tabHref('ontology')}
            linkLabel="See actors"
          />
        )}
        {activeTab === 'Timeline' && (
          <ThinTab
            icon={Globe2}
            title="Episode view"
            body="The timeline is treated as episodic context: pre-event, event, post-event, and nested policy phases."
            href={tabHref('timeline')}
            linkLabel="Open timeline"
          />
        )}
        {activeTab === 'Sources' && (
          <ThinTab
            icon={Library}
            title={`${situation?.sourceCount ?? 0} source receipts`}
            body="Sources stay inside the Case Core. Users do not manage a separate Source Core in v7."
            href={tabHref('library')}
            linkLabel="Open sources"
          />
        )}
        {activeTab === 'Graph' && (
          <ThinTab
            icon={GitBranch}
            title={`${situation?.graphCount ?? 0} graph signals`}
            body="Actors, claims, events, and relationships stay accessible without making Graph Core a visible user concept."
            href={tabHref('graph')}
            linkLabel="Open graph"
          />
        )}
        {activeTab === 'Outputs' && (
          <ThinTab
            icon={FileText}
            title="Recent outputs"
            body="Memos, briefs, and handovers summarize here. Full editing remains in Outputs."
            href="/app/outputs"
            linkLabel="Open outputs"
          />
        )}
      </div>

      <DrawerFooter saveState="saved">
        <Link
          href={workspaceHref}
          className="inline-flex min-h-10 items-center gap-2 rounded-md bg-navy-950 px-3 py-2 text-sm font-semibold text-white hover:bg-navy-800"
        >
          Open in workspace
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/app/situations/new"
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-navy-800 hover:border-navy-300"
        >
          Fork / new Case
        </Link>
      </DrawerFooter>
    </>
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

function SelectField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 sm:grid-cols-[72px_minmax(0,1fr)] sm:items-center">
      <span className="text-xs font-semibold uppercase text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-navy-950 outline-none focus:border-navy-400"
      >
        <option value="gemini-3-flash">gemini-3-flash</option>
        <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview</option>
      </select>
    </label>
  );
}

function SegmentedControl({
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
    <div className="grid gap-2 sm:grid-cols-[92px_minmax(0,1fr)] sm:items-center">
      <p className="text-xs font-semibold uppercase text-slate-700">{label}</p>
      <div className="flex flex-wrap gap-1">
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

function DrawerSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6 border-t border-slate-200 pt-5">
      <h3 className="mb-3 text-sm font-semibold text-navy-950">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function DrawerFooter({ children, saveState }: { children: ReactNode; saveState: SaveState }) {
  return (
    <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <SaveStatus state={saveState} />
          <p className="mt-1 text-[11px] font-medium text-slate-600">Autosave runs after 600ms; Cmd/Ctrl+S saves immediately.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">{children}</div>
      </div>
    </div>
  );
}

function SaveStatus({ state }: { state: SaveState }) {
  const content = useMemo(() => {
    if (state === 'saving') return { icon: Loader2, label: 'Saving...', className: 'text-slate-700 animate-spin' };
    if (state === 'saved') return { icon: Check, label: 'Saved', className: 'text-emerald-700' };
    if (state === 'error') return { icon: X, label: 'Save failed', className: 'text-red-700' };
    if (state === 'dirty') return { icon: Save, label: 'Unsaved changes', className: 'text-amber-700' };
    return { icon: Check, label: 'Ready', className: 'text-slate-600' };
  }, [state]);

  const Icon = content.icon;
  return (
    <span className={`inline-flex items-center gap-2 text-xs font-semibold ${content.className}`}>
      <Icon className="h-4 w-4" />
      {content.label}
    </span>
  );
}

function CoreListRow({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <span>
        <span className="block text-sm font-semibold text-navy-950">{label}</span>
        <span className="block text-xs text-slate-700">{detail}</span>
      </span>
      <button type="button" className="text-xs font-semibold text-slate-600 hover:text-navy-950">
        remove
      </button>
    </div>
  );
}

function ReadonlyFrameField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-700">{label}</p>
      <p className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-navy-950">
        {value}
      </p>
    </div>
  );
}

function ThinTab({
  icon: Icon,
  title,
  body,
  href,
  linkLabel,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-gold-700 ring-1 ring-slate-200">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-navy-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-700">{body}</p>
      <Link href={href} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-navy-900 hover:text-navy-700">
        {linkLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function iconBoxClass(tone: 'blue' | 'purple') {
  return tone === 'blue'
    ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-800 ring-1 ring-blue-200'
    : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-purple-50 text-purple-800 ring-1 ring-purple-200';
}

function stringValue(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}
