'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { ProjectScopeSchema, projectScope, type ProjectRecord, type ProjectScope, type ProjectView } from '@/lib/projects/schema';
import { emptyProjectScope, ProjectScopeForm, projectButtonClass } from './project-scope-form';
import { ProjectWorkPanel, type ProjectAction } from './project-work-panel';

async function request<T>(url: string, method = 'GET', body?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { method, credentials: 'include', cache: 'no-store', signal,
    headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? 'Request failed. Keep your edits and retry.');
  return result;
}

function projectUrl(id: string) {
  const url = new URL(window.location.href); url.searchParams.set('projectId', id);
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}`);
}

export function ProjectWorkspace() {
  const { user } = useAuth();
  const owner = user?.id;
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loadedOwner, setLoadedOwner] = useState<string | undefined>();
  const [project, setProject] = useState<ProjectView | null>(null);
  const [formRevision, setFormRevision] = useState(0);
  const [workFormRevision, setWorkFormRevision] = useState(0);
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState('');
  const [dirtyScope, setDirtyScope] = useState(false);
  const [dirtyWork, setDirtyWork] = useState(false);
  const dirty = dirtyScope || dirtyWork;
  const operation = useRef<{ body: string; id: string } | null>(null);
  const submitting = useRef(false);
  const generation = useRef(0);
  const currentOwner = useRef(owner);
  currentOwner.current = owner;
  const pendingCreateKey = `praxis-pending-project-create:${owner}`;
  function operationId(body: unknown, persistCreation: boolean) {
    const serialized = JSON.stringify(body);
    if (persistCreation) {
      // A committed creation can lose its response. Reuse its key after refresh;
      // this cache is an outstanding request receipt, never a canonical project.
      let stored: string | null;
      try { stored = sessionStorage.getItem(pendingCreateKey); }
      catch { throw new Error('Browser request recovery is unavailable. Enable session storage before creating a project so a lost response can be retried safely.'); }
      if (stored) {
        let pendingCreation: { body?: unknown; id?: unknown };
        try { pendingCreation = JSON.parse(stored); }
        catch { throw new Error('The pending creation receipt is unreadable. Open saved work before starting another project.'); }
        if (typeof pendingCreation.id !== 'string' || !/^[a-zA-Z0-9_-]{8,100}$/.test(pendingCreation.id)) throw new Error('The pending creation receipt is invalid. Open saved work before starting another project.');
        if (pendingCreation.body !== serialized) throw new Error('A prior creation may already be saved. Choose New project to restore its original request and retry unchanged, or open its saved record before starting another.');
        operation.current = { body: serialized, id: pendingCreation.id };
      }
    }
    if (operation.current?.body !== serialized) operation.current = { body: serialized, id: crypto.randomUUID() };
    if (persistCreation) {
      try { sessionStorage.setItem(pendingCreateKey, JSON.stringify(operation.current)); }
      catch { throw new Error('Browser request recovery is unavailable. No creation request was sent. Enable session storage and retry.'); }
    }
    return operation.current.id;
  }
  function clearEditorRecovery() {
    try { for (const editor of ['scope', 'work']) sessionStorage.removeItem(`praxis-unsaved-project:${owner}:${project?.projectId ?? 'new'}:${editor}`); } catch { /* Recovery cache is optional; canonical saved work is unaffected. */ }
  }
  async function reconcileCreation(id: string) {
    try {
      const stored = sessionStorage.getItem(pendingCreateKey);
      if (!stored) return;
      const pendingCreation = JSON.parse(stored);
      if (typeof pendingCreation?.id !== 'string') return;
      const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify([owner, pendingCreation.id])));
      const hash = Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
      if (id === `project_${hash.slice(0, 32)}`) sessionStorage.removeItem(pendingCreateKey);
    } catch { /* Failed reconciliation retains the key; retrying the same creation remains safe. */ }
  }
  function startProject() {
    if (dirty && !window.confirm('Discard unsaved changes and start a new project?')) return;
    let recoveredCreation = false;
    try {
      const stored = sessionStorage.getItem(pendingCreateKey);
      if (stored) {
        const pendingCreation = JSON.parse(stored);
        const scope = ProjectScopeSchema.parse(JSON.parse(pendingCreation.body).scope);
        // The request receipt retains the original payload even if the editable
        // draft was discarded or changed before an uncertain server response.
        sessionStorage.setItem(`praxis-unsaved-project:${owner}:new:scope`, JSON.stringify({ value: scope, revision: 0 }));
        recoveredCreation = true;
      }
    } catch { setError('Pending creation recovery is unavailable. Keep your current edits and inspect saved projects before retrying.'); return; }
    if (dirty && (!recoveredCreation || project)) clearEditorRecovery();
    ++generation.current; setCreating(true); setProject(null); setFormRevision((value) => value + 1);
    setDirtyScope(false); setDirtyWork(false); setError(''); operation.current = null;
    setReceipt(recoveredCreation ? 'Recovered the original pending creation request. Retry it unchanged to establish the saved result, then edit that project.' : '');
  }
  useEffect(() => {
    const controller = new AbortController();
    const token = ++generation.current;
    queueMicrotask(() => { setLoadedOwner(owner); setProject(null); setProjects([]); setCreating(false); setDirtyScope(false); setDirtyWork(false); setError(''); setReceipt(''); setPending(false); });
    operation.current = null;
    if (owner) void request<{ projects: ProjectRecord[] }>('/api/projects', 'GET', undefined, controller.signal).then((result) => { if (token === generation.current) setProjects(result.projects); }).catch((error: Error) => { if (!controller.signal.aborted) setError(error.message); });
    const initialId = new URL(window.location.href).searchParams.get('projectId');
    if (owner && initialId && /^[a-zA-Z0-9_-]{1,120}$/.test(initialId)) void request<{ project: ProjectView }>(`/api/projects/${initialId}`, 'GET', undefined, controller.signal).then(async (result) => {
      if (token !== generation.current) return;
      await reconcileCreation(result.project.projectId);
      if (token === generation.current) { setProject(result.project); setFormRevision((value) => value + 1); }
    }).catch((error: Error) => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
    // Requests and recovery use this owner generation; helpers must not restart it on each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner]);
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    const navigate = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('a') : null;
      if (dirty && target && target.target !== '_blank' && !window.confirm('This page has unsaved changes. Leave this editor? Temporary drafts can be recovered when you return in this browser.')) { event.preventDefault(); event.stopPropagation(); }
    };
    const programmatic = (event: Event) => { if (dirty && !window.confirm('This project has unsaved changes. Leave this editor? Temporary drafts can be recovered when you return in this browser.')) event.preventDefault(); };
    window.addEventListener('beforeunload', unload); document.addEventListener('click', navigate, true);
    window.addEventListener('praxis-before-workspace-navigation', programmatic);
    return () => { window.removeEventListener('beforeunload', unload); document.removeEventListener('click', navigate, true); window.removeEventListener('praxis-before-workspace-navigation', programmatic); };
  }, [dirty]);
  async function open(id: string) {
    if (submitting.current || dirty && !window.confirm('Discard unsaved changes and open the saved project?')) return;
    if (dirty) clearEditorRecovery();
    const token = ++generation.current;
    setPending(true); setError(''); setReceipt('');
    try {
      const result = await request<{ project: ProjectView }>(`/api/projects/${encodeURIComponent(id)}`);
      if (token !== generation.current) return;
      await reconcileCreation(result.project.projectId);
      if (token !== generation.current) return;
      setProject(result.project); projectUrl(result.project.projectId); setCreating(false); setFormRevision((value) => value + 1); setWorkFormRevision((value) => value + 1); setDirtyScope(false); setDirtyWork(false); operation.current = null;
    } catch (error) { if (token === generation.current) setError((error as Error).message); }
    finally { if (token === generation.current) setPending(false); }
  }
  async function save(body: unknown, url: string, method: string, scopeSaved = false): Promise<boolean> {
    if (!owner || submitting.current) return false;
    submitting.current = true; setPending(true); setError(''); setReceipt('');
    const requestOwner = owner;
    const token = generation.current;
    try {
      const payload = { ...(body as object), operationId: operationId(body, method === 'POST') };
      const result = await request<{ project: ProjectRecord; persisted: boolean }>(url, method, payload);
      if (currentOwner.current !== requestOwner || token !== generation.current) return false;
      if (!result.persisted) throw new Error('Persistence was not confirmed. Keep your edits and retry.');
      if (method === 'POST') { try { sessionStorage.removeItem(pendingCreateKey); } catch { /* Same receipt remains safe for reconciliation. */ } }
      setProject({ ...result.project, contextStatus: result.project.context.map((pin) => {
        const old = project?.context.find((item) => item.capsuleId === pin.capsuleId && item.contentHash === pin.contentHash);
        return old && project?.contextStatus.find((item) => item.capsuleId === pin.capsuleId) || { capsuleId: pin.capsuleId, status: 'available', latestVersion: pin.version };
      }) });
      setProjects((current) => [result.project, ...current.filter((item) => item.projectId !== result.project.projectId)]);
      setCreating(false); setReceipt(`Saved ${result.project.projectId} · revision ${result.project.revision}`); operation.current = null;
      projectUrl(result.project.projectId);
      if (scopeSaved) { setFormRevision((value) => value + 1); setDirtyScope(false); }
      return true;
    } catch (error) { if (currentOwner.current === requestOwner) setError((error as Error).message); return false; }
    finally { submitting.current = false; if (currentOwner.current === requestOwner) setPending(false); }
  }
  async function command(action: ProjectAction, expectedRevision?: number) {
    if (!project) return false;
    if (dirtyScope && action.action === 'add-work') { setError('Save the edited project scope before capturing a new assignment.'); return false; }
    return save({ ...action, expectedRevision: expectedRevision ?? project.revision }, `/api/projects/${encodeURIComponent(project.projectId)}`, 'PATCH');
  }
  async function saveScope(scope: ProjectScope, expectedRevision?: number) {
    return creating ? save({ scope }, '/api/projects', 'POST', true) : project ? save({ action: 'scope', scope, expectedRevision: expectedRevision ?? project.revision }, `/api/projects/${encodeURIComponent(project.projectId)}`, 'PATCH', true) : false;
  }
  if (loadedOwner !== owner) return <main className="p-6" role="status">Loading private projects…</main>;
  return <main className="mx-auto grid w-full max-w-6xl min-w-0 gap-5 p-4 sm:p-6" data-testid="project-workspace">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="font-serif text-3xl">Projects</h1><p className="mt-2 text-sm text-[var(--color-app-text-secondary)]">Continuing questions, explicit scope and private saved assignments.</p></div><button type="button" disabled={pending || !owner} className={projectButtonClass} onClick={startProject}>New project</button></header>
    {error ? <p role="alert" className="rounded border border-amber-600 p-3 text-sm">{error}</p> : null}
    {receipt ? <p role="status" className="break-all text-sm">{receipt}</p> : null}
    {pending ? <p role="status" className="text-sm">Saving or loading project…</p> : null}
    <div className="grid min-w-0 gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="min-w-0"><h2 className="mb-3 text-sm font-semibold">Recent private projects</h2><p className="mb-3 text-xs">Up to 100 most recent projects. Older work remains accessible by its project link.</p>{projects.length ? <ul className="grid gap-2">{projects.map((item) => <li key={item.projectId}><button type="button" disabled={pending} className={`${projectButtonClass} w-full break-words text-left ${project?.projectId === item.projectId ? 'bg-emerald-50 text-emerald-950' : ''}`} onClick={() => void open(item.projectId)}>{item.title}</button></li>)}</ul> : <p className="text-sm">No saved projects yet. Create one to define your assignment.</p>}</aside>
      <div className="min-w-0 space-y-6">
        {creating || project ? <>
          <section aria-label="Project scope" className="min-w-0 space-y-3"><h2 className="text-lg font-semibold">{creating ? 'New private project' : project?.title}</h2>{project ? <p className="break-all text-xs">Private · {project.projectId} · revision {project.revision}</p> : null}<ProjectScopeForm key={`${project?.projectId ?? 'new'}:${formRevision}`} draftKey={`${owner}:${project?.projectId ?? 'new'}:scope`} revision={project?.revision ?? 0} initial={project ? projectScope(project) : emptyProjectScope} pending={pending} submitLabel={creating ? 'Create private project' : 'Save scope'} onSave={saveScope} onDirty={setDirtyScope} /></section>
          {project ? <><ProjectWorkPanel key={`${project.projectId}:${workFormRevision}`} project={project} pending={pending} onCommand={command} onDirty={setDirtyWork} /><details className="border-t border-[var(--color-app-border)] pt-3"><summary className="min-h-11 cursor-pointer text-sm font-semibold">Project change history</summary><ul className="text-sm">{project.history.map((entry) => <li key={entry.revision}>r{entry.revision} · {entry.action} · {entry.actorUid} · {entry.at}</li>)}</ul></details><button type="button" disabled={pending} className={projectButtonClass} onClick={() => void open(project.projectId)}>Reload saved project</button></> : null}
        </> : <p className="text-sm">Open a saved project or create a private project. Existing chats and Context Capsules remain in their current library.</p>}
      </div>
    </div>
  </main>;
}
