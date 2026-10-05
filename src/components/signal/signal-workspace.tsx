'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { SIGNAL_COUNTRIES } from '@/lib/signal/geography';
import { getSignalClaimStatus } from '@/lib/signal/visualizations';
import type { SignalSource, SignalBrief, SignalDesk } from '@/lib/signal/schema';
import { SignalEvidenceNetwork } from './signal-evidence-network';
import { SignalMediaLandscape } from './signal-media-landscape';
import { SignalCoverageGlobe } from './signal-coverage-globe';
import { SignalFeedbackPanel } from './signal-feedback-panel';
const tabs = ['Overview', 'Coverage', 'Narratives', 'Evidence', 'Context', 'Briefs'] as const;
type Tab = typeof tabs[number];
type Source = SignalSource;
type Brief = SignalBrief;
type Desk = SignalDesk;
type Detail = {
    desk: Desk;
    graph?: {
        nodes: Record<string, unknown>[];
        edges: Record<string, unknown>[];
    };
    metrics?: Record<string, unknown>;
    context?: unknown;
};
const inputClass = 'min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700';
const buttonClass = 'min-h-11 inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-50';
const primaryClass = 'min-h-11 inline-flex items-center justify-center rounded-lg border border-emerald-800 bg-emerald-800 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-50';
function date(value?: string | null) { if (!value)
    return 'Not recorded'; const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString(); }
