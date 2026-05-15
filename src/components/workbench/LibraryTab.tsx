'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Archive, ExternalLink, FileText, Link2, Loader2, RefreshCw, Search, Trash2, Upload } from 'lucide-react';
import { WorkOnThisMenu } from '@/components/app/work-on-this-menu';
import { useActiveContextStack } from '@/components/app/use-active-context-stack';
import { Badge } from '@/components/ui/badge';
import { ContextHealthChip } from '@/components/workbench/context-health-chip';
import { useWorkbenchScope } from '@/components/workbench/workbench-scope';
import { useFeatureFlags } from '@/lib/features/client';
import { buildLibraryArtifacts, type LibraryArtifact, type LibraryArtifactType, type SourceImportReceipt } from '@/lib/workbench/library-state';
import { cn } from '@/lib/utils/cn';
import { useSituationStore } from '@/stores/situation-store';
import type { SavedClaim } from '@/types/saved-claims';
import type { LibraryCore } from '@/lib/cores/core-library';

const TYPE_LABELS: Record<LibraryArtifactType, string> = {
  source: 'Sources',
  document: 'Documents',
  claim: 'Saved claims',
  memo: 'Memo versions',
  export: 'Exports',
};

interface BackendSourceReceipt {
  id: string;
  title?: string;
  source_uri?: string | null;
  source_type?: string | null;
  receipt_status?: string | null;
  cognee_document_id?: string | null;
  embeddings_count?: number | null;
  nodes_extracted?: number | null;
  ontology_valid_pct?: number | string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

function documentIdFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const root = payload as { documentId?: unknown; document?: { id?: unknown } };
  if (typeof root.documentId === 'string') return root.documentId;
  if (typeof root.document?.id === 'string') return root.document.id;
  return null;
}

function coreRefsFromPayload(payload: unknown): { sourceCoreIds: string[]; documentCoreIds: string[] } {
  if (!payload || typeof payload !== 'object') return { sourceCoreIds: [], documentCoreIds: [] };
  const refs = (payload as { coreRefs?: { sourceCoreIds?: unknown; documentCoreIds?: unknown } }).coreRefs;
  return {
    sourceCoreIds: Array.isArray(refs?.sourceCoreIds) ? refs.sourceCoreIds.filter((item): item is string => typeof item === 'string') : [],
    documentCoreIds: Array.isArray(refs?.documentCoreIds) ? refs.documentCoreIds.filter((item): item is string => typeof item === 'string') : [],
  };
}

