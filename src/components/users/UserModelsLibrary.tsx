'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { UserModelRecord } from '@/lib/user-models/types';
import { forkUserModel, getActiveUserModelId, listPrivateUserModels, setActiveUserModel } from '@/lib/users/api';

export function UserModelsLibrary({ publicModels }: { publicModels: UserModelRecord[] }) {
  const [privateModels, setPrivateModels] = useState<UserModelRecord[]>([]);
  const [activeModelId, setActiveModelId] = useState('foreign-policy-analyst');

  useEffect(() => {
    setPrivateModels(listPrivateUserModels(window.localStorage));
    setActiveModelId(getActiveUserModelId(window.localStorage));
  }, []);

  function activate(modelId: string) {
    setActiveUserModel(window.localStorage, modelId);
    setActiveModelId(modelId);
  }

  function fork(modelId: string) {
    const forked = forkUserModel(window.localStorage, modelId);
    setPrivateModels(listPrivateUserModels(window.localStorage));
    setActiveModelId(forked.modelId);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950">
      <div className="mx-auto grid max-w-7xl gap-8">
        <header className="border-b border-slate-200 pb-6">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">PRAXIS Users</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">User models</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-650">Choose the working posture PRAXIS should use when framing sources, methods, and drafts. Public models are read-only; forks are private.</p>
          <div className="mt-4 border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            Active model: <span className="font-medium text-slate-950">{activeModelId}</span>
          </div>
        </header>
        <section className="grid gap-4">
          <div>
            <h2 className="text-xl font-semibold">My models</h2>
            <p className="mt-1 text-sm text-slate-600">Private forks stored under the owner-scoped user-model path.</p>
          </div>
          {privateModels.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {privateModels.map((model) => <ModelCard key={model.modelId} model={model} active={activeModelId === model.modelId} onActivate={activate} />)}
            </div>
          ) : (
            <div className="border border-slate-200 bg-white p-5 text-sm text-slate-600">No private forks yet. Fork a public model to edit it.</div>
          )}
        </section>
        <section className="grid gap-4">
          <div>
            <h2 className="text-xl font-semibold">Public library</h2>
            <p className="mt-1 text-sm text-slate-600">The three seeded MVP personas. They can be activated or forked, but not edited directly.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {publicModels.map((model) => (
              <ModelCard key={model.modelId} model={model} active={activeModelId === model.modelId} onActivate={activate} onFork={fork} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function ModelCard({ model, active, onActivate, onFork }: { model: UserModelRecord; active: boolean; onActivate: (modelId: string) => void; onFork?: (modelId: string) => void }) {
  return (
    <article className="grid gap-4 border border-slate-200 bg-white p-4">
      <div>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold">{model.identity}</h3>
          {active ? <span className="border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">Active</span> : null}
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">{model.role}</p>
      </div>
      <p className="text-sm leading-6 text-slate-650">{model.mandate}</p>
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="border border-slate-200 bg-slate-50 px-2 py-1">{model.workOntologyId}</span>
        <span className="border border-slate-200 bg-slate-50 px-2 py-1">{model.communicationStyle}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onActivate(model.modelId)} className="border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white">
          Use this model
        </button>
        {onFork ? (
          <button type="button" onClick={() => onFork(model.modelId)} className="border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">
            Fork
          </button>
        ) : null}
        <Link href={`/users/${model.modelId}`} className="border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">
          Open
        </Link>
      </div>
    </article>
  );
}
