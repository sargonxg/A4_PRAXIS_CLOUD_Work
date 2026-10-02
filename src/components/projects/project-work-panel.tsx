'use client';

import { useEffect, useState } from 'react';
import { z } from 'zod';
import type { ProjectMutation, ProjectView } from '@/lib/projects/schema';
import { projectButtonClass, projectInputClass } from './project-scope-form';
import { useProjectDraft } from './use-project-draft';

// Distribute Omit across the command union so payload fields remain typed.
export type ProjectAction = ProjectMutation extends infer T ? T extends ProjectMutation ? Omit<T, 'expectedRevision' | 'operationId'> : never : never;
const WorkDraftSchema = z.object({ title: z.string().max(200), instruction: z.string().max(4000), output: z.enum(['brief', 'stakeholder-map', 'notes', 'scenario-comparison', 'talking-points']) }).strict();
export function ProjectWorkPanel({ project, pending, onCommand, onDirty }: { project: ProjectView; pending: boolean; onCommand: (command: ProjectAction, expectedRevision?: number) => Promise<boolean>; onDirty: (dirty: boolean) => void }) {
  const workDraft = useProjectDraft<z.infer<typeof WorkDraftSchema>>(`${project.ownerUid}:${project.projectId}:work`, { title: '', instruction: '', output: 'brief' }, project.revision, WorkDraftSchema, onDirty);
  const { title, instruction, output } = workDraft.value;
  const setTitle = (value: string) => workDraft.update({ ...workDraft.value, title: value });
  const setInstruction = (value: string) => workDraft.update({ ...workDraft.value, instruction: value });
  const setOutput = (value: typeof output) => workDraft.update({ ...workDraft.value, output: value });
  const [capsuleId, setCapsuleId] = useState('');
  const [version, setVersion] = useState(1);
  const [role, setRole] = useState<'user' | 'situation' | 'tool' | 'output'>('situation');
  const [library, setLibrary] = useState<{ capsuleId: string; label: string; version: number }[]>([]);
  const [libraryError, setLibraryError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/context/capsules', { credentials: 'include', cache: 'no-store', signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error('Saved capsule list is unavailable. Retry in the library or enter an existing ID and version.');
      const result = await response.json();
      if (!controller.signal.aborted) setLibrary((Array.isArray(result.capsules) ? result.capsules : []).filter((capsule: { ownerUid?: string; version?: number }) => capsule.ownerUid === project.ownerUid && Number.isSafeInteger(capsule.version)));
    }).catch((error: Error) => { if (!controller.signal.aborted) setLibraryError(error.message); });
    return () => controller.abort();
  }, [project.ownerUid]);
  return <div className="grid min-w-0 gap-6">
    <section aria-labelledby="project-context-title" className="grid min-w-0 gap-3 border-t border-[var(--color-app-border)] pt-5">
      <h2 id="project-context-title" className="text-lg font-semibold">Selected context</h2>
      <p className="text-sm text-[var(--color-app-text-secondary)]">References pin a saved revision and its content hash. Attaching is separate from reviewing its assertions. Roles describe the content; they grant no permissions.</p>
      {project.context.length ? <ul className="grid gap-3">{project.context.map((pin) => {
        const status = project.contextStatus.find((item) => item.capsuleId === pin.capsuleId);
        return <li key={pin.capsuleId} className="min-w-0 rounded border border-[var(--color-app-border)] p-3">
          <p className="break-words font-medium">{pin.label} · v{pin.version} · {pin.role} · Private</p>
          <p className="text-sm">{pin.documentIds.length} document references · {pin.sourceIds.length} source references</p>
          {status?.status !== 'available' ? <p role="alert">{status?.status === 'changed' ? 'Snapshot changed: new work is blocked until you inspect and deliberately reattach.' : 'Context unavailable. New work is blocked.'}</p> : null}
          {status?.latestVersion && status.latestVersion > pin.version ? <p className="text-sm">Newer v{status.latestVersion} exists. This project still uses v{pin.version}.</p> : null}
          <details className="mt-2 text-sm"><summary className="min-h-11 cursor-pointer">Inspect reference</summary><p className="break-all">{pin.capsuleId} · SHA-256 {pin.contentHash}</p><p className="break-all">Documents: {pin.documentIds.join(', ') || 'None'}<br />Sources: {pin.sourceIds.join(', ') || 'None'}</p><a target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center underline" href={`/app/capsules?${new URLSearchParams({ lane: 'inspect', starter: pin.capsuleId })}`}>Open capsule inspector in a new tab</a></details>
          <button type="button" disabled={pending} className={projectButtonClass} onClick={() => void onCommand({ action: 'detach', capsuleId: pin.capsuleId })}>Detach {pin.label}</button>
        </li>;
      })}</ul> : <p className="text-sm">No capsule selected. This project starts with empty context.</p>}
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={async (event) => { event.preventDefault(); if (await onCommand({ action: 'attach', capsuleId, version, role })) setCapsuleId(''); }}>
        <label className="grid gap-1 text-sm sm:col-span-2">Choose a saved capsule<select className={projectInputClass} disabled={pending} value={library.some((capsule) => capsule.capsuleId === capsuleId) ? capsuleId : ''} onChange={(event) => { const selected = library.find((capsule) => capsule.capsuleId === event.target.value); if (selected) { setCapsuleId(selected.capsuleId); setVersion(selected.version); } }}><option value="">Select from your private library, or enter a reference below</option>{library.map((capsule) => <option value={capsule.capsuleId} key={capsule.capsuleId}>{capsule.label} · v{capsule.version}</option>)}</select></label>
        {libraryError ? <p role="status" className="text-sm sm:col-span-2">{libraryError}</p> : null}
        <label className="grid gap-1 text-sm">Saved capsule ID<input className={projectInputClass} value={capsuleId} maxLength={120} required disabled={pending} onChange={(event) => setCapsuleId(event.target.value)} /></label>
        <label className="grid gap-1 text-sm">Exact capsule version<input className={projectInputClass} type="number" min="1" step="1" value={version} required disabled={pending} onChange={(event) => setVersion(Number(event.target.value))} /></label>
        <label className="grid gap-1 text-sm">Context role<select className={projectInputClass} value={role} disabled={pending} onChange={(event) => setRole(event.target.value as typeof role)}>{['user', 'situation', 'tool', 'output'].map((value) => <option key={value}>{value}</option>)}</select></label>
        <button className={projectButtonClass} disabled={pending} type="submit">Attach selected revision</button>
      </form>
    </section>
    <section aria-labelledby="project-work-title" className="grid gap-3 border-t border-[var(--color-app-border)] pt-5">
      <h2 id="project-work-title" className="text-lg font-semibold">Work items</h2>
      <p className="text-sm text-[var(--color-app-text-secondary)]">Save a bounded assignment with this project’s scope and selected context. These records are drafts. Project dispatch and deliverable creation are not connected yet.</p>
      {workDraft.recovered ? <p role="status" className="text-sm">Recovered an unsaved assignment from this browser. Save to persist it on the server.</p> : null}
      {workDraft.storageUnavailable ? <p role="status" className="text-sm">Browser draft recovery is unavailable. Save before navigating.</p> : null}
      <form className="grid gap-3" onSubmit={async (event) => {
        event.preventDefault();
        if (await onCommand({ action: 'add-work', title, instruction, output }, workDraft.expectedRevision)) { workDraft.clear(); workDraft.update({ title: '', instruction: '', output: 'brief' }); onDirty(false); }
      }}>
        <label className="grid gap-1 text-sm">Work item title<input className={projectInputClass} value={title} maxLength={200} required disabled={pending} onChange={(event) => { setTitle(event.target.value); onDirty(Boolean(event.target.value || instruction)); }} /></label>
        <label className="grid gap-1 text-sm">Bounded instruction<textarea className={projectInputClass} rows={4} value={instruction} maxLength={4000} required disabled={pending} onChange={(event) => { setInstruction(event.target.value); onDirty(Boolean(title || event.target.value)); }} /></label>
        <label className="grid gap-1 text-sm">Requested output<select className={projectInputClass} value={output} disabled={pending} onChange={(event) => setOutput(event.target.value as typeof output)}>{['brief', 'stakeholder-map', 'notes', 'scenario-comparison', 'talking-points'].map((value) => <option key={value}>{value}</option>)}</select></label>
        <button type="submit" className={projectButtonClass} disabled={pending || project.contextStatus.some((item) => item.status !== 'available')}>Save draft work item</button>
      </form>
      <ul className="grid gap-3">{project.workItems.map((work) => <li key={work.workItemId} className="min-w-0 rounded border border-[var(--color-app-border)] p-3">
        <p className="break-words font-medium">{work.title} · {work.state} · {work.output}</p><p className="whitespace-pre-wrap break-words text-sm">{work.instruction}</p>
        <details className="text-sm"><summary className="min-h-11 cursor-pointer">Captured scope and context</summary><p className="break-all">{work.workItemId} · project revision {work.projectRevision}</p><p>Question: {work.scope.question}<br />Audience: {work.scope.audience || 'Unspecified'}<br />Cutoff: {work.scope.asOfDate ?? 'Unknown'}</p><ul>{work.context.map((pin) => <li key={pin.capsuleId}>{pin.label} · v{pin.version}</li>)}</ul></details>
        {work.state === 'draft' ? <button className={projectButtonClass} type="button" disabled={pending} onClick={() => void onCommand({ action: 'cancel-work', workItemId: work.workItemId })}>Cancel draft {work.title}</button> : null}
      </li>)}</ul>
    </section>
  </div>;
}