function Empty({ children }: {
    children: ReactNode;
}) { return <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-5 text-sm text-stone-600">{children}</p>; }
function Card({ title, children }: {
    title: string;
    children: ReactNode;
}) { return <section className="min-w-0 rounded-xl border border-stone-200 bg-white p-4 [overflow-wrap:anywhere] sm:p-6"><h3 className="mb-4 text-base font-semibold text-stone-900">{title}</h3>{children}</section>; }
function fields(event: FormEvent<HTMLFormElement>) { event.preventDefault(); return new FormData(event.currentTarget); }
function text(data: FormData, key: string) { return String(data.get(key) ?? '').trim(); }
function csv(value: string) { return value.split(',').map(item => item.trim()).filter(Boolean); }
export function SignalWorkspace() {
    const { firebaseUser, user, loading: authLoading } = useAuth();
    const [gdeltEnabled, setGdeltEnabled] = useState(false);
    const [desks, setDesks] = useState<Desk[]>([]);
    const [detail, setDetail] = useState<Detail | null>(null);
    const [tab, setTab] = useState<Tab>('Overview');
    const [newDesk, setNewDesk] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [activeSource, setActiveSource] = useState('');
    const [activeClaim, setActiveClaim] = useState('');
    const [activeInterpretation, setActiveInterpretation] = useState('');
    const [inspectionSequence, setInspectionSequence] = useState(0);
    useEffect(() => {
        if (!activeInterpretation) return;
        const frame = requestAnimationFrame(() => { const element = document.getElementById(`signal-interpretation-${activeInterpretation}`); element?.focus(); element?.scrollIntoView({ block: 'nearest' }); });
        return () => cancelAnimationFrame(frame);
    }, [activeInterpretation, inspectionSequence, tab]);
    const requestRevision = useRef(0);
    const invalidateRequests = useCallback(() => { ++requestRevision.current; }, []);
    const ownerId = user?.id ?? null;
    const [loadedOwner, setLoadedOwner] = useState<string | null>(null);
    const currentOwner = useRef(ownerId);
    currentOwner.current = ownerId;
    const desk = detail?.desk;
    const judgmentsBlocked = busy || Boolean(desk?.contextStale);
    const source = desk?.sources.find(item => item.id === activeSource) ?? desk?.sources[0];
    const claim = desk?.claims.find(item => item.id === activeClaim) ?? desk?.claims.filter(item => item.sourceRevisionId === source?.id).slice(-1)[0];
    const api = useCallback(async (url: string, body?: Record<string, unknown>, method = body ? 'POST' : 'GET') => {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (firebaseUser)
            headers.Authorization = `Bearer ${await firebaseUser.getIdToken()}`;
        const response = await fetch(url, { method, credentials: 'include', headers, ...(body ? { body: JSON.stringify(body) } : {}) });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            const message = response.status === 409 ? 'This desk changed in another window. Reload the latest revision, inspect it, and try again.' : response.status === 401 ? 'Please sign in again to access your SIGNAL desks.' : response.status === 403 ? 'You do not have permission to access this desk.' : data.error?.message ?? data.error ?? 'The operation failed. Your saved work remains available.';
            throw new Error(typeof message === 'string' ? message : 'The operation failed. Please retry.');
        }
        return data;
    }, [firebaseUser]);
    const loadDesk = useCallback(async (id: string) => {
        const revision = ++requestRevision.current;
        setBusy(true);
        setError('');
        setDetail(null);
        try {
            const result: Detail = await api(`/api/signal?deskId=${encodeURIComponent(id)}`);
            if (revision !== requestRevision.current)
                return;
            setDetail(result);
            setActiveSource('');
            setActiveClaim('');
            const url = new URL(window.location.href);
            const linkedVersion = url.searchParams.get('revision');
            if (url.searchParams.get('desk') === id && linkedVersion && Number(linkedVersion) !== result.desk.version)
                setNotice('This link points to an earlier desk revision. You are viewing the latest saved revision.');
            url.searchParams.set('desk', id);
            url.searchParams.delete('revision');
            window.history.replaceState(null, '', url);
        }
        catch (err) {
            if (revision === requestRevision.current)
                setError(err instanceof Error ? err.message : 'Unable to load desk.');
        }
        finally {
            if (revision === requestRevision.current)
                setBusy(false);
        }
    }, [api]);
    useEffect(() => {
        invalidateRequests();
        setLoadedOwner(null); setDesks([]); setDetail(null); setActiveSource(''); setActiveClaim(''); setActiveInterpretation(''); setError(''); setNotice(''); setNewDesk(false);
        if (authLoading || !ownerId) { setBusy(false); return; }
        let cancelled = false;
        setBusy(true);
        api('/api/signal').then(async (result) => {
            if (cancelled)
                return;
            setLoadedOwner(ownerId);
            setDesks(result.desks ?? []);
            setGdeltEnabled(Boolean(result.capabilities?.gdelt));
            const query = new URLSearchParams(window.location.search);
            const requestedTab = query.get('view');
            if (tabs.includes(requestedTab as Tab))
                setTab(requestedTab as Tab);
            const id = query.get('desk') ?? result.desks?.[0]?.id;
            if (id)
                await loadDesk(id);
            else
                setNewDesk(true);
        }).catch(err => { if (!cancelled) {
            setLoadedOwner(ownerId); setError(err.message); } }).finally(() => { if (!cancelled)
            setBusy(false); });
        return () => { cancelled = true; invalidateRequests(); };
    }, [api, authLoading, invalidateRequests, loadDesk, ownerId]);
    async function act(action: string, values: Record<string, unknown> = {}, route = '/api/signal'): Promise<boolean> {
        const revision = requestRevision.current;
        const current = () => revision === requestRevision.current && currentOwner.current === ownerId;
        if (busy || !current())
            return false;
        if (desk?.contextStale && ['analyze', 'propose', 'review', 'proposeNarrative', 'proposeAssessment', 'reviewInterpretation', 'draftBrief', 'approveBrief', 'editBrief'].includes(action)) {
            setError('Rebuild stale context before creating or reviewing interpretations. Historical approved work remains available.');
            return false;
        }
        setBusy(true);
        setError('');
        setNotice('');
        try {
            const result = await api(route, { action, ...(desk && action !== 'create' ? { deskId: desk.id, expectedVersion: desk.version } : {}), ...values });
            if (!current()) return false;
            if (result.desk) {
                setDesks(current => [result.desk, ...current.filter(item => item.id !== result.desk.id)]);
                const next: Detail = await api(`/api/signal?deskId=${encodeURIComponent(result.desk.id)}`);
                if (!current()) return false;
                setDetail(next);
                setNewDesk(false);
                const url = new URL(window.location.href);
                url.searchParams.set('desk', result.desk.id);
                window.history.replaceState(null, '', url);
            }
            else if (desk) {
                const next: Detail = await api(`/api/signal?deskId=${encodeURIComponent(desk.id)}`);
                if (!current()) return false;
                setDetail(next);
            }
            setNotice(action === 'analyze' ? 'Analysis completed. Proposals require evidence review.' : action === 'feedback' ? 'Feedback saved privately to this desk.' : 'Saved.');
            return true;
        }
        catch (err) {
            if (current()) setError(err instanceof Error ? err.message : 'Unable to save.');
            return false;
        }
        finally {
            if (current()) setBusy(false);
        }
    }
    function selectTab(next: Tab) { setTab(next); const url = new URL(window.location.href); url.searchParams.set('view', next); window.history.replaceState(null, '', url); }
    async function deleteDesk() {
      if (!desk || busy) return;
      const revision = requestRevision.current;
      const current = () => revision === requestRevision.current && currentOwner.current === ownerId;
      setBusy(true); setError('');
      try {
        await api(`/api/signal?deskId=${encodeURIComponent(desk.id)}&expectedVersion=${desk.version}`, undefined, 'DELETE');
        if (!current()) return;
        const remaining = desks.filter(item => item.id !== desk.id);
        setDesks(remaining); setDetail(null); setNewDesk(remaining.length === 0);
        const url = new URL(window.location.href); url.searchParams.delete('desk'); window.history.replaceState(null, '', url);
        setNotice('Desk deleted.');
        if (remaining[0]) await loadDesk(remaining[0].id);
      } catch (err) { if (current()) setError(err instanceof Error ? err.message : 'Unable to delete desk.'); }
      finally { if (current()) setBusy(false); }
    }
    async function exportBrief(brief: Brief, format = 'brief') {
        const revision = requestRevision.current;
        const current = () => revision === requestRevision.current && currentOwner.current === ownerId;
        setBusy(true);
        setError('');
        try {
            const headers: Record<string, string> = {};
            if (firebaseUser)
                headers.Authorization = `Bearer ${await firebaseUser.getIdToken()}`;
            const response = await fetch(`/api/signal?deskId=${encodeURIComponent(desk!.id)}&export=${format}&briefId=${encodeURIComponent(brief.id)}`, { credentials: 'include', headers });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(typeof data.error === 'string' ? data.error : 'Export unavailable. Check approval and source permissions.');
            }
            const blob = await response.blob();
            if (!current()) return;
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = response.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] ?? `signal-${brief.id}.${response.headers.get('Content-Type')?.includes('json') ? 'json' : 'md'}`;
            anchor.click();
            URL.revokeObjectURL(url);
        }
        catch (err) {
            if (current()) setError(err instanceof Error ? err.message : 'Export failed.');
        }
        finally {
            if (current()) setBusy(false);
        }
    }
    function inspect(selection: { sourceRevisionId?: string; claimId?: string; interpretationId?: string }) {
        if (selection.sourceRevisionId || selection.claimId) {
            setActiveSource(selection.sourceRevisionId ?? desk?.claims.find(item => item.id === selection.claimId)?.sourceRevisionId ?? '');
            setActiveClaim(selection.claimId ?? ''); selectTab('Evidence');
        } else if (selection.interpretationId) {
            const narrative = desk?.narratives?.find(item => item.id === selection.interpretationId);
            const assessment = desk?.assessments?.find(item => item.id === selection.interpretationId);
            if (narrative || assessment) { setActiveInterpretation(selection.interpretationId); setInspectionSequence(value => value + 1); selectTab(narrative ? 'Narratives' : 'Overview'); }
        }
    }
    if (authLoading || (user && loadedOwner !== ownerId))
        return <main className="p-6" aria-busy="true">Loading your workspace…</main>;
    if (!user)
        return <main className="mx-auto max-w-3xl p-8"><h1 className="text-3xl font-semibold">SIGNAL</h1><p className="my-4">Sign in to PRAXIS to collect evidence, review claims and prepare traceable briefs.</p><Link href="/login?redirect=%2Fsignal" className={primaryClass}>Sign in to PRAXIS</Link></main>;
    return <main className="mx-auto min-h-screen w-full min-w-0 max-w-7xl bg-stone-50/60 p-4 text-stone-900 sm:p-6" aria-busy={busy}>
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-emerald-800">PRAXIS · Policy intelligence</p><h1 className="mt-1 text-3xl font-semibold">SIGNAL</h1><p className="mt-2 max-w-2xl text-sm text-stone-600">From original evidence to reviewed claims and approved briefs.</p></div><nav aria-label="Workspace navigation" className="flex gap-2"><Link className={buttonClass} href="/app">Home</Link><Link className={buttonClass} href="/app/capsules">Capsules</Link></nav></header>
    {error && <div role="alert" className="mb-4 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">{error}{!desk && <button className={`${buttonClass} ml-3`} disabled={busy} onClick={() => window.location.reload()}>Retry workspace</button>}{desk && <button className={`${buttonClass} ml-3`} disabled={busy} onClick={() => loadDesk(desk.id)}>Reload desk</button>}</div>}
    {notice && <p role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}
    {busy && <p role="status" className="mb-3 text-sm text-stone-600">Working…</p>}
    <div className="mb-5 flex flex-wrap items-end gap-3"><label className="min-w-0 flex-1 text-sm font-medium">Saved desks<select aria-label="Saved desks" value={desk?.id ?? ''} disabled={busy} className={`${inputClass} mt-1`} onChange={event => { setNewDesk(false); void loadDesk(event.target.value); }}><option value="" disabled>Select a desk</option>{desks.map(item => <option key={item.id} value={item.id}>{item.name} · {item.scope.label}</option>)}</select></label><button className={primaryClass} disabled={busy} onClick={() => setNewDesk(true)}>Create desk</button></div>
    {newDesk && <Card title="Create a desk"><DeskForm busy={busy} onSave={values => void act('create', values)}/><button className={`${buttonClass} mt-4`} onClick={() => setNewDesk(false)}>Cancel</button></Card>}
    {desk && !newDesk && <>
      {desk.contextStale && <div role="alert" className="mb-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-semibold">Context is stale</p><p className="mt-1">Source evidence or accepted readings changed after this context was built. Rebuild context before analysis, proposals, reviews or new briefs. Earlier approved artifacts retain their pinned evidence and remain available for permitted exports.</p><button className={`${primaryClass} mt-3`} disabled={busy} onClick={() => void act('context')}>Rebuild context</button></div>}
      <section className="mb-5 min-w-0 rounded-xl border border-emerald-200 bg-emerald-50/70 p-5"><div className="flex flex-wrap justify-between gap-4"><div><h2 className="text-xl font-semibold">{desk.name}</h2><p className="mt-1 font-medium">{desk.question}</p><p className="mt-2 text-sm text-stone-700">{desk.scope.label} · {desk.scope.countries.join(', ')} · {desk.languages.join(', ')} · {desk.windowDays}-day window</p><p className="mt-1 text-xs text-stone-600">For {desk.audience} · Revision {desk.version} · Updated {date(desk.updatedAt)}</p></div><button className={buttonClass} disabled={busy} onClick={() => act('watch', { watched: !desk.watched })}>{desk.watched ? 'Pause watch' : 'Watch desk'}</button></div><p className="mt-3 text-xs text-stone-700">{desk.sources.length} captured revisions · {desk.claims.filter(item => getSignalClaimStatus(desk, item) === 'accepted').length}/{desk.claims.length} current accepted claims · {desk.briefs.filter(item => item.status === 'approved').length} approved briefs. Captured source attention does not measure public opinion or audience reach.</p><CoverageStatus metrics={detail.metrics}/><DeleteDeskForm deskName={desk.name} busy={busy} onDelete={() => void deleteDesk()} /> </section>
      <div role="tablist" aria-label="SIGNAL views" className="mb-5 flex overflow-x-auto border-b border-stone-200">{tabs.map((item, index) => <button key={item} id={`signal-tab-${item}`} role="tab" aria-selected={tab === item} aria-controls={`signal-panel-${item}`} tabIndex={tab === item ? 0 : -1} onClick={() => selectTab(item)} onKeyDown={event => { const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1; if (next >= 0) {
            event.preventDefault();
            selectTab(tabs[next]);
            document.getElementById(`signal-tab-${tabs[next]}`)?.focus();
        } }} className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-emerald-700 ${tab === item ? 'border-emerald-800 text-emerald-900' : 'border-transparent text-stone-600'}`}>{item}</button>)}</div>
      <div role="tabpanel" id={`signal-panel-${tab}`} aria-labelledby={`signal-tab-${tab}`} className="grid min-w-0 gap-5">
        {tab === 'Overview' && <><InterpretationPanel kind="assessment" desk={desk} busy={judgmentsBlocked} onAction={(action, values) => void act(action, values)} /><Card title="Latest approved assessment">{desk.briefs.filter(item => item.status === 'approved').slice(-1).map(item => <div key={item.id}><p className="mb-2 text-xs">Approved {date(item.approvedAt)}{item.stale && ' · New evidence needs reassessment'}</p><p className="whitespace-pre-wrap text-sm">{item.text}</p><button className={`${buttonClass} mt-3`} onClick={() => selectTab('Briefs')}>Inspect pinned brief</button></div>)}{!desk.briefs.some(item => item.status === 'approved') && <Empty>No approved assessment yet. Capture original sources, review proposed readings, then draft and approve a brief.</Empty>}</Card><Card title="Coverage and open questions"><p className="mb-3 text-sm">Collection is limited to the configured source panel. Country selection does not imply complete media coverage.</p><p className="text-sm">{desk.sources.length ? `Latest capture: ${date(desk.sources.slice(-1)[0]?.capturedAt)}` : 'Discovery mode: no sources captured. Configure a source pack or add permissioned text in Coverage.'}</p><p className="mt-2 text-sm">{desk.claims.filter(item => item.status === 'unresolved' || item.stale).length} unresolved or stale readings require review.</p><button className={`${buttonClass} mt-3`} onClick={() => selectTab('Coverage')}>Configure coverage</button></Card><Card title="Collection and analysis receipts">{desk.runs.length ? <ul className="space-y-3">{desk.runs.slice().reverse().map(run => <li key={run.id} className="rounded-lg border p-3 text-sm"><p className="font-medium">{run.provider} · {run.status}</p><p>{date(run.startedAt)} · {run.count} returned items{run.saturated && ' · Result limit reached: coverage incomplete'}</p>{run.error && <p className="mt-1 text-red-800">{run.error}</p>}</li>)}</ul> : <Empty>No collection or analysis has run.</Empty>}</Card></>}
        {tab === 'Coverage' && <><SignalCoverageGlobe desk={desk} onInspect={inspect} /><Card title="Media landscape"><SignalMediaLandscape desk={desk} onInspect={inspect} /></Card><Card title="Desk mandate and source panel"><DeskForm key={`${desk.id}-${desk.version}`} gdeltEnabled={gdeltEnabled} desk={desk} busy={busy} onSave={values => void act('configure', values)}/></Card><Card title="Collect source discovery links"><p className="mb-4 text-sm text-stone-600">GDELT results are discovery headlines. They are not captured article text and cannot support original-text claim extraction. Provider failures remain visible in receipts. {!gdeltEnabled && 'GDELT is disabled in this release pending a successful live provider check; permissioned RSS and supplied text remain available.'}</p><form onSubmit={event => { const data = fields(event); void act('collect', { provider: text(data, 'provider'), ...(text(data, 'provider') === 'gdelt' ? { query: text(data, 'query') } : {}) }); }} className="flex flex-wrap gap-3"><select name="provider" defaultValue={gdeltEnabled && desk.sourcePack.allowGdelt ? 'gdelt' : 'rss'} aria-label="Collection provider" className={`${inputClass} sm:w-52`}><option value="gdelt" disabled={!gdeltEnabled || !desk.sourcePack.allowGdelt}>GDELT headlines</option><option value="rss" disabled={!desk.sourcePack.feeds.length}>Configured RSS feeds</option></select><input className={`${inputClass} min-w-0 flex-1`} aria-label="Discovery query" name="query" placeholder="Precise search query for GDELT" maxLength={160}/><button className={primaryClass} disabled={busy || (!(gdeltEnabled && desk.sourcePack.allowGdelt) && !desk.sourcePack.feeds.length)}>Collect configured sources</button></form></Card><Card title="Capture permissioned original text"><CaptureForm busy={busy} onSave={values => void act('capture', values)}/></Card><Card title="Deeper media"><p className="mb-3 text-sm text-stone-600">Image and video analysis require an explicitly enabled provider and verified capture rights.</p><button disabled className={buttonClass}>Image analysis unavailable</button><button disabled className={`${buttonClass} ml-2`}>Video analysis unavailable</button></Card></>}
        {tab === 'Narratives' && <><Card title="3D evidence network"><SignalEvidenceNetwork desk={desk} onInspect={inspect} /></Card><InterpretationPanel kind="narrative" desk={desk} busy={judgmentsBlocked} onAction={(action, values) => void act(action, values)} /><Card title="Attributed readings"><p className="mb-4 text-sm text-stone-600">These are source-linked claim proposals and reviewed readings. Multiple mentions alone do not establish independent confirmation or geopolitical change.</p>{desk.claims.length ? <ul className="space-y-3">{desk.claims.map(item => <li key={item.id}><button className="w-full rounded-lg border border-stone-200 p-4 text-left hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-emerald-700" onClick={() => { setActiveSource(item.sourceRevisionId); setActiveClaim(item.id); selectTab('Evidence'); }}><p className="font-medium"><bdi>{item.proposition}</bdi></p><p className="mt-1 text-sm text-stone-600"><bdi>{item.speaker || 'Speaker not specified'}</bdi> · {item.status}{item.stale && ' · stale'} · {item.polarity} · {item.modality}</p><p className="mt-1 text-xs">{item.frame || 'No frame specified'} · {desk.sources.find(receipt => receipt.id === item.sourceRevisionId)?.language ?? 'Language unknown'}</p></button></li>)}</ul> : <Empty>No narrative readings yet. Add original evidence, then run analysis or propose an attributed reading.</Empty>}</Card><Card title="Evidence relationships">{detail.graph?.edges.length ? <ul className="space-y-2">{detail.graph.edges.map((edge, index) => <li key={index} className="break-words rounded-lg border p-3 text-sm"><span>{({ reports_claim: 'Source reports reading', member_of_narrative: 'Reading belongs to narrative', depends_on: 'Assessment depends on reading' } as Record<string, string>)[String(edge.predicate)] ?? 'Evidence relationship'}</span>: <bdi>{String(detail.graph?.nodes.find(node => node.id === (edge.source ?? edge.from))?.label ?? edge.source ?? edge.from ?? '')}</bdi> → <bdi>{String(detail.graph?.nodes.find(node => node.id === (edge.target ?? edge.to))?.label ?? edge.target ?? edge.to ?? '')}</bdi><pre className="mt-2 overflow-auto whitespace-pre-wrap text-xs">{`Source: ${desk.sources.find(item => item.id === edge.sourceRevisionId)?.title ?? String(edge.sourceRevisionId ?? 'No source receipt')}\nReview: ${String(edge.status ?? 'Not reviewed')}`}</pre></li>)}</ul> : <Empty>No source-linked relationships available.</Empty>}</Card></>}
        {tab === 'Evidence' && <><Card title="Source revisions"><select className={inputClass} aria-label="Inspect source revision" value={source?.id ?? ''} onChange={event => { setActiveSource(event.target.value); setActiveClaim(''); }}><option value="" disabled>Select captured evidence</option>{desk.sources.map(item => <option key={item.id} value={item.id}>{item.title} · {item.language}{item.withdrawn ? ' · withdrawn' : ''}{item.synthetic ? ' · synthetic' : ''}</option>)}</select>{!desk.sources.length && <div className="mt-4"><Empty>No evidence captured. Add permissioned text in Coverage.</Empty></div>}</Card>{source && <div className="grid items-start gap-5 lg:grid-cols-2"><Card title="Original source representation"><p className="font-medium"><bdi>{source.title}</bdi></p>{source.url && /^https?:\/\//i.test(source.url) && <a className="mt-1 inline-block break-all text-sm text-emerald-800 underline" href={source.url} target="_blank" rel="noopener noreferrer">Open original source</a>}<dl className="my-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs"><dt>Language</dt><dd>{source.language}</dd><dt>Coverage country</dt><dd>{source.coverageCountry ? `${SIGNAL_COUNTRIES.find(country => country.code === source.coverageCountry)?.name ?? source.coverageCountry} · analyst assigned` : 'Unmapped / not assigned'}</dd><dt>Published</dt><dd>{date(source.publicationTime)}</dd><dt>Captured</dt><dd>{date(source.capturedAt)}</dd><dt>Rights</dt><dd>{source.rights.basis} · {source.rights.allowExport ? 'Export permitted' : 'Restricted export'}</dd><dt>Revision</dt><dd className="break-all"><bdi>{source.id}</bdi></dd><dt>Integrity hash</dt><dd className="break-all"><bdi>{source.hash}</bdi></dd></dl>{source.synthetic && <p className="mb-2 text-sm text-amber-800">Synthetic evidence; not a real-world observation.</p>}{source.withdrawn && <p className="mb-2 text-sm text-red-800">This source has been withdrawn. Dependent readings need review.</p>}<div dir="auto" className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-lg bg-stone-50 p-4 text-sm leading-relaxed">{claim?.sourceRevisionId === source.id && source.text.slice(claim.start, claim.end) === claim.quote ? <>{source.text.slice(0, claim.start)}<mark className="bg-amber-200">{source.text.slice(claim.start, claim.end)}</mark>{source.text.slice(claim.end)}</> : source.text || 'Headline discovery only; original text has not been captured.'}</div><p className="mt-2 text-xs text-stone-600">Original-language representation. No translation is substituted for canonical source text.</p><button className={`${primaryClass} mt-4`} disabled={judgmentsBlocked || source.kind !== 'original_text' || source.withdrawn} onClick={() => act('analyze', { sourceRevisionId: source.id }, '/api/ai/signal')}>Analyze original text</button><button className={`${buttonClass} ml-2 mt-4`} disabled={busy || source.withdrawn} onClick={() => act('withdraw', { sourceRevisionId: source.id })}>Withdraw revision</button></Card><div className="grid gap-5"><Card title="Review attributed reading">{desk.claims.filter(item => item.sourceRevisionId === source.id).length > 0 && <select className={`${inputClass} mb-4`} aria-label="Select proposed reading" value={claim?.id ?? ''} onChange={event => setActiveClaim(event.target.value)}>{desk.claims.filter(item => item.sourceRevisionId === source.id).map(item => <option key={item.id} value={item.id}>{item.proposition} · {item.status}</option>)}</select>}{claim && claim.sourceRevisionId === source.id ? <><p className="font-medium"><bdi>{claim.proposition}</bdi></p><blockquote dir="auto" className="my-3 border-l-2 border-emerald-700 pl-3 text-sm">{claim.quote}</blockquote><p className="text-xs">Exact locator {claim.start}–{claim.end} · {claim.status}{claim.stale && ' · STALE: requires renewed review'}</p><dl className="my-3 space-y-1 text-sm">{[['Speaker', claim.speaker], ['Polarity', claim.polarity], ['Modality', claim.modality], ['Conditions', claim.conditions], ['Time', claim.time], ['Place', claim.place], ['Frame', claim.frame]].map(([key, value]) => <div key={key}><dt className="inline font-medium">{key}: </dt><dd className="inline"><bdi>{value || 'Not specified'}</bdi></dd></div>)}</dl><form onSubmit={event => { const data = fields(event); void act('review', { claimId: claim.id, digest: claim.digest, decision: text(data, 'decision'), rationale: text(data, 'rationale') }); }} className="grid gap-3"><label className="text-sm">Decision<select aria-label="Review decision" name="decision" className={`${inputClass} mt-1`}><option value="accepted">Accept reading</option><option value="rejected">Reject reading</option><option value="unresolved">Leave unresolved</option></select></label><label className="text-sm">Review rationale<textarea aria-label="Review rationale" name="rationale" required minLength={5} maxLength={2000} className={`${inputClass} mt-1`} rows={3} placeholder="Explain what the source supports, qualifications and uncertainty."/></label><button className={primaryClass} disabled={judgmentsBlocked || source.withdrawn || claim.stale}>Save review receipt</button></form><ul className="mt-4 space-y-2 text-xs">{desk.reviews.filter(item => item.targetId === claim.id).map(item => <li key={item.id} className="rounded-lg bg-stone-50 p-3">{item.decision} · {date(item.createdAt)}<p className="mt-1"><bdi>{item.rationale}</bdi></p></li>)}</ul></> : <Empty>No reading proposed for this revision. Run analysis or add an exact quotation below.</Empty>}</Card><Card title="Propose a reading"><ProposalForm key={source.id} source={source} busy={judgmentsBlocked} onSave={values => void act('propose', { sourceRevisionId: source.id, ...values })}/></Card></div></div>}</>}
        {tab === 'Context' && <><Card title="Attach reviewed context"><p className="mb-4 text-sm text-stone-600">Context helps interpret captured evidence. It does not establish new facts or replace source review. Changing context reopens affected readings and briefs: propose and review the original readings again against the new context before drafting.</p><form className="grid gap-3" onSubmit={event => { const data = fields(event); void act('context', { ...(text(data, 'capsuleId') ? { capsuleId: text(data, 'capsuleId') } : {}) }); }}><label className="text-sm">Existing PRAXIS capsule ID<input aria-label="Context capsule ID" name="capsuleId" className={`${inputClass} mt-1`} defaultValue={desk.capsuleId ?? ''} maxLength={100} placeholder="Leave empty to create context from accepted evidence"/></label><button className={primaryClass} disabled={busy}>Build or attach context capsule</button></form>{desk.capsuleId && <Link className="mt-4 inline-block text-sm text-emerald-800 underline" href={`/app/capsules?starter=${encodeURIComponent(desk.capsuleId)}&lane=inspect`}>Inspect attached context capsule</Link>}</Card><Card title="Context receipt">{detail.context ? <pre className="overflow-auto whitespace-pre-wrap break-words text-xs">{JSON.stringify(detail.context, null, 2)}</pre> : <Empty>No context receipt available. Attach a reviewed capsule to ground interpretation.</Empty>}</Card></>}
        {tab === 'Briefs' && <><Card title="Prepare a reviewed deliverable"><p className="mb-4 text-sm text-stone-600">A draft references current reviewed evidence and its limits. Approval pins the exact text and evidence manifest; edits create a new draft. New evidence may flag an earlier approved brief as stale without rewriting it.</p><button className={primaryClass} disabled={judgmentsBlocked || !desk.claims.some(item => getSignalClaimStatus(desk, item) === 'accepted')} onClick={() => act('draftBrief')}>Draft brief from reviewed evidence</button></Card>{desk.briefs.length ? desk.briefs.slice().reverse().map(item => <BriefCard key={`${item.id}-${item.digest}`} brief={item} busy={busy} judgmentsBlocked={judgmentsBlocked} onEdit={value => void act('editBrief', { briefId: item.id, text: value })} onApprove={rationale => void act('approveBrief', { briefId: item.id, digest: item.digest, rationale })} onExport={format => void exportBrief(item, format)}/>) : <Empty>No briefs yet. Accept at least one current source reading to prepare a draft.</Empty>}</>}
      </div>
      <SignalFeedbackPanel key={desk.id} desk={desk} area={tab} busy={busy} onSave={input => act('feedback', input)} />
    </>}
  </main>;
}
function CoverageStatus({ metrics }: {
    metrics?: Record<string, unknown>;
}) {
    if (!metrics)
        return null;
    const limitations = Array.isArray(metrics.limitations) ? metrics.limitations.filter((item): item is string => typeof item === 'string') : [];
    return <div className="mt-3 border-t border-emerald-200 pt-3 text-xs text-stone-700"><p>Coverage: {String(metrics.coverage ?? 'unconfigured')} · Panel revision {String(metrics.panelVersion ?? 'Not configured')} · Latest collection {date(typeof metrics.latestCollectionAt === 'string' ? metrics.latestCollectionAt : null)} · {String(metrics.collectionFailures ?? 0)} failed collection attempts / {String(metrics.collectionAttempts ?? 0)} total attempts.</p>{limitations.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5">{limitations.map(item => <li key={item}>{item}</li>)}</ul>}</div>;
}
function DeskForm({ desk, busy, onSave, gdeltEnabled = false }: {
    desk?: Desk;
    gdeltEnabled?: boolean;
    busy: boolean;
    onSave: (value: Record<string, unknown>) => void;
}) {
    const [kind, setKind] = useState(desk?.scope.kind ?? 'country');
    const [search, setSearch] = useState('');
    const [countries, setCountries] = useState<string[]>(desk?.scope.countries ?? []);
    const [panelEdited, setPanelEdited] = useState(false);
    return <form className="grid gap-4" onSubmit={event => { const data = fields(event); const feeds = text(data, 'feeds').split('\n').map(value => value.trim()).filter(Boolean).map(url => ({ url, allowCapture: data.get('feedCapture') === 'on', basis: text(data, 'feedBasis'), allowExport: data.get('feedExport') === 'on' })); onSave({ name: text(data, 'name'), question: text(data, 'question'), audience: text(data, 'audience'), scope: { kind, countries, label: text(data, 'scopeLabel') || countries.map(code => SIGNAL_COUNTRIES.find(item => item.code === code)?.name ?? code).join(', ') }, languages: csv(text(data, 'languages')), windowDays: Number(data.get('windowDays')), ...(desk ? { sourcePack: panelEdited ? { id: text(data, 'packId') || 'custom', version: Number(data.get('packVersion')) || 1, feeds, allowGdelt: gdeltEnabled && data.get('allowGdelt') === 'on' } : desk.sourcePack } : {}) }); }}>
    <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Desk name<input aria-label="Desk name" className={`${inputClass} mt-1`} name="name" required maxLength={120} defaultValue={desk?.name ?? ''}/></label><label className="text-sm">Audience<input aria-label="Audience" className={`${inputClass} mt-1`} name="audience" required maxLength={300} defaultValue={desk?.audience ?? ''}/></label></div>
    <label className="text-sm">Decision question<textarea aria-label="Decision question" className={`${inputClass} mt-1`} name="question" rows={2} required maxLength={2000} defaultValue={desk?.question ?? ''} placeholder="What decision or interpretation should the evidence inform?"/></label>
    <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Scope<select aria-label="Scope kind" className={`${inputClass} mt-1`} value={kind} onChange={event => setKind(event.target.value as Desk['scope']['kind'])}><option value="country">Country</option><option value="region">Region</option><option value="theatre">Cross-border theatre</option><option value="thematic">Multi-country thematic</option><option value="administrative">Administrative area (custom)</option></select></label><label className="text-sm">Scope name<input aria-label="Scope name" className={`${inputClass} mt-1`} name="scopeLabel" maxLength={200} defaultValue={desk?.scope.label ?? ''} placeholder="Country name, theatre or administrative area" required={kind !== 'country'}/></label></div>
    <div><label className="text-sm">Find countries<input aria-label="Find countries" className={`${inputClass} mt-1`} type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search any country by name or code"/></label><div className="mt-2 max-h-44 overflow-auto rounded-lg border border-stone-200 p-2"><div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">{SIGNAL_COUNTRIES.filter(item => !search || `${item.name} ${item.code}`.toLowerCase().includes(search.toLowerCase())).map(item => <label key={item.code} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-stone-50"><input type="checkbox" checked={countries.includes(item.code)} onChange={event => setCountries(current => event.target.checked ? kind === 'country' ? [item.code] : [...current, item.code] : current.filter(code => code !== item.code))}/><span>{item.name}</span></label>)}</div></div><p className="mt-2 text-xs text-stone-600">Selected: {countries.join(', ') || 'None'}. Unconfigured countries start in discovery mode; coverage is not inferred.</p></div>
    <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Languages (comma separated)<input aria-label="Desk languages" name="languages" className={`${inputClass} mt-1`} required defaultValue={desk?.languages.join(', ') ?? 'en'} placeholder="pt, en"/></label><label className="text-sm">Comparison window (days)<input aria-label="Comparison window days" type="number" name="windowDays" className={`${inputClass} mt-1`} min={1} max={90} required defaultValue={desk?.windowDays ?? 30}/></label></div>
    {desk && <fieldset onChange={() => setPanelEdited(true)} className="grid gap-3 rounded-lg border border-stone-200 p-4"><legend className="px-1 text-sm font-medium">Source pack</legend><p className="text-xs text-stone-600">Saving this form explicitly replaces the configured panel with these feeds. Capture and export permissions must reflect your actual rights.</p><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Pack identifier<input aria-label="Source pack identifier" className={`${inputClass} mt-1`} name="packId" defaultValue={desk.sourcePack.id}/></label><label className="text-sm">Pack version<input aria-label="Source pack version" className={`${inputClass} mt-1`} name="packVersion" type="number" min={1} defaultValue={desk.sourcePack.version}/></label></div><label className="text-sm">Feed URLs (one HTTPS URL per line)<textarea aria-label="Source feed URLs" name="feeds" className={`${inputClass} mt-1`} rows={3} defaultValue={desk.sourcePack.feeds.map(feed => feed.url).join("\n")}/></label><label className="text-sm">Rights basis for these feeds<input aria-label="Feed rights basis" className={`${inputClass} mt-1`} name="feedBasis" defaultValue={desk.sourcePack.feeds[0]?.basis ?? 'link-only discovery'}/></label><label className="flex gap-2 text-sm"><input type="checkbox" name="feedCapture" defaultChecked={desk.sourcePack.feeds.length > 0 && desk.sourcePack.feeds.every(feed => feed.allowCapture)}/>I have permission to capture feed text</label><label className="flex gap-2 text-sm"><input type="checkbox" name="feedExport" defaultChecked={desk.sourcePack.feeds.length > 0 && desk.sourcePack.feeds.every(feed => feed.allowExport)}/>I have permission to redistribute captured feed text</label><label className="flex gap-2 text-sm"><input type="checkbox" name="allowGdelt" disabled={!gdeltEnabled} defaultChecked={desk.sourcePack.allowGdelt}/>Allow GDELT headline discovery</label></fieldset>}
    <button className={primaryClass} disabled={busy || countries.length === 0}>{desk ? 'Save mandate and panel' : 'Create desk'}</button>
  </form>;
}
function CaptureForm({ busy, onSave }: {
    busy: boolean;
    onSave: (value: Record<string, unknown>) => void;
}) {
    return <form className="grid gap-3" onSubmit={event => { const data = fields(event); onSave({ title: text(data, 'title'), text: String(data.get('sourceText') ?? ''), url: text(data, 'url') || undefined, language: text(data, 'language'), ...(text(data, 'coverageCountry') ? { coverageCountry: text(data, 'coverageCountry') } : {}), kind: 'original_text', publicationTime: text(data, 'published') ? new Date(text(data, 'published')).toISOString() : null, synthetic: data.get('synthetic') === 'on', rights: { basis: text(data, 'basis'), allowExport: data.get('allowExport') === 'on' } }); }}><label className="text-sm">Source title<input aria-label="Source title" className={`${inputClass} mt-1`} name="title" required maxLength={240}/></label><label className="text-sm">Original URL (optional)<input aria-label="Original source URL" className={`${inputClass} mt-1`} name="url" type="url"/></label><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Original language<input aria-label="Original language" name="language" className={`${inputClass} mt-1`} required defaultValue="en" maxLength={20}/></label><label className="text-sm">Publication date (optional)<input aria-label="Publication date" type="datetime-local" name="published" className={`${inputClass} mt-1`}/></label></div><label className="text-sm">Source coverage country (optional)<select aria-label="Source coverage country" name="coverageCountry" className={`${inputClass} mt-1`}><option value="">Unmapped / not assigned</option>{SIGNAL_COUNTRIES.map(country => <option key={country.code} value={country.code}>{country.name} ({country.code})</option>)}</select><span className="mt-1 block text-xs text-stone-600">Assign the country this evidence covers. This is an analyst-provided coverage label, not the publisher location. Leave it unmapped when uncertain.</span></label><label className="text-sm">Original text<textarea aria-label="Original source text" dir="auto" name="sourceText" className={`${inputClass} mt-1`} rows={8} required maxLength={16000} placeholder="Paste permissioned source text exactly, preserving punctuation and negation."/></label><label className="text-sm">Rights basis<input aria-label="Capture rights basis" name="basis" className={`${inputClass} mt-1`} required maxLength={500} placeholder="Your own text, permission, public-domain basis or applicable license"/></label><label className="flex gap-2 text-sm"><input type="checkbox" name="allowExport"/>This text may be redistributed in exports</label><label className="flex gap-2 text-sm"><input type="checkbox" name="synthetic"/>This is a synthetic demonstration source</label><p className="text-xs text-stone-600">Corrections: recapture changed text or coverage-country metadata using the same original URL. The new revision preserves the earlier receipt and flags dependent readings.</p><button className={primaryClass} disabled={busy}>Capture source revision</button></form>;
}
function ProposalForm({ source, busy, onSave }: {
    source: Source;
    busy: boolean;
    onSave: (value: Record<string, unknown>) => void;
}) {
    const [quote, setQuote] = useState('');
    const [start, setStart] = useState(0);
    const exact = quote.length > 0 && source.text.slice(start, start + quote.length) === quote;
    return <form className="grid gap-3" onSubmit={event => { const data = fields(event); if (!exact)
        return; onSave({ proposition: text(data, 'proposition'), speaker: text(data, 'speaker'), quote, start, end: start + quote.length, polarity: text(data, 'polarity'), modality: text(data, 'modality'), conditions: text(data, 'conditions'), time: text(data, 'time'), place: text(data, 'place'), frame: text(data, 'frame') }); }}><label className="text-sm">Attributed proposition<textarea aria-label="Attributed proposition" name="proposition" className={`${inputClass} mt-1`} required rows={2} maxLength={2000}/></label><label className="text-sm">Exact original quotation<textarea aria-label="Exact original quotation" dir="auto" className={`${inputClass} mt-1`} value={quote} onChange={event => { setQuote(event.target.value); const found = source.text.indexOf(event.target.value); if (found >= 0)
        setStart(found); }} required rows={3}/></label><label className="text-sm">Quotation start offset<input aria-label="Quotation start offset" className={`${inputClass} mt-1`} type="number" value={start} min={0} max={source.text.length} onChange={event => setStart(Number(event.target.value))}/></label><p className={`text-xs ${exact ? 'text-emerald-800' : 'text-amber-800'}`}>{exact ? `Exact match at ${start}–${start + quote.length}.` : 'Quotation must match the original text exactly. Adjust the offset for repeated passages.'}</p>{[['speaker', 'Speaker / attributed actor'], ['polarity', 'Polarity (affirmed, denied, qualified)'], ['modality', 'Modality (proposed, conditional, asserted)'], ['conditions', 'Conditions and qualifications'], ['time', 'Time referred to'], ['place', 'Place referred to'], ['frame', 'Interpretive frame']].map(([key, label]) => <label key={key} className="text-sm">{label}{key === 'polarity' || key === 'modality' ? <select aria-label={label} name={key} className={`${inputClass} mt-1`} defaultValue="unknown">{(key === 'polarity' ? ['unknown', 'affirmative', 'negative'] : ['unknown', 'asserted', 'alleged', 'conditional', 'proposed', 'denied']).map(value => <option key={value} value={value}>{value}</option>)}</select> : <input aria-label={label} name={key} className={`${inputClass} mt-1`} maxLength={key === 'speaker' || key === 'time' || key === 'place' ? 240 : key === 'frame' ? 500 : 1000} required={key === 'speaker'}/>}</label>)}<button className={primaryClass} disabled={busy || !exact || source.kind !== 'original_text' || source.withdrawn}>Save proposal for review</button></form>;
}
function BriefCard({ brief, busy, judgmentsBlocked, onEdit, onApprove, onExport }: {
    brief: Brief;
    busy: boolean;
    judgmentsBlocked: boolean;
    onEdit: (text: string) => void;
    onApprove: (rationale: string) => void;
    onExport: (format: string) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(brief.text);
    return <Card title={`${brief.status === 'approved' ? 'Approved' : 'Draft'} brief · ${date(brief.createdAt)}`}><p className="mb-3 break-all text-xs">Artifact <bdi>{brief.id}</bdi> · Text digest <bdi>{brief.digest}</bdi>{brief.stale && ' · New evidence: review possible staleness'}</p>{editing ? <form onSubmit={event => { event.preventDefault(); onEdit(value); }} className="grid gap-3"><label className="text-sm">Brief text<textarea aria-label="Edit brief text" className={`${inputClass} mt-1`} rows={16} value={value} onChange={event => setValue(event.target.value)} required maxLength={24000}/></label><button className={primaryClass} disabled={judgmentsBlocked}>Save as new draft revision</button><button type="button" className={buttonClass} onClick={() => setEditing(false)}>Cancel edit</button></form> : <><p className="whitespace-pre-wrap text-sm leading-relaxed"><bdi>{brief.text}</bdi></p><button className={`${buttonClass} mt-4`} disabled={judgmentsBlocked} onClick={() => setEditing(true)}>Edit as new draft</button></>}{brief.status !== 'approved' && !editing && <form className="mt-5 grid gap-3" onSubmit={event => { const data = fields(event); onApprove(text(data, 'rationale')); }}><label className="text-sm">Editorial approval rationale<textarea aria-label="Brief approval rationale" name="rationale" className={`${inputClass} mt-1`} required minLength={5} maxLength={2000} rows={2} placeholder="Explain qualifications, evidence limits and intended use."/></label><button className={primaryClass} disabled={judgmentsBlocked || brief.stale}>Approve exact brief and manifest</button></form>}{brief.status === 'approved' && <div className="mt-4 flex flex-wrap gap-2"><button className={buttonClass} disabled={busy} onClick={() => onExport('brief')}>Export pinned Markdown</button><button className={buttonClass} disabled={busy} onClick={() => onExport('bundle')}>Export evidence manifest</button></div>}<details className="mt-4"><summary className="cursor-pointer text-sm font-medium">Pinned evidence and rights manifest</summary><pre className="mt-2 overflow-auto whitespace-pre-wrap break-words rounded bg-stone-50 p-3 text-xs">{JSON.stringify(brief.manifest, null, 2)}</pre></details></Card>;
}

function DeleteDeskForm({ deskName, busy, onDelete }: { deskName: string; busy: boolean; onDelete: () => void }) {
  const [confirmation, setConfirmation] = useState('');
  return <details className="mt-4 text-sm"><summary className="cursor-pointer">Manage this desk</summary><form className="mt-3 grid gap-3" onSubmit={event => { event.preventDefault(); if (confirmation === deskName) onDelete(); }}><p>Deleting this desk removes its SIGNAL sources, readings and briefs. Export approved work first.</p><label>Type the desk name to confirm deletion<input aria-label="Confirm desk deletion" className={`${inputClass} mt-1`} value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label><button className={`${buttonClass} border-red-300 text-red-800`} disabled={busy || confirmation !== deskName}>Delete desk</button></form></details>;
}
function InterpretationPanel({ kind, desk, busy, onAction }: { kind: 'narrative' | 'assessment'; desk: Desk; busy: boolean; onAction: (action: string, values: Record<string, unknown>) => void }) {
  const claims = desk.claims.filter(item => getSignalClaimStatus(desk, item) === 'accepted');
  const records = kind === 'narrative' ? desk.narratives ?? [] : desk.assessments ?? [];
  const isNarrative = kind === 'narrative';
  const [selected, setSelected] = useState<string[]>([]);
  return <>
    <Card title={isNarrative ? 'Narrative dossiers' : 'Continuing assessments'}>
      <p className="mb-4 text-sm text-stone-600">{isNarrative ? 'Record an attributed frame, linked source readings and competing interpretations. Reuse across quotations is observation, not proof of intent or coordination.' : 'Explain the interpretation, what changed, what remains uncertain and what would invalidate it. Evidence volume alone cannot establish a risk change.'}</p>
      {records.length ? <div className="grid gap-4">{records.slice().reverse().map(record => <section key={record.id} id={`signal-interpretation-${record.id}`} tabIndex={-1} className="rounded-lg border border-stone-200 p-4 focus-visible:outline-2 focus-visible:outline-emerald-700"><h4 className="font-medium"><bdi>{'title' in record ? record.title : record.conclusion}</bdi></h4><p className="mt-1 text-xs">{record.status}{record.stale && ' · Stale: dependencies changed'} · {date(record.createdAt)}{'version' in record && ` · Revision ${record.version}`}</p><p className="mt-3 whitespace-pre-wrap text-sm"><bdi>{'frame' in record ? record.frame : record.changeReason}</bdi></p>{'uncertainty' in record && <><p className="mt-3 text-sm"><strong>Uncertainty: </strong><bdi>{record.uncertainty}</bdi></p><p className="mt-2 text-sm"><strong>Review triggers: </strong>{record.invalidators.join('; ')}</p><p className="mt-2 text-xs">Panel revision {record.sourcePackVersion}{record.previousId ? ' · Continues an earlier reviewed assessment' : ' · Initial assessment'}</p></>}<p className="mt-3 text-sm font-medium">Competing explanations</p><ul className="mt-1 list-disc pl-5 text-sm">{record.alternatives.map((value, index) => <li key={index}><bdi>{value}</bdi></li>)}</ul><details className="mt-3"><summary className="cursor-pointer text-sm">Linked evidence readings ({record.claimIds.length})</summary><ul className="mt-2 space-y-2 text-xs">{record.claimIds.map(id => { const claim = desk.claims.find(item => item.id === id); const source = desk.sources.find(item => item.id === claim?.sourceRevisionId); return <li key={id} className="rounded bg-stone-50 p-2"><bdi>{claim?.proposition ?? 'Reading unavailable'}</bdi><p>{source?.title ?? 'Source unavailable'} · {source?.language} · {claim?.status}{claim?.stale && ' · stale'}</p>{claim && <blockquote dir="auto">{claim.quote}</blockquote>}</li>; })}</ul></details><form className="mt-4 grid gap-2" onSubmit={event => { const data = fields(event); onAction('reviewInterpretation', { targetId: record.id, digest: record.digest, decision: text(data, 'decision'), rationale: text(data, 'rationale') }); }}><label className="text-sm">{isNarrative ? 'Narrative' : 'Assessment'} decision<select aria-label={`${kind} review decision`} name="decision" className={`${inputClass} mt-1`} defaultValue="accepted"><option value="accepted">Accept interpretation</option><option value="rejected">Reject interpretation</option><option value="unresolved">Keep unresolved</option></select></label><label className="text-sm">{isNarrative ? 'Narrative' : 'Assessment'} review rationale<textarea aria-label={`${kind} review rationale`} name="rationale" className={`${inputClass} mt-1`} required minLength={5} maxLength={2000} rows={2} /></label><button className={primaryClass} disabled={busy || record.stale}>Save {kind} review</button></form><ul className="mt-3 space-y-1 text-xs">{desk.reviews.filter(item => item.targetId === record.id).map(receipt => <li key={receipt.id}>{receipt.decision} · {date(receipt.createdAt)} · <bdi>{receipt.rationale}</bdi></li>)}</ul></section>)}</div> : <Empty>{isNarrative ? 'No narrative dossiers yet.' : 'No continuing assessment yet.'} Interpretations require current accepted source readings and a human review.</Empty>}
    </Card>
    <Card title={isNarrative ? 'Propose a narrative dossier' : 'Propose an assessment delta'}>
      <form className="grid gap-3" onSubmit={event => { const data = fields(event); const lines = (key: string) => text(data, key).split('\n').map(value => value.trim()).filter(Boolean); const claimIds = selected.filter(id => claims.some(item => item.id === id)); onAction(isNarrative ? 'proposeNarrative' : 'proposeAssessment', isNarrative ? { title: text(data, 'title'), frame: text(data, 'frame'), claimIds, alternatives: lines('alternatives'), ...(text(data, 'previousId') ? { previousId: text(data, 'previousId') } : {}) } : { conclusion: text(data, 'conclusion'), changeReason: text(data, 'changeReason'), claimIds, alternatives: lines('alternatives'), uncertainty: text(data, 'uncertainty'), invalidators: lines('invalidators') }); }}>
        {isNarrative ? <><label className="text-sm">Narrative title<input aria-label="Narrative title" name="title" className={`${inputClass} mt-1`} required minLength={3} maxLength={240} /></label><label className="text-sm">Interpretive frame<textarea aria-label="Narrative frame" name="frame" className={`${inputClass} mt-1`} required minLength={5} maxLength={2000} rows={3} /></label><label className="text-sm">Previous dossier (optional)<select aria-label="Previous narrative dossier" name="previousId" className={`${inputClass} mt-1`}><option value="">New dossier</option>{(desk.narratives ?? []).map(item => <option key={item.id} value={item.id}>{item.title} · revision {item.version}</option>)}</select></label></> : <><label className="text-sm">Assessment conclusion<textarea aria-label="Assessment conclusion" name="conclusion" className={`${inputClass} mt-1`} required minLength={10} maxLength={3000} rows={3} /></label><label className="text-sm">What changed and why<textarea aria-label="Assessment change reason" name="changeReason" className={`${inputClass} mt-1`} required minLength={5} maxLength={2000} rows={3} /></label><label className="text-sm">Uncertainty and limits<textarea aria-label="Assessment uncertainty" name="uncertainty" className={`${inputClass} mt-1`} required minLength={5} maxLength={2000} rows={2} /></label><label className="text-sm">Invalidating observations / next review triggers (one per line)<textarea aria-label="Assessment invalidators" name="invalidators" className={`${inputClass} mt-1`} required maxLength={8000} rows={2} /></label></>}
        <fieldset className="rounded-lg border p-3"><legend className="px-1 text-sm font-medium">Select current accepted source readings</legend>{claims.length ? claims.map(item => <label key={item.id} className="my-2 flex items-start gap-2 text-sm"><input type="checkbox" checked={selected.includes(item.id)} onChange={event => setSelected(current => event.target.checked ? [...current, item.id] : current.filter(id => id !== item.id))} /><bdi>{item.proposition}</bdi></label>) : <p className="text-sm text-stone-600">Accept current source readings in Evidence first. Changed context requires a renewed proposal and review.</p>}</fieldset>
        <label className="text-sm">Alternative explanations (one per line)<textarea aria-label={`${kind} alternatives`} name="alternatives" className={`${inputClass} mt-1`} required maxLength={8000} rows={3} /></label><button className={primaryClass} disabled={busy || !selected.some(id => claims.some(item => item.id === id))}>Propose {kind === 'narrative' ? 'narrative dossier' : 'assessment'}</button>
      </form>
    </Card>
  </>;
}
