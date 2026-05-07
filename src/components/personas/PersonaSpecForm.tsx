'use client';

import { useState } from 'react';
import { Loader2, Save, ShieldCheck } from 'lucide-react';
import type { PersonaSpec } from '@/types/boardroom';
import { CorpusUploader, type CorpusEntryDraft } from '@/components/personas/CorpusUploader';
import { TestDeliberation } from '@/components/personas/TestDeliberation';
import { VoiceProfileEditor } from '@/components/personas/VoiceProfileEditor';

function splitLines(value: string) {
  return value.split('\n').map((line) => line.trim()).filter(Boolean);
}

export function PersonaSpecForm({ canonical }: { canonical: PersonaSpec[] }) {
  const [displayName, setDisplayName] = useState('Custom Regional Adviser');
  const [shortRole, setShortRole] = useState('Regional Adviser');
  const [professionalProfile, setProfessionalProfile] = useState('A workspace-authored regional adviser with field experience, local language context, and a narrow mandate to challenge assumptions using the uploaded corpus.');
  const [domains, setDomains] = useState('regional analysis\nmediation support');
  const [frameworks, setFrameworks] = useState('actor incentives\nfield-network mapping');
  const [questions, setQuestions] = useState('Which local actor would contest this?\nWhat evidence would change the recommendation?');
  const [blindSpots, setBlindSpots] = useState('May overfit to the uploaded workspace corpus.');
  const [toolIds, setToolIds] = useState('cross.red-team\nmediation.position-vs-interest');
  const [voiceRegister, setVoiceRegister] = useState<'formal' | 'professional' | 'plainspoken'>('professional');
  const [corpusEntries, setCorpusEntries] = useState<CorpusEntryDraft[]>([
    { title: 'Workspace field notes', citation: 'User-supplied workspace notes', license: 'workspace-restricted' },
  ]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/boardroom/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          shortRole,
          professionalProfile,
          domains: splitLines(domains),
          frameworks: splitLines(frameworks),
          signatureQuestions: splitLines(questions),
          blindSpots: splitLines(blindSpots),
          toolIds: splitLines(toolIds),
          corpusEntries: corpusEntries.filter((entry) => entry.title && entry.citation && entry.license),
          voiceRegister,
        }),
      });
      if (!res.ok) throw new Error(`Custom persona save failed (${res.status})`);
      const json = await res.json() as { persona: PersonaSpec; persistence?: { persisted: boolean; reason?: string } };
      setMessage(json.persistence?.persisted === false
        ? `Previewed ${json.persona.displayName}. Sign in with a full workspace to persist it.`
        : `Saved ${json.persona.displayName}.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not save custom persona.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-gold-600" />
            <div>
              <h1 className="text-xl font-semibold text-navy-950">Custom personas</h1>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Author workspace-scoped boardroom experts with declared corpora and tool affinity. They stay sandboxed to their declared sources and tools.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2">
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="rounded-md border border-slate-200 px-3 py-2 text-sm" />
          <input value={shortRole} onChange={(event) => setShortRole(event.target.value)} className="rounded-md border border-slate-200 px-3 py-2 text-sm" />
          <textarea value={professionalProfile} onChange={(event) => setProfessionalProfile(event.target.value)} className="min-h-28 rounded-md border border-slate-200 px-3 py-2 text-sm md:col-span-2" />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <TextArea label="Domains" value={domains} onChange={setDomains} />
          <TextArea label="Frameworks" value={frameworks} onChange={setFrameworks} />
          <TextArea label="Signature questions" value={questions} onChange={setQuestions} />
          <TextArea label="Blind spots" value={blindSpots} onChange={setBlindSpots} />
          <TextArea label="Tool affinity" value={toolIds} onChange={setToolIds} />
        </div>

        <VoiceProfileEditor register={voiceRegister} onChange={setVoiceRegister} />
        <CorpusUploader entries={corpusEntries} onChange={setCorpusEntries} />

        {message ? <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-navy-950">{message}</p> : null}
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-navy-950 px-4 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save persona
        </button>
      </section>

      <aside className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-navy-950">Canonical boardroom</h2>
          <div className="mt-3 space-y-2">
            {canonical.slice(0, 10).map((persona) => (
              <div key={persona.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-navy-950">{persona.shortRole}</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">{persona.expertise.domains.slice(0, 2).join(', ')}</p>
              </div>
            ))}
          </div>
        </div>
        <TestDeliberation question={questions.split('\n')[0] ?? ''} />
      </aside>
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block rounded-lg border border-slate-200 bg-white p-3">
      <span className="text-xs font-semibold text-navy-950">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-24 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
    </label>
  );
}
