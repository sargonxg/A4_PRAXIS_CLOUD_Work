'use client';

import Link from 'next/link';
import { AlertTriangle, Database, FileText, ShieldCheck, X } from 'lucide-react';
import { redactMarketplaceFoundationJson, redactMarketplaceFoundationMarkers } from '@/lib/tools/marketplace/ui-redaction';

type JsonRecord = Record<string, unknown>;

interface EvidenceDrawerProps {
  open: boolean;
  onClose: () => void;
  caseId: string;
  artifact: {
    toolName: string;
    artifactId: string;
    prompt?: string | null;
    summary?: string | null;
    rawText?: string | null;
    structuredOutput?: JsonRecord;
    contextDump?: JsonRecord;
    metadata?: JsonRecord;
    generatedAt?: string;
  } | null;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function records(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function compactJson(value: unknown): string {
  if (value == null) return 'None recorded.';
  try {
    return redactMarketplaceFoundationMarkers(JSON.stringify(redactMarketplaceFoundationJson(value), null, 2).slice(0, 3200));
  } catch {
    return 'Unable to render this evidence payload.';
  }
}

function provenanceLink(caseId: string, provenance: string | null) {
  if (!provenance) return null;
  if (!provenance.startsWith('case:')) return null;
  return `/app/workbench/${encodeURIComponent(caseId)}?tab=graph`;
}

export function EvidenceDrawer({ open, onClose, caseId, artifact }: EvidenceDrawerProps) {
  if (!open || !artifact) return null;

  const structured = artifact.structuredOutput ?? {};
  const contextDump = artifact.contextDump ?? {};
  const metadata = artifact.metadata ?? {};
  const claims = records(structured.claims);
  const artifacts = records(structured.artifacts);
  const advisories = records(structured.advisories);
  const nextActions = Array.isArray(structured.nextActions) ? structured.nextActions.map(String).slice(0, 6) : [];
  const handlerContract = isRecord(structured.handlerContract) ? structured.handlerContract : null;
  const posture = isRecord(structured.posture) ? structured.posture : null;
  const memoPayload = isRecord(structured.memo) ? structured.memo : null;
  const snapshot = isRecord(contextDump.snapshot) ? contextDump.snapshot : null;
  const snapshotCase = snapshot && isRecord(snapshot.case) ? snapshot.case : null;
  const composite = snapshot && isRecord(snapshot.composite) ? snapshot.composite : null;
  const projection = isRecord(contextDump.projection) ? contextDump.projection : null;
  const runTelemetry = isRecord(metadata.runTelemetry) ? metadata.runTelemetry : null;

  return (
    <div className="fixed inset-0 z-50 bg-navy-950/45 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label="Tool run evidence">
      <div className="ml-auto flex h-full w-full max-w-5xl flex-col rounded-lg border border-slate-200 bg-white shadow-2xl shadow-navy-950/25">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold text-navy-950">
              <ShieldCheck className="h-4 w-4 text-diplomatic-blue" />
              Evidence for {artifact.toolName}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Artifact {artifact.artifactId}
              {artifact.generatedAt ? ` - ${new Date(artifact.generatedAt).toLocaleString()}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close evidence drawer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <section className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <FileText className="h-3 w-3" />
                Run summary
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-750">{artifact.summary ? redactMarketplaceFoundationMarkers(artifact.summary) : 'No structured summary recorded.'}</p>
              {artifact.prompt ? (
                <p className="mt-3 rounded border border-slate-200 bg-white p-2 text-xs leading-5 text-slate-650">
                  <span className="font-semibold text-navy-950">Prompt:</span> {redactMarketplaceFoundationMarkers(artifact.prompt)}
                </p>
              ) : null}
              {runTelemetry ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <Metric label="Duration" value={numberValue(runTelemetry.durationMs) != null ? `${numberValue(runTelemetry.durationMs)}ms` : 'Pending'} />
                  <Metric label="Cost class" value={stringValue(runTelemetry.costClass) ?? 'Pending'} />
                  <Metric label="Stage" value={stringValue(metadata.handlerStage) ?? 'Stored'} />
                </div>
              ) : null}
            </section>

            <section className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <Database className="h-3 w-3" />
                Context snapshot
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <Metric label="Case" value={stringValue(snapshotCase?.frame && isRecord(snapshotCase.frame) ? snapshotCase.frame.name : snapshotCase?.caseId) ?? stringValue(snapshotCase?.caseId) ?? 'Unknown'} />
                <Metric label="Health" value={numberValue(composite?.health) != null ? `${numberValue(composite?.health)}/100` : 'Unknown'} />
                <Metric label="Weakest layer" value={stringValue(composite?.weakestLayer) ?? 'Unknown'} />
                <Metric label="Projection" value={stringValue(projection?.mode) ?? 'Context-aware'} />
              </div>
              {projection ? (
                <pre className="mt-3 max-h-40 overflow-auto rounded border border-slate-200 bg-white p-2 text-[11px] leading-5 text-slate-650">
                  {compactJson(projection)}
                </pre>
              ) : null}
            </section>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <section className="rounded-md border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Claims and provenance</p>
              {claims.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">No claim-level evidence recorded for this run.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {claims.map((claim, index) => {
                    const provenance = stringValue(claim.provenance);
                    const href = provenanceLink(caseId, provenance);
                    return (
                      <div key={`${provenance ?? 'claim'}-${index}`} className="rounded border border-slate-200 bg-slate-50 p-2">
                        <p className="text-sm leading-6 text-slate-750">{stringValue(claim.text) ?? 'Untitled claim'}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          <span>Trust {numberValue(claim.trustScore) != null ? numberValue(claim.trustScore)?.toFixed(2) : 'unrated'}</span>
                          {href ? <Link href={href} className="text-diplomatic-blue hover:underline">Open graph evidence</Link> : <span>{provenance ?? 'No provenance'}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-md border border-slate-200 bg-white p-3">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <AlertTriangle className="h-3 w-3" />
                Advisories and next actions
              </p>
              {advisories.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">No context advisories recorded.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {advisories.map((advisory, index) => (
                    <li key={`${stringValue(advisory.message) ?? 'advisory'}-${index}`} className="rounded border border-amber-200 bg-amber-50 p-2 text-xs leading-5 text-amber-950">
                      <span className="font-semibold">{stringValue(advisory.severity)?.toUpperCase() ?? 'ADVISORY'}:</span> {stringValue(advisory.message) ?? compactJson(advisory)}
                    </li>
                  ))}
                </ul>
              )}
              {nextActions.length > 0 ? (
                <ul className="mt-3 space-y-1">
                  {nextActions.map((action) => (
                    <li key={action} className="text-xs leading-5 text-slate-650">- {action}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            {memoPayload ? (
              <section className="rounded-md border border-gold-200 bg-gold-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-800">Memo Studio handoff</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <Metric label="Operation" value={stringValue(memoPayload.operation) ?? 'Memo'} />
                  <Metric label="Studio ready" value={memoPayload.memoStudioReady === true ? 'Yes' : 'Review first'} />
                  <Metric label="Review" value={memoPayload.reviewRequired === true ? 'Required' : 'Optional'} />
                </div>
                <pre className="mt-3 max-h-56 overflow-auto rounded border border-gold-200 bg-white p-2 text-[11px] leading-5 text-slate-700">
                  {compactJson(memoPayload)}
                </pre>
              </section>
            ) : null}

            <section className="rounded-md border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Generated artifacts</p>
              {artifacts.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">No generated sub-artifacts recorded.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {artifacts.map((item, index) => (
                    <div key={`${stringValue(item.title) ?? 'artifact'}-${index}`} className="rounded border border-slate-200 bg-slate-50 p-2">
                      <p className="text-xs font-semibold text-navy-950">{stringValue(item.title) ?? stringValue(item.type) ?? 'Artifact'}</p>
                      <p className="mt-1 max-h-28 overflow-auto text-xs leading-5 text-slate-650">{stringValue(item.text) ?? compactJson(item)}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-md border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Handler posture</p>
              <pre className="mt-2 max-h-64 overflow-auto rounded border border-slate-200 bg-slate-50 p-2 text-[11px] leading-5 text-slate-650">
                {compactJson({ handlerContract, posture, metadata })}
              </pre>
            </section>
          </div>

          <section className="mt-4 rounded-md border border-slate-200 bg-white p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Raw output</p>
            <pre className="mt-2 max-h-64 overflow-auto rounded border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-700">
              {artifact.rawText ? redactMarketplaceFoundationMarkers(artifact.rawText) : 'No raw text recorded.'}
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-200 bg-white px-2 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 break-words text-xs font-semibold text-navy-950">{value}</p>
    </div>
  );
}
