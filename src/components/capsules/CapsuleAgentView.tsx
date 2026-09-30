'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AlertTriangle, FileText, GitBranch, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { StatePill } from '@/components/capsules/workbench/CapsuleWorkbenchSections';

export type AgentPacketTier = 'tiny' | 'standard' | 'expanded';

export interface CapsuleAgentPacketResponse {
  packetText: string;
  selectedCounts: {
    nodes: number;
    edges: number;
    claims: number;
    sources: number;
    paths: number;
    timeline: number;
    causalLinks: number;
  };
  omitted: Array<{
    id: string;
    kind: 'node' | 'edge' | 'claim' | 'source' | 'path' | 'causal';
    reason: 'low_relevance' | 'stale' | 'unsupported' | 'duplicate' | 'budget';
    detail: string;
  }>;
  groundingMap: {
    display: {
      nodes: Record<string, string>;
      edges: Record<string, string>;
      claims: Record<string, string>;
      sources: Record<string, string>;
      paths: Record<string, string[]>;
    };
    claims: Array<{
      id: string;
      originalId: string;
      text: string;
      nodes: Array<{ id: string; originalId: string; label?: string }>;
      edges: Array<{ id: string; originalId: string; label?: string }>;
      sources: Array<{ id: string; originalId: string; title?: string; url?: string | null }>;
      contradicts: Array<{ id: string; originalId: string; title?: string; url?: string | null }>;
    }>;
  };
  riskFlags: Array<{
    id: string;
    kind: 'stale_source' | 'advisory_row' | 'inferred_edge' | 'conflict' | 'missing_primitive';
    severity: 'critical' | 'warning' | 'notice';
    label: string;
    detail: string;
  }>;
}

