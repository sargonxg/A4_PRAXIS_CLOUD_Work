'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import type { HostedRegistryEntry, HostedRegistryList, HostedRegistryRequest } from '@/lib/cognitive-capsule/hosted-registry-contract';

const button = 'min-h-11 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold disabled:opacity-50';
const field = 'min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm';
const base = '/api/context/capsule-registry';
type RegistryImpact = {
  target: { name: string; version: string; digest: string };
  directDependents: Array<{ name: string; version: string; digest: string }>;
  transitiveDependents: Array<{ name: string; version: string; digest: string }>;
  installations: Array<{ name: string; version: string; draftCapsuleId: string }>;
  capsuleConsumers: Array<{ capsuleId: string; version: number; label: string }>;
  complete: boolean; activeRunImpact: string;
};

export function RegistryDependencyImpact({ impact }: { impact: RegistryImpact }) {
  return <section aria-label="Dependency impact" className="min-w-0 space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
    <h3 className="break-words text-sm font-semibold text-slate-950">Impact of {impact.target.name} · {impact.target.version}</h3>
    <p>{impact.directDependents.length} directly dependent registry versions · {impact.transitiveDependents.length} direct or indirect dependent versions · {impact.capsuleConsumers.length} saved capsules · {impact.installations.length} installed drafts.</p>
    <p>{impact.complete ? 'This inventory covers the inspected owner registry and saved capsules.' : 'This inventory reached its scan limit. More affected items may exist.'} Active workflow and agent usage is not indexed.</p>
    <details><summary className="min-h-11 cursor-pointer font-semibold">Exact dependency version</summary><p className="break-all">{impact.target.name} @ {impact.target.version} · {impact.target.digest}</p></details>
    {impact.capsuleConsumers.length ? <div><h4 className="font-semibold text-slate-900">Saved capsules to review</h4><ul className="mt-1 space-y-1">{impact.capsuleConsumers.map((consumer) => <li key={consumer.capsuleId}><Link className="inline-flex min-h-11 items-center break-words underline" href={`/app/capsules?${new URLSearchParams({ starter: consumer.capsuleId, lane: 'inspect' })}`}>{consumer.label} · v{consumer.version}</Link></li>)}</ul></div> : null}
    {impact.installations.length ? <div><h4 className="font-semibold text-slate-900">Installed drafts to review</h4><ul className="mt-1 space-y-1">{impact.installations.map((installation) => <li key={installation.draftCapsuleId}><Link className="inline-flex min-h-11 items-center break-words underline" href={`/app/capsules?${new URLSearchParams({ starter: installation.draftCapsuleId, lane: 'inspect' })}`}>{installation.name} · {installation.version}</Link></li>)}</ul></div> : null}
    {impact.transitiveDependents.length ? <details><summary className="min-h-11 cursor-pointer font-semibold">Dependent registry versions</summary><ul className="space-y-2">{impact.transitiveDependents.map((entry) => <li key={`${entry.name}@${entry.version}`} className="break-words"><p>{entry.name} · {entry.version}{impact.directDependents.some((direct) => direct.name === entry.name && direct.version === entry.version && direct.digest === entry.digest) ? ' · direct dependency' : ' · indirect dependency'}</p><details><summary className="min-h-10 cursor-pointer underline">Exact artifact lock</summary><p className="break-all">{entry.digest}</p></details></li>)}</ul></details> : null}
    <p>These links identify review work. Updating a dependency does not promote or rewrite the affected capsules.</p>
  </section>;
}

