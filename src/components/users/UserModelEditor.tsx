'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { UserModelRecord } from '@/lib/user-models/types';
import { forkUserModel, getUserModel, savePrivateUserModel, setActiveUserModel, userModelCurrentPath } from '@/lib/users/api';

const tabs = ['Identity', 'Mandate', 'Methodology', 'Style', 'Standing Assumptions', 'Prohibited Frames', 'Sources', 'Audience Defaults'] as const;

export function UserModelEditor({ seed, modelId }: { seed: UserModelRecord; modelId: string }) {
  const [model, setModel] = useState<UserModelRecord>(seed);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Identity');
  const [saved, setSaved] = useState(false);
  const readOnly = model.visibility === 'public-seed';

  useEffect(() => {
    setModel(getUserModel(window.localStorage, modelId) ?? seed);
  }, [modelId, seed]);

  function update(patch: Partial<UserModelRecord>) {
    setSaved(false);
    setModel((current) => ({ ...current, ...patch }));
  }

  function updateList(key: 'methodologyToolkit' | 'standingAssumptions' | 'prohibitedFrames' | 'audienceDefaults' | 'toolAffinities', value: string) {
    update({ [key]: value.split('\n').map((item) => item.trim()).filter(Boolean) } as Partial<UserModelRecord>);
  }

  function forkCurrent() {
    const forked = forkUserModel(window.localStorage, seed.modelId);
    setModel(forked);
    setSaved(true);
  }

  function save() {
    if (readOnly) return;
    setModel(savePrivateUserModel(window.localStorage, model));
    setSaved(true);
  }

  function activate() {
    setActiveUserModel(window.localStorage, model.modelId);
    setSaved(true);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950">
      <div className="mx-auto grid max-w-6xl gap-6">
        <header className="border-b border-slate-200 pb-5">
          <Link href="/app/cores/user" className="text-sm text-slate-600 hover:text-slate-950">Back to User Core</Link>
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{model.identity}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{model.role}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={activate} className="border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white">Set active</button>
              {readOnly ? (
                <button type="button" onClick={forkCurrent} className="border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">Fork to edit</button>
              ) : (
                <button type="button" onClick={save} className="border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">Save private model</button>
              )}
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">{readOnly ? 'Public seed is read-only.' : `Owner-scoped current path: ${userModelCurrentPath(model.modelId)}`}</p>
          {saved ? <p className="mt-2 text-sm font-medium text-emerald-700">Saved locally for this browser session.</p> : null}
        </header>
        <nav className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`border px-3 py-2 text-sm ${activeTab === tab ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700'}`}>
              {tab}
            </button>
          ))}
        </nav>
        <section className="border border-slate-200 bg-white p-5">
          {activeTab === 'Identity' && (
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Identity" value={model.identity} readOnly={readOnly} onChange={(value) => update({ identity: value })} />
              <TextField label="Role" value={model.role} readOnly={readOnly} onChange={(value) => update({ role: value })} />
              <TextField label="Work ontology" value={model.workOntologyId} readOnly={readOnly} onChange={(value) => update({ workOntologyId: value as UserModelRecord['workOntologyId'] })} />
              <TextField label="Organization" value={model.organization ?? ''} readOnly={readOnly} onChange={(value) => update({ organization: value })} />
            </div>
          )}
          {activeTab === 'Mandate' && <TextArea label="Mandate" value={model.mandate} readOnly={readOnly} onChange={(value) => update({ mandate: value })} />}
          {activeTab === 'Methodology' && <TextArea label="Methodology toolkit" value={model.methodologyToolkit.join('\n')} readOnly={readOnly} onChange={(value) => updateList('methodologyToolkit', value)} />}
          {activeTab === 'Style' && (
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Communication style" value={model.communicationStyle} readOnly={readOnly} onChange={(value) => update({ communicationStyle: value })} />
              <TextField label="Confidence tolerance" value={model.confidenceTolerance} readOnly={readOnly} onChange={(value) => update({ confidenceTolerance: value as UserModelRecord['confidenceTolerance'] })} />
              <TextField label="Citation format" value={model.outputPreferences.citationFormat} readOnly={readOnly} onChange={(value) => update({ outputPreferences: { ...model.outputPreferences, citationFormat: value } })} />
              <TextField label="Language posture" value={model.outputPreferences.languagePosture} readOnly={readOnly} onChange={(value) => update({ outputPreferences: { ...model.outputPreferences, languagePosture: value } })} />
            </div>
          )}
          {activeTab === 'Standing Assumptions' && <TextArea label="Standing assumptions" value={model.standingAssumptions.join('\n')} readOnly={readOnly} onChange={(value) => updateList('standingAssumptions', value)} />}
          {activeTab === 'Prohibited Frames' && <TextArea label="Prohibited frames" value={model.prohibitedFrames.join('\n')} readOnly={readOnly} onChange={(value) => updateList('prohibitedFrames', value)} />}
          {activeTab === 'Sources' && (
            <div className="grid gap-4 md:grid-cols-2">
              <TextArea label="Trusted sources" value={model.sourcePreferences.trusted.join('\n')} readOnly={readOnly} onChange={(value) => update({ sourcePreferences: { ...model.sourcePreferences, trusted: value.split('\n').map((item) => item.trim()).filter(Boolean) } })} />
              <TextArea label="Tool affinities" value={model.toolAffinities.join('\n')} readOnly={readOnly} onChange={(value) => updateList('toolAffinities', value)} />
            </div>
          )}
          {activeTab === 'Audience Defaults' && <TextArea label="Audience defaults" value={model.audienceDefaults.join('\n')} readOnly={readOnly} onChange={(value) => updateList('audienceDefaults', value)} />}
        </section>
      </div>
    </main>
  );
}

function TextField({ label, value, readOnly, onChange }: { label: string; value: string; readOnly: boolean; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-slate-600">{label}</span>
      <input value={value} readOnly={readOnly} onChange={(event) => onChange(event.target.value)} className="h-10 border border-slate-300 bg-white px-3" />
    </label>
  );
}

function TextArea({ label, value, readOnly, onChange }: { label: string; value: string; readOnly: boolean; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-slate-600">{label}</span>
      <textarea value={value} readOnly={readOnly} onChange={(event) => onChange(event.target.value)} className="min-h-72 border border-slate-300 bg-white p-3" />
    </label>
  );
}