export function CapsuleAgentView({
  capsuleId,
  query,
  tier = 'standard',
}: {
  capsuleId: string;
  query?: string | null;
  tier?: AgentPacketTier;
}) {
  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    const q = query?.trim();
    if (q) params.set('q', q);
    if (tier !== 'standard') params.set('tier', tier);
    const suffix = params.toString();
    return `/api/context/capsules/${encodeURIComponent(capsuleId)}/agent-packet${suffix ? `?${suffix}` : ''}`;
  }, [capsuleId, query, tier]);
  const [result, setResult] = useState<{
    endpoint: string;
    data: CapsuleAgentPacketResponse | null;
    error: string | null;
  } | null>(null);
  const stale = result?.endpoint !== endpoint;

  useEffect(() => {
    const controller = new AbortController();
    fetch(endpoint, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Packet route returned ${response.status}`);
        return response.json() as Promise<CapsuleAgentPacketResponse>;
      })
      .then((payload) => setResult({ endpoint, data: payload, error: null }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setResult({
          endpoint,
          data: null,
          error: err instanceof Error ? err.message : 'Could not load agent packet.',
        });
      });
    return () => controller.abort();
  }, [endpoint]);

  if (stale) return <CapsuleAgentViewLoading />;
  if (result.error) return <CapsuleAgentViewError message={result.error} />;
  if (!result.data) return <CapsuleAgentViewEmpty />;
  return <CapsuleAgentViewContent data={result.data} />;
}

export default CapsuleAgentView;

export function CapsuleAgentViewContent({ data }: { data: CapsuleAgentPacketResponse }) {
  const emptyGraph = data.selectedCounts.nodes + data.selectedCounts.edges + data.selectedCounts.claims + data.selectedCounts.sources === 0;
  const sections = splitPacketSections(data.packetText);

  return (
    <section className="rounded-md border border-slate-200 bg-white" data-testid="capsule-agent-view">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 p-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">What the agent sees</p>
          <h3 className="mt-1 text-sm font-semibold text-slate-950">Packet v1, grounding, omissions, and risk</h3>
        </div>
        <StatePill state="advisory" label={data.riskFlags.length ? `${data.riskFlags.length} flags` : 'No risk flags reported'} />
      </div>

      <div className="grid gap-3 p-3">
        {emptyGraph ? (
          <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            No selected graph rows yet. The serializer still returns the empty-graph packet for the agent contract.
          </div>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-4">
          <CountTile label="Nodes" value={data.selectedCounts.nodes} />
          <CountTile label="Edges" value={data.selectedCounts.edges} />
          <CountTile label="Claims" value={data.selectedCounts.claims} />
          <CountTile label="Sources" value={data.selectedCounts.sources} />
        </div>

        <Panel title="Packet preview" icon={<FileText className="h-4 w-4" />}>
          <div className="grid gap-2">
            {sections.map((section, index) => (
              <details key={`${section.title}-${index}`} open={index < 2} className="rounded-md border border-slate-200 bg-slate-50">
                <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-slate-700">{section.title}</summary>
                <pre className="max-h-80 overflow-auto whitespace-pre-wrap border-t border-slate-200 p-3 font-mono text-[11px] leading-5 text-slate-800">
                  {section.text}
                </pre>
              </details>
            ))}
          </div>
        </Panel>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <Panel title="Salience ledger" icon={<ShieldCheck className="h-4 w-4" />}>
            <div className="grid gap-2">
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                <LedgerMetric label="Paths" value={data.selectedCounts.paths} />
                <LedgerMetric label="Timeline" value={data.selectedCounts.timeline} />
                <LedgerMetric label="Causal" value={data.selectedCounts.causalLinks} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Omitted</p>
                {data.omitted.length ? (
                  <ul className="mt-2 grid gap-1.5">
                    {data.omitted.slice(0, 8).map((item) => (
                      <li key={`${item.kind}:${item.id}:${item.reason}`} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-600">
                        <span className="font-mono font-semibold text-slate-800">{item.id}</span>
                        <span className="ml-2 font-semibold text-slate-700">{item.reason}</span>
                        <span className="block pt-0.5 text-[11px] leading-4 text-slate-500">{item.detail}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 rounded-md border border-dashed border-slate-200 px-2 py-1.5 text-xs text-slate-500">No omitted rows reported.</p>
                )}
              </div>
            </div>
          </Panel>

          <Panel title="Grounding map" icon={<GitBranch className="h-4 w-4" />}>
            {data.groundingMap.claims.length ? (
              <div className="grid gap-2">
                {data.groundingMap.claims.slice(0, 8).map((claim) => (
                  <article key={claim.id} className="rounded-md border border-slate-200 bg-slate-50 p-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="min-w-0 text-xs font-semibold leading-5 text-slate-900">
                        <span className="font-mono text-slate-500">{claim.id}</span> {claim.text}
                      </p>
                      {claim.contradicts.length ? <StatePill state="advisory" label="conflict" /> : null}
                    </div>
                    <GroundingRefs label="Nodes" refs={claim.nodes} />
                    <GroundingRefs label="Edges" refs={claim.edges} />
                    <GroundingRefs label="Sources" refs={claim.sources} source />
                    {claim.contradicts.length ? <GroundingRefs label="Contradicts" refs={claim.contradicts} source /> : null}
                  </article>
                ))}
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-slate-200 px-2 py-1.5 text-xs text-slate-500">No claim-to-source rows selected.</p>
            )}
          </Panel>
        </div>

        <Panel title="Risk flags" icon={<AlertTriangle className="h-4 w-4" />}>
          {data.riskFlags.length ? (
            <ul className="grid gap-2 sm:grid-cols-2">
              {data.riskFlags.map((flag) => (
                <li key={`${flag.kind}:${flag.id}`} className={cn('rounded-md border px-2 py-1.5 text-xs', riskClass(flag.severity))}>
                  <span className="font-semibold">{flag.label}</span>
                  <span className="ml-1 font-mono text-[11px] opacity-80">{flag.id}</span>
                  <span className="block pt-0.5 leading-4">{flag.detail}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-md border border-dashed border-slate-200 px-2 py-1.5 text-xs text-slate-500">No risk flags were reported. This is not a review or factual approval.</p>
          )}
        </Panel>
      </div>
    </section>
  );
}

function CapsuleAgentViewLoading() {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-3" aria-busy="true" aria-label="Loading agent context">
      <div className="h-4 w-40 rounded bg-slate-100" />
      <div className="mt-3 grid gap-2">
        <div className="h-24 rounded-md bg-slate-50" />
        <div className="h-24 rounded-md bg-slate-50" />
      </div>
    </section>
  );
}

function CapsuleAgentViewError({ message }: { message: string }) {
  return (
    <section className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">
      Could not load agent context. <span className="font-mono text-xs">{message}</span>
    </section>
  );
}

function CapsuleAgentViewEmpty() {
  return (
    <section className="rounded-md border border-dashed border-slate-200 bg-white p-3 text-sm text-slate-500">
      Agent context is not available for this capsule yet.
    </section>
  );
}

function CountTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function LedgerMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-white px-2 py-1.5">
      <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</span>
      <span className="block text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-md border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-950 text-white">{icon}</span>
        <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{title}</h4>
      </div>
      {children}
    </section>
  );
}

function GroundingRefs({
  label,
  refs,
  source = false,
}: {
  label: string;
  refs: Array<{ id: string; originalId: string; label?: string; title?: string; url?: string | null }>;
  source?: boolean;
}) {
  return (
    <p className="mt-1 flex flex-wrap gap-1 text-[11px] leading-5 text-slate-500">
      <span className="font-semibold text-slate-600">{label}:</span>
      {refs.length ? refs.map((ref) => (
        source && ref.url ? (
          <a key={`${label}:${ref.id}`} href={ref.url} className="rounded-md border border-slate-200 bg-white px-1.5 font-mono font-semibold text-slate-700 underline-offset-2 hover:underline">
            {ref.id}
          </a>
        ) : (
          <span key={`${label}:${ref.id}`} className="rounded-md border border-slate-200 bg-white px-1.5 font-mono font-semibold text-slate-700">
            {ref.id}
          </span>
        )
      )) : <span>none</span>}
    </p>
  );
}

function riskClass(severity: CapsuleAgentPacketResponse['riskFlags'][number]['severity']): string {
  if (severity === 'critical') return 'border-rose-200 bg-rose-50 text-rose-800';
  if (severity === 'warning') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-sky-200 bg-sky-50 text-sky-800';
}

function splitPacketSections(packetText: string): Array<{ title: string; text: string }> {
  const chunks = packetText.split(/\n(?=###\s+\d+\.)/g).map((chunk) => chunk.trim()).filter(Boolean);
  return chunks.map((text, index) => ({
    title: text.match(/^###\s+(.+)$/m)?.[1] ?? (index === 0 ? 'Packet header' : `Packet section ${index + 1}`),
    text,
  }));
}