export function CapsuleRegistryPanel({ capsuleId, capsuleVersion }: { capsuleId: string; capsuleVersion?: number }) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<HostedRegistryList | null>(null);
  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [draft, setDraft] = useState<{ draftCapsuleId: string; reviewCardId: string } | null>(null);
  const [impact, setImpact] = useState<RegistryImpact | null>(null);
  const identity = useRef(capsuleId); identity.current = capsuleId;
  const reload = async (cursor?: string) => {
    const owner = capsuleId;
    const response = await fetch(`${base}${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`, { credentials: 'include' });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? 'Registry is unavailable.');
    if (owner !== identity.current) return;
    setList(previous => cursor && previous ? { ...payload, entries: [...previous.entries, ...payload.entries] } : payload);
  };
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setList(null); setDraft(null); setImpact(null);
    fetch(base, { credentials: 'include' }).then(async response => {
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Registry is unavailable.');
      if (!cancelled) { setList(payload); setNotice(''); }
    }).catch(error => { if (!cancelled) setNotice(error.message); });
    return () => { cancelled = true; };
  }, [open, capsuleId]);
  async function mutate(request: HostedRegistryRequest) {
    setBusy(true); setNotice('');
    const owner = capsuleId;
    try {
      const response = await fetch(base, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) });
      if (!response.ok) { const failed = await response.json(); throw new Error(failed.error ?? 'Registry operation failed.'); }
      if (request.operation === 'fork') {
        const objectUrl = URL.createObjectURL(await response.blob());
        const anchor = document.createElement('a'); anchor.href = objectUrl; anchor.download = `${request.newName.replace('/', '-')}.capsule`; anchor.click(); URL.revokeObjectURL(objectUrl);
        if (owner === identity.current) setNotice('Private fork downloaded. Review it before use.');
      } else {
        const payload = await response.json();
        if (owner !== identity.current) return;
        const staged = payload.installation ?? payload;
        if (staged.draftCapsuleId && staged.reviewCardId) setDraft(staged);
        setNotice(request.operation === 'publish' ? 'Exact snapshot published to your private registry.' : request.operation === 'deprecate' ? 'Version deprecated. Existing historical bytes and locks are retained.' : 'Installation staged for human review.');
        await reload();
      }
    } catch (error) { if (owner === identity.current) setNotice(error instanceof Error ? error.message : 'Registry operation failed.'); }
    finally { setBusy(false); }
  }
  async function inspectImpact(entry: HostedRegistryEntry) {
    setBusy(true);
    try {
      const query = new URLSearchParams({ name: entry.name, version: entry.version });
      const response = await fetch(`${base}/impact?${query}`, { credentials: 'include' });
      const payload = await response.json(); if (!response.ok) throw new Error(payload.error ?? 'Dependency impact is unavailable.');
      if (!payload.target?.name || !Array.isArray(payload.directDependents) || !Array.isArray(payload.transitiveDependents) || !Array.isArray(payload.installations) || !Array.isArray(payload.capsuleConsumers)) throw new Error('Dependency impact could not be read. Retry the inventory.');
      setImpact(payload);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Dependency impact is unavailable.'); }
    finally { setBusy(false); }
  }
  function publish(event: FormEvent) {
    event.preventDefault();
    if (capsuleVersion) void mutate({ operation: 'publish', capsuleId, envelopeVersion: capsuleVersion, name });
  }
  return <details className="min-w-0 rounded-md border border-slate-200 p-3" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary className="min-h-11 cursor-pointer text-sm font-semibold">Private capsule registry</summary>
    {open ? <div className="mt-3 min-w-0 space-y-3">
      <p className="text-xs text-slate-600">Publish immutable snapshots, inspect exact dependencies, and stage installations for review. Rights and proposed records remain visible.</p>
      <form className="flex flex-wrap items-end gap-2" onSubmit={publish}>
        <label className="min-w-0 flex-1 text-xs">Registry name (publisher/name)<input className={field} value={name} onChange={event => setName(event.target.value)} pattern="[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+" maxLength={200} required /></label>
        <button className={button} disabled={busy || !capsuleVersion}>Publish saved v{capsuleVersion ?? '?'}</button>
      </form>
      <label className="block text-xs">Reason for deprecating a version<input className={field} value={reason} onChange={event => setReason(event.target.value)} maxLength={600} /></label>
      <p role="status" className="break-words text-xs text-slate-700">{notice || (!list ? 'Loading your registry…' : `${list.entries.length} private versions loaded.`)}</p>
      {draft ? <Link className="inline-flex min-h-11 items-center text-sm underline" href={`/app/capsules?starter=${encodeURIComponent(draft.draftCapsuleId)}&lane=inspect`}>Open installed draft for review</Link> : null}
      {list?.entries.map(entry => {
        const installed = list.installations.find(item => item.name === entry.name);
        const query = new URLSearchParams({ name: entry.name, version: entry.version });
        return <article key={`${entry.name}@${entry.version}`} className="min-w-0 space-y-2 break-words rounded-md border border-slate-200 p-3">
          <p className="text-sm font-semibold">{entry.name} · {entry.version}</p>
          <p className="text-xs">{entry.profile} · {entry.rights.mode} · {entry.deprecated ? `Deprecated: ${entry.deprecated}` : 'Available'}{installed?.version === entry.version ? ' · Installed for review' : ''}</p>
          <p className="text-xs text-slate-600">Depth {entry.quality.cognitiveDepth} · {entry.trust.humanReviewedRecords} human-reviewed / {entry.trust.proposedRecords} proposed. Factual truth is not verified by publication.</p>
          <p className="text-xs text-slate-500">Artifact {entry.digest}</p>
          {entry.dependencies.length ? <ul className="list-inside list-disc text-xs">{entry.dependencies.map(dep => <li key={`${dep.name}@${dep.version}`}>{dep.name} @ {dep.version} · {dep.digest}</li>)}</ul> : <p className="text-xs">No declared dependencies.</p>}
          <div className="flex flex-wrap gap-2">
            <a className={button} href={`${base}/artifact?${query}`}>Download exact version</a>
            <button className={button} disabled={busy || Boolean(entry.deprecated)} onClick={() => void mutate({ operation: 'install', name: entry.name, version: entry.version })}>Install for review</button>
            {installed && installed.version !== entry.version ? <button className={button} disabled={busy || Boolean(entry.deprecated)} onClick={() => void mutate({ operation: 'update', name: entry.name, version: entry.version, expectedDigest: installed.digest })}>Stage update from {installed.version}</button> : null}
            <button className={button} disabled={busy} onClick={() => void inspectImpact(entry)}>Dependency impact</button>
            <button className={button} disabled={busy || !reason.trim() || Boolean(entry.deprecated)} onClick={() => void mutate({ operation: 'deprecate', name: entry.name, version: entry.version, reason })}>Deprecate with reason</button>
            <button className={button} disabled={busy || !name.trim() || name === entry.name} onClick={() => void mutate({ operation: 'fork', name: entry.name, version: entry.version, newName: name })}>Download private fork as entered name</button>
          </div>
        </article>;
      })}
      {list?.hasMore && list.nextCursor ? <button className={button} disabled={busy} onClick={() => { setBusy(true); void reload(list.nextCursor!).catch(error => setNotice(error.message)).finally(() => setBusy(false)); }}>Load more versions</button> : null}
      {impact ? <RegistryDependencyImpact impact={impact} /> : null}
    </div> : null}
  </details>;
}