export function LibraryTab() {
  const { caseId, caseModule } = useWorkbenchScope();
  const isExampleCase = caseModule.kind === 'example';
  const setActiveSituation = useSituationStore((state) => state.setActiveSituation);
  const { stack, saveStack } = useActiveContextStack();
  const features = useFeatureFlags();
  const cogneeEnabled = features.cognee.enabled;
  const [query, setQuery] = useState('');
  const [activeTypes, setActiveTypes] = useState<LibraryArtifactType[]>(['source', 'document', 'claim', 'memo', 'export']);
  const [selected, setSelected] = useState<LibraryArtifact | null>(null);
  const [savedClaims, setSavedClaims] = useState<SavedClaim[]>([]);
  const [backendSources, setBackendSources] = useState<BackendSourceReceipt[]>([]);
  const [coreLibrary, setCoreLibrary] = useState<LibraryCore[]>([]);
  const [sourceNote, setSourceNote] = useState<string | null>(null);
  const [sourceBusy, setSourceBusy] = useState(false);
  const [isDraggingSource, setIsDraggingSource] = useState(false);
  const [uploadSteps, setUploadSteps] = useState<string[]>([]);
  const backendArtifacts = useMemo(() => backendSources.map((source) => sourceReceiptToArtifact(source, cogneeEnabled)), [backendSources, cogneeEnabled]);
  const coreArtifacts = useMemo(() => coreLibrary.map(coreToArtifact), [coreLibrary]);
  const artifacts = useMemo(() => {
    const local = buildLibraryArtifacts(caseModule, caseId, savedClaims);
    const richIds = new Set([...coreArtifacts, ...backendArtifacts].map((artifact) => artifact.id));
    return [...coreArtifacts, ...backendArtifacts.filter((artifact) => !richIds.has(artifact.id)), ...local.filter((artifact) => !richIds.has(artifact.id))];
  }, [backendArtifacts, coreArtifacts, caseId, caseModule, savedClaims]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return artifacts.filter((artifact) => {
      if (!activeTypes.includes(artifact.type)) return false;
      if (!needle) return true;
      return `${artifact.title} ${artifact.summary} ${artifact.badge} ${Object.values(artifact.meta).join(' ')}`.toLowerCase().includes(needle);
    });
  }, [activeTypes, artifacts, query]);

  function toggleType(type: LibraryArtifactType) {
    setActiveTypes((current) => {
      if (current.includes(type)) {
        const next = current.filter((item) => item !== type);
        return next.length ? next : current;
      }
      return [...current, type];
    });
  }

  useEffect(() => {
    if (isExampleCase) {
      setSavedClaims([]);
      return;
    }
    let ignore = false;
    fetch(`/api/cases/${encodeURIComponent(caseId)}/saved-claims`)
      .then((response) => response.ok ? response.json() : { claims: [] })
      .then((payload) => {
        if (!ignore && Array.isArray(payload.claims)) setSavedClaims(payload.claims);
      })
      .catch(() => {
        if (!ignore) setSavedClaims([]);
      });
    return () => {
      ignore = true;
    };
  }, [caseId, isExampleCase]);

  const refreshBackendSources = useCallback(async () => {
    if (isExampleCase) return;
    const [receiptResponse, coreResponse] = await Promise.all([
      fetch(`/api/backend/tabs/library?case_id=${encodeURIComponent(caseId)}`).catch(() => null),
      fetch(`/api/cores/library?situationId=${encodeURIComponent(caseId)}&kind=all&limit=120`).catch(() => null),
    ]);
    const receiptPayload = await receiptResponse?.json().catch(() => ({}));
    if (receiptResponse?.ok && Array.isArray(receiptPayload.sources)) setBackendSources(receiptPayload.sources);
    const corePayload = await coreResponse?.json().catch(() => ({}));
    if (coreResponse?.ok && Array.isArray(corePayload.cores)) {
      setCoreLibrary(corePayload.cores.filter((core: LibraryCore) => core.kind === 'source' || core.kind === 'document'));
    }
  }, [caseId, isExampleCase]);

  useEffect(() => {
    void refreshBackendSources();
  }, [refreshBackendSources]);

  async function uploadSource(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setSourceBusy(true);
    setSourceNote(`Uploading ${file.name} to Library...`);
    setUploadSteps(['Document uploaded']);
    try {
      const documentFormData = new FormData();
      documentFormData.append('file', file);
      documentFormData.append('situationId', caseId);
      const documentResponse = await fetch('/api/documents/upload', { method: 'POST', body: documentFormData });
      const documentPayload = await documentResponse.json().catch(() => ({}));
      if (!documentResponse.ok) throw new Error(documentPayload?.error ?? 'document upload failed');
      const documentId = documentIdFromPayload(documentPayload);
      const coreRefs = coreRefsFromPayload(documentPayload);
      setUploadSteps(['Document uploaded', 'Source Core created']);
      if (documentId) {
        void saveStack({
          situationId: caseId,
          sourceIds: Array.from(new Set([...stack.sourceIds, ...coreRefs.sourceCoreIds])),
          documentIds: Array.from(new Set([...stack.documentIds, documentId, ...coreRefs.documentCoreIds])),
        });
      }

      const libraryFormData = new FormData();
      libraryFormData.append('file', file);
      if (documentId) libraryFormData.append('documentId', documentId);
      const response = await fetch(`/api/backend/tabs/library/ingest?case_id=${encodeURIComponent(caseId)}`, { method: 'POST', body: libraryFormData });
      const payload = await response.json().catch(() => ({}));
      if (response.ok) {
        setUploadSteps(['Document uploaded', 'Source Core created', 'Graph candidates found', 'Ask ready']);
        setSourceNote(
          cogneeEnabled
            ? payload.status === 'ingested'
              ? `${file.name} uploaded. Document embedded for retrieval. Source receipt saved. Cognee ingest started.`
              : `${file.name} uploaded. Document embedded for retrieval. Source receipt saved. Memory layer queued.`
            : `${file.name} uploaded. Document embedded for retrieval. Source receipt saved.`,
        );
      } else {
        setUploadSteps(['Document uploaded', 'Source Core created', 'Graph candidates found']);
        setSourceNote(`${file.name} uploaded. Document embedded for retrieval. Source receipt deferred.`);
      }
      await refreshBackendSources();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      setSourceNote(`Upload failed: ${message}`);
      setUploadSteps([]);
    } finally {
      setSourceBusy(false);
    }
  }

  async function reextractSelected() {
    if (!selected?.backendSourceId) return;
    setSourceBusy(true);
    setSourceNote(`Re-extracting ${selected.title}...`);
    try {
      const response = await fetch(`/api/backend/tabs/library/${encodeURIComponent(selected.backendSourceId)}/re-extract?case_id=${encodeURIComponent(caseId)}`, { method: 'POST' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error ?? 're-extract failed');
      setSourceNote(
        cogneeEnabled
          ? payload?.cognee?.ok ? 'Re-extraction requested.' : 'Re-extraction queued for the memory layer.'
          : 'Re-extraction requested.',
      );
      await refreshBackendSources();
    } catch {
      setSourceNote('Re-extraction could not be requested.');
    } finally {
      setSourceBusy(false);
    }
  }

  async function deleteSelected() {
    if (!selected?.backendSourceId) return;
    setSourceBusy(true);
    setSourceNote(`Removing ${selected.title} from active Library receipts...`);
    try {
      const response = await fetch(`/api/backend/tabs/library/${encodeURIComponent(selected.backendSourceId)}?case_id=${encodeURIComponent(caseId)}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('delete failed');
      setSelected(null);
      setSourceNote('Source receipt marked deleted.');
      await refreshBackendSources();
    } catch {
      setSourceNote('Source receipt could not be removed.');
    } finally {
      setSourceBusy(false);
    }
  }

  async function attachSelectedToContext() {
    if (!selected?.coreId || !selected.coreKind) return;
    setSourceBusy(true);
    setSourceNote(`Attaching ${selected.title} to the active capsule...`);
    try {
      const body = selected.coreKind === 'document'
        ? { documentIds: [selected.coreId] }
        : { sourceIds: [selected.coreId] };
      const response = await fetch('/api/context/capsules/default/attach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error ?? 'attach failed');
      if (selected.coreKind === 'document') {
        void saveStack({ situationId: caseId, documentIds: Array.from(new Set([...stack.documentIds, selected.coreId])) });
      } else {
        void saveStack({ situationId: caseId, sourceIds: Array.from(new Set([...stack.sourceIds, selected.coreId])) });
      }
      setSourceNote(`${selected.title} is attached to Ask PRAXIS, Memo Studio, and Canvas context.`);
      await refreshBackendSources();
    } catch {
      setSourceNote('Core could not be attached to the active capsule.');
    } finally {
      setSourceBusy(false);
    }
  }

  async function retrySelectedIngestion() {
    if (!selected?.ingestionRunId) return;
    setSourceBusy(true);
    try {
      const response = await fetch(`/api/knowledge/ingest-runs/${encodeURIComponent(selected.ingestionRunId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situationId: caseId, retry: true }),
      });
      if (!response.ok) throw new Error('retry failed');
      setSourceNote('Ingestion retry requested. The core remains queued until extraction completes.');
      await refreshBackendSources();
    } catch {
      setSourceNote('Ingestion retry could not be requested.');
    } finally {
      setSourceBusy(false);
    }
  }

  async function viewSelectedTrace() {
    if (!selected?.ingestionRunId) return;
    const response = await fetch(`/api/knowledge/ingest-runs/${encodeURIComponent(selected.ingestionRunId)}?situationId=${encodeURIComponent(caseId)}`).catch(() => null);
    const payload = await response?.json().catch(() => ({}));
    if (response?.ok && payload.run) {
      setSourceNote(`Trace ${payload.run.traceId ?? selected.ingestionRunId}: ${payload.run.status}, ${payload.run.chunkCount ?? 0} chunks, ${payload.run.graphDeltaCount ?? 0} review item(s).`);
    } else {
      setSourceNote('Trace is not available for this core yet.');
    }
  }

  return (
    <div className="space-y-6" data-testid="workbench-library-surface">
      <section
        className={cn(
          'rounded-lg border bg-white p-5 shadow-sm shadow-navy-950/5',
          isDraggingSource ? 'border-diplomatic-blue bg-diplomatic-blue/5' : 'border-navy-200',
        )}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDraggingSource(true);
        }}
        onDragLeave={(event) => {
          const related = event.relatedTarget;
          if (related instanceof Node && event.currentTarget.contains(related)) return;
          setIsDraggingSource(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDraggingSource(false);
          void uploadSource(event.dataTransfer.files);
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-gold-700" />
              <h2 className="text-lg font-semibold text-navy-950">Library</h2>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Browse the case artifact record: sources, documents, saved claims, memo versions, and exports from one faceted view. Drop PDFs, DOCX, notes, or source files here to structure them into the active Situation Core.
            </p>
          </div>
          <ContextHealthChip />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-navy-900 px-3 py-2 text-xs font-semibold text-white">
            {sourceBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload source
            <input type="file" accept=".pdf,.docx,.txt,.md,.csv" className="hidden" onChange={(event) => void uploadSource(event.target.files)} />
          </label>
          <div className={cn(
            'rounded-md border border-dashed px-3 py-2 text-xs font-semibold',
            isDraggingSource ? 'border-diplomatic-blue bg-white text-diplomatic-blue' : 'border-slate-300 bg-slate-50 text-slate-700',
          )}>
            Drop source on this panel
          </div>
          <button
            type="button"
            onClick={() => void refreshBackendSources()}
            className="inline-flex items-center gap-2 rounded-md border border-navy-300 bg-white px-3 py-2 text-xs font-semibold text-navy-900"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh receipts
          </button>
          {!isExampleCase ? (
            <button
              type="button"
              onClick={() => {
                setActiveSituation(caseId);
                void saveStack({ situationId: caseId });
                setSourceNote('This Situation Core is now the active context for Ask PRAXIS and Memo Studio.');
              }}
              className="inline-flex items-center gap-2 rounded-md border border-gold-300 bg-gold-50 px-3 py-2 text-xs font-semibold text-gold-900"
            >
              Attach to active context
            </button>
          ) : null}
          {sourceNote ? <p className="text-sm font-semibold text-navy-900">{sourceNote}</p> : null}
        </div>
        {uploadSteps.length ? <UploadSequence steps={uploadSteps} /> : null}

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search titles, receipts, claims, versions, exports"
              className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-navy-950 outline-none placeholder:text-slate-600 focus:border-navy-500 focus:ring-2 focus:ring-navy-100"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TYPE_LABELS) as LibraryArtifactType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                className={cn(
                  'rounded-md border px-3 py-2 text-xs font-semibold',
                  activeTypes.includes(type) ? 'border-navy-700 bg-navy-900 text-white' : 'border-slate-300 bg-white text-slate-800',
                )}
              >
                {TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <p className="text-sm font-semibold text-navy-950">Artifacts</p>
            <p className="text-xs font-semibold text-slate-700">{filtered.length} shown</p>
          </div>
          <div className="divide-y divide-slate-200">
            {filtered.map((artifact) => (
              <button
                key={artifact.id}
                type="button"
                onClick={() => setSelected(artifact)}
                className="grid w-full gap-3 px-4 py-4 text-left transition hover:bg-slate-50 md:grid-cols-[auto_minmax(0,1fr)_auto]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
                  <FileText className="h-4 w-4 text-gold-700" />
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-navy-950">{artifact.title}</span>
                    <Badge variant="default" className="bg-gold-100 text-navy-950">{artifact.type}</Badge>
                  </span>
                  <span className="mt-1 block text-sm leading-5 text-slate-700">{artifact.summary}</span>
                </span>
                <span className="text-xs font-semibold text-slate-700">{formatDate(artifact.date)}</span>
              </button>
            ))}
          </div>
        </section>

        <aside className="rounded-lg border border-slate-200 bg-white p-4">
          {selected ? (
            <div>
              <Badge variant="default" className="bg-gold-100 text-navy-950">{TYPE_LABELS[selected.type]}</Badge>
              <h3 className="mt-3 text-base font-semibold text-navy-950">{selected.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{selected.summary}</p>
              {selected.receipt ? <SourceReceiptCard receipt={selected.receipt} /> : null}
              <dl className="mt-4 space-y-2">
                {Object.entries(selected.meta).map(([key, value]) => (
                  <div key={key} className="flex items-start justify-between gap-3 rounded-md bg-slate-50 px-3 py-2">
                    <dt className="text-xs font-semibold text-slate-700">{key}</dt>
                    <dd className="text-right text-xs text-navy-900">{value}</dd>
                  </div>
                ))}
              </dl>
              {selected.href ? (
                <a href={selected.href} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-navy-800">
                  Open source
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
              {(selected.coreId || selected.backendSourceId) ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <WorkOnThisMenu itemLabel={selected.title} contextHref="/app/dashboard" draftHref="/app/write" sourcesHref={`/app/workbench/${caseId}?tab=library`} />
                  {selected.coreId ? (
                    <button
                      type="button"
                      onClick={() => void attachSelectedToContext()}
                      className="inline-flex items-center gap-2 rounded-md border border-gold-300 bg-gold-50 px-3 py-2 text-xs font-semibold text-gold-900"
                    >
                      <Link2 className="h-4 w-4" />
                      Add to context
                    </button>
                  ) : null}
                  {selected.ingestionRunId ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void viewSelectedTrace()}
                        className="inline-flex items-center gap-2 rounded-md border border-navy-300 px-3 py-2 text-xs font-semibold text-navy-900"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View trace
                      </button>
                      <button
                        type="button"
                        onClick={() => void retrySelectedIngestion()}
                        className="inline-flex items-center gap-2 rounded-md border border-navy-300 px-3 py-2 text-xs font-semibold text-navy-900"
                      >
                        {sourceBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Retry ingestion
                      </button>
                    </>
                  ) : null}
                  {(selected.graphDeltaReviewCount ?? 0) > 0 ? (
                    <a href={`/app/workbench/${caseId}?tab=graph`} className="inline-flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                      Review for Graph Core
                    </a>
                  ) : null}
                  {selected.backendSourceId ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void reextractSelected()}
                        className="inline-flex items-center gap-2 rounded-md border border-navy-300 px-3 py-2 text-xs font-semibold text-navy-900"
                      >
                        {sourceBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Re-extract
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteSelected()}
                        className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove receipt
                      </button>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-navy-950">Select an artifact</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">Details, provenance fields, and source/export actions appear here.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function UploadSequence({ steps }: { steps: string[] }) {
  const labels = ['Document uploaded', 'Source Core created', 'Graph candidates found', 'Ask ready'];
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {labels.map((label, index) => {
        const active = steps.includes(label);
        return (
          <div key={label} className="flex items-center gap-2">
            <span className={cn(
              'rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]',
              active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-400',
            )}>
              {label}
            </span>
            {index < labels.length - 1 ? <span className="text-slate-300">→</span> : null}
          </div>
        );
      })}
    </div>
  );
}

function SourceReceiptCard({ receipt }: { receipt: SourceImportReceipt }) {
  return (
    <div className="mt-4 rounded-lg border border-gold-200 bg-gold-50/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gold-900">Import receipt</p>
        <span className="rounded-full border border-gold-300 bg-white px-2 py-1 text-[11px] font-semibold text-navy-900">
          {Math.round(receipt.confidence * 100)}% confidence
        </span>
      </div>
      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <ReceiptField label="Source type" value={receipt.sourceType} />
        <ReceiptField label="Attached core" value={receipt.attachedCore} />
        <ReceiptField label="Dates" value={receipt.dates.length ? receipt.dates.join(', ') : 'none found'} />
        <ReceiptField label="Chunks" value={receipt.chunkCount !== undefined ? String(receipt.chunkCount) : 'not indexed'} />
      </dl>
      <ReceiptList label="Extracted claims" items={receipt.claims} empty="No compact claims found yet." />
      <ReceiptList label="Actors" items={receipt.actors} empty="No actors found yet." />
    </div>
  );
}

function ReceiptField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/75 px-2 py-2">
      <dt className="font-semibold text-slate-700">{label}</dt>
      <dd className="mt-1 break-words font-medium text-navy-950">{value}</dd>
    </div>
  );
}

function ReceiptList({ label, items, empty }: { label: string; items: string[]; empty: string }) {
  return (
    <div className="mt-3">
      <p className="text-xs font-semibold text-slate-700">{label}</p>
      <ul className="mt-2 space-y-1">
        {(items.length ? items : [empty]).map((item, index) => (
          <li key={`${label}-${index}`} className="rounded-md bg-white/75 px-2 py-2 text-xs leading-5 text-navy-950">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function sourceReceiptToArtifact(source: BackendSourceReceipt, cogneeEnabled: boolean): LibraryArtifact {
  const metadata = source.metadata ?? {};
  const filename = typeof metadata.filename === 'string' ? metadata.filename : undefined;
  const status = source.receipt_status ?? 'staged';
  const receipt = parseSourceReceipt(metadata.receipt ?? metadata.sourceReceipt ?? metadata.importReceipt);
  return {
    id: `source:${source.id}`,
    backendSourceId: source.id,
    type: 'source',
    title: source.title ?? filename ?? 'Untitled source receipt',
    summary: status === 'deleted'
      ? 'Source receipt has been removed from the active library view.'
      : 'Source receipt stored through the Library substrate pipeline.',
    date: source.updated_at ?? source.created_at ?? new Date().toISOString(),
    badge: status,
    href: source.source_uri ?? undefined,
    receipt,
    meta: {
      Status: status,
      Type: source.source_type ?? 'document',
      ...(cogneeEnabled ? { Cognee: source.cognee_document_id ? 'document linked' : 'queued/offline' } : {}),
      Embeddings: String(source.embeddings_count ?? 0),
      Nodes: String(source.nodes_extracted ?? 0),
      'Ontology valid': source.ontology_valid_pct === null || source.ontology_valid_pct === undefined ? 'not scored' : `${Math.round(Number(source.ontology_valid_pct) * 100)}%`,
    },
  };
}

function coreToArtifact(core: LibraryCore): LibraryArtifact {
  const type = core.kind === 'document' ? 'document' : 'source';
  const graphDeltaReviewCount = core.graphDeltaReviewCount ?? 0;
  return {
    id: `${type}:${core.id}`,
    type,
    title: core.name,
    summary: core.essence ?? (type === 'document' ? 'Document Core attached to the workspace library.' : 'Source Core attached to the workspace library.'),
    date: core.updatedAt,
    badge: core.status ?? 'ready',
    coreId: core.id,
    coreKind: type,
    ingestionRunId: core.ingestionRunId,
    graphDeltaReviewCount,
    receipt: core.receipt,
    meta: {
      Status: core.status ?? 'ready',
      Scope: core.ownerScope,
      Capsule: core.capsuleIds?.length ? core.capsuleIds.join(', ') : 'not attached',
      Situation: core.boundSituationIds?.length ? core.boundSituationIds.join(', ') : 'none',
      ...(core.chunkCount !== undefined ? { Chunks: String(core.chunkCount) } : {}),
      ...(core.embeddingStatus ? { Embeddings: core.embeddingStatus } : {}),
      ...(core.ingestionRunId ? { Trace: core.ingestionRunId } : {}),
      'Graph review': graphDeltaReviewCount > 0 ? `${graphDeltaReviewCount} candidate(s)` : 'none pending',
      Provenance: core.provenance?.kind ?? 'library',
    },
  };
}

function parseSourceReceipt(value: unknown): SourceImportReceipt | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const data = value as Record<string, unknown>;
  const sourceType = stringValue(data.sourceType);
  const attachedCore = stringValue(data.attachedCore);
  const confidence = numberValue(data.confidence);
  if (!sourceType || !attachedCore || confidence === undefined) return undefined;
  return {
    sourceType,
    attachedCore,
    confidence,
    claims: stringArray(data.claims).slice(0, 4),
    dates: stringArray(data.dates).slice(0, 4),
    actors: stringArray(data.actors).slice(0, 6),
    documentId: stringValue(data.documentId),
    chunkCount: numberValue(data.chunkCount),
    extractedAt: stringValue(data.extractedAt),
  };
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function formatDate(value: string): string {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return 'Not dated';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(parsed));
}
