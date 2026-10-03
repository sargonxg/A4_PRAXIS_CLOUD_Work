'use client';

import { useState } from 'react';
import type { CognitiveCapsule, CognitiveNode, CognitiveStatement, Condition, EvidenceSpan, KnowledgeProvenance } from '@/lib/cognitive-capsule/types';

type GraphInventory = Pick<CognitiveCapsule, 'nodes' | 'statements' | 'evidence'>;
const controlClass = 'min-h-10 min-w-0 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950';
const humanize = (value: string) => value.replace(/_/g, ' ').toLowerCase();
const nodeLabel = (id: string, nodes: CognitiveNode[]) => nodes.find((node) => node.id === id)?.label ?? id;
export function describeCognitiveStatement(statement: CognitiveStatement, nodes: CognitiveNode[]): string {
  const target = 'node' in statement.object ? nodeLabel(statement.object.node, nodes) : String(statement.object.literal);
  return `${nodeLabel(statement.subject, nodes)} → ${humanize(statement.predicate)} → ${target}`;
}
export function filterCognitiveStatements(cognition: GraphInventory, search: string, layer: string): CognitiveStatement[] {
  const query = search.trim().toLocaleLowerCase();
  const labels = new Map(cognition.nodes.map((node) => [node.id, node.label]));
  const spans = new Map(cognition.evidence.map((span) => [span.id, span]));
  return cognition.statements.filter((statement) => (layer === 'all' || statement.layer === layer) && (!query || [
    labels.get(statement.subject) ?? statement.subject, humanize(statement.predicate), 'node' in statement.object ? labels.get(statement.object.node) ?? statement.object.node : String(statement.object.literal), statement.id, statement.reviewState, statement.modality,
    statement.provenance.generatedBy.id, ...statement.sourceRefs,
    ...statement.sourceRefs.map((id) => { const span = spans.get(id); return span ? `${span.quote} ${span.sourceId}` : ''; }),
  ].join(' ').toLocaleLowerCase().includes(query)));
}

function Conditions({ title, values }: { title: string; values: Condition[] }) {
  return <div><p className="font-semibold text-slate-900">{title}</p>{values.length ? <ul className="mt-1 list-inside list-disc">{values.map((condition, index) => <li key={index}>{condition.key}: {condition.operator === 'equals' ? `equals ${String(condition.value)}` : condition.operator} ({condition.kind})</li>)}</ul> : <p className="mt-1">None recorded.</p>}</div>;
}
function Authorship({ provenance }: { provenance: KnowledgeProvenance }) {
  return <div className="space-y-1"><p>Authored by {provenance.generatedBy.id} ({provenance.generatedBy.type}) · {provenance.generatedBy.at}</p><p>Origin: {humanize(provenance.confidenceKind)}</p>{provenance.reviewedBy ? <p>Reviewed by {provenance.reviewedBy.id} · {provenance.reviewedAt}</p> : <p>No human review recorded.</p>}{provenance.derivedFrom.length ? <p>Derived from: {provenance.derivedFrom.join(', ')}</p> : null}</div>;
}
function EvidenceExcerpt({ span }: { span: EvidenceSpan }) {
  const safeUri = span.uri && /^https?:\/\//i.test(span.uri) ? span.uri : undefined;
  return <blockquote className="min-w-0 space-y-2 break-words border-l-2 border-slate-300 pl-3 text-xs text-slate-700" data-testid="cognitive-evidence-excerpt">
    <p className="whitespace-pre-wrap">{span.quote}</p><p>Source: {span.sourceId} · Version: {span.sourceVersion}</p>
    <p>{span.page ? `Page ${span.page} · ` : ''}Anchor: {span.anchorStatus} · Stance: {span.stance}</p>
    {span.start !== undefined ? <p>Text offsets: {span.start}–{span.end}</p> : null}
    <p>Evidence ID: {span.id}</p>{span.quoteHash ? <p>Quote hash: {span.quoteHash}</p> : null}
    {span.documentId ? <p>Document: {span.documentId}{span.chunkId ? ` · Chunk: ${span.chunkId}` : ''}</p> : null}
    {safeUri ? <a className="inline-block min-h-10 py-2 underline" href={safeUri} target="_blank" rel="noopener noreferrer">Open source</a> : null}
  </blockquote>;
}

export function CapsuleCognitiveGraphPanel({ cognition }: { cognition: GraphInventory }) {
  const [search, setSearch] = useState('');
  const [layer, setLayer] = useState('all');
  const [selectedId, setSelectedId] = useState('');
  const [selectedEvidenceId, setSelectedEvidenceId] = useState('');
  const [visibleCount, setVisibleCount] = useState(50);
  const statements = filterCognitiveStatements(cognition, search, layer);
  const selected = statements.find((statement) => statement.id === selectedId) ?? statements[0];
  const query = search.trim().toLocaleLowerCase();
  const nodes = cognition.nodes.filter((node) => (layer === 'all' || node.layer === layer) && (!query || `${node.label} ${node.type} ${node.id} ${node.provenance.generatedBy.id}`.toLocaleLowerCase().includes(query)));
  const evidence = cognition.evidence.filter((span) => !query || `${span.id} ${span.sourceId} ${span.quote}`.toLocaleLowerCase().includes(query));
  const selectedEvidence = evidence.find((span) => span.id === selectedEvidenceId) ?? evidence[0];
  const layers = Array.from(new Set([...cognition.nodes.map((node) => node.layer), ...cognition.statements.map((statement) => statement.layer)]));
  return <section aria-label="Cognitive graph and evidence" className="min-w-0 space-y-4 rounded-md border border-slate-200 bg-white p-3" data-testid="capsule-cognitive-graph">
    <div><h3 className="text-sm font-semibold text-slate-950">Graph and evidence</h3><p className="mt-1 text-xs text-slate-600">Inspect a relationship before using it. Conditions, wording and review status limit what it establishes.</p></div>
    <div className="grid min-w-0 gap-3 sm:grid-cols-2"><label className="min-w-0 text-xs font-semibold text-slate-700">Search graph and evidence<input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setVisibleCount(50); }} className={`${controlClass} mt-1`} placeholder="Actor, relationship, author, source or wording" /></label><label className="min-w-0 text-xs font-semibold text-slate-700">Graph layer<select value={layer} onChange={(event) => { setLayer(event.target.value); setVisibleCount(50); }} className={`${controlClass} mt-1`}><option value="all">All layers</option>{layers.map((value) => <option key={value} value={value}>{humanize(value)}</option>)}</select></label></div>
    <p className="text-xs text-slate-600">{statements.length} relationships · {nodes.length} nodes · {evidence.length} evidence excerpts match.</p>
    <div className="grid min-w-0 gap-4 xl:grid-cols-2">
      <div className="min-w-0 space-y-2" aria-label="Cognitive relationships">
        {statements.slice(0, visibleCount).map((statement) => <button key={statement.id} type="button" aria-pressed={selected?.id === statement.id} onClick={() => setSelectedId(statement.id)} className={`min-h-11 w-full min-w-0 rounded-md border p-3 text-left text-xs ${selected?.id === statement.id ? 'border-slate-700 bg-slate-100' : 'border-slate-200 bg-white'}`}><span className="block break-words font-semibold text-slate-900">{describeCognitiveStatement(statement, cognition.nodes)}</span><span className="mt-1 block text-slate-600">{statement.layer} · {statement.reviewState} · {statement.modality ?? 'modality not recorded'}</span></button>)}
        {!statements.length ? <p className="text-xs text-slate-600">{cognition.statements.length ? 'No relationships match this search and layer.' : 'No cognitive relationships are recorded yet.'}</p> : null}
        {statements.length > visibleCount ? <button type="button" className={controlClass} onClick={() => setVisibleCount((value) => value + 50)}>Show more relationships</button> : null}
      </div>
      {selected ? <article aria-label="Selected cognitive relationship" className="min-w-0 space-y-3 break-words rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
        <h4 className="font-semibold text-slate-950">{describeCognitiveStatement(selected, cognition.nodes)}</h4>
        <p>Relationship: {selected.predicate} · {selected.layer} layer</p><p>Polarity: {selected.polarity} · Modality: {selected.modality ?? 'not recorded'}{selected.strength ? ` · Strength: ${selected.strength}` : ''}</p>
        {selected.speechAct ? <p>Communicative act: {selected.speechAct} · Speaker: {selected.assertedBy ? nodeLabel(selected.assertedBy, cognition.nodes) : 'not recorded'}</p> : null}
        {selected.channel ? <p>Channel: {selected.channel}</p> : null}{selected.language ? <p>Language: {selected.language}</p> : null}
        <p>Validity: {selected.validFrom ?? 'start not recorded'} → {selected.validUntil ?? 'end not recorded'}</p>{selected.observedAt ? <p>Observed: {selected.observedAt}</p> : null}
        <Conditions title="Conditions" values={selected.conditions} /><Conditions title="Exceptions" values={selected.exceptions} />
        <p>Rationale: {selected.rationaleRef ? nodeLabel(selected.rationaleRef, cognition.nodes) : 'No rationale reference recorded.'}</p>
        <p>Review state: {selected.reviewState}</p><Authorship provenance={selected.provenance} />
        <div className="space-y-3"><p className="font-semibold text-slate-900">Evidence behind this relationship</p>{Array.from(new Set([...selected.sourceRefs, ...(selected.wordingRef ? [selected.wordingRef] : [])])).map((id) => {
          const span = cognition.evidence.find((value) => value.id === id);
          return span ? <EvidenceExcerpt key={id} span={span} /> : <p key={id} className="text-amber-800">Evidence reference unavailable: {id}</p>;
        })}{!selected.sourceRefs.length && !selected.wordingRef ? <p>No evidence span attached. Treat factual use as an evidence gap.</p> : null}</div>
        <p>Relationship ID: {selected.id}</p>
      </article> : null}
    </div>
    <details><summary className="cursor-pointer text-xs font-semibold text-slate-700">Inspect graph nodes ({nodes.length})</summary><div className="mt-3 grid min-w-0 gap-2 sm:grid-cols-2">{nodes.slice(0, visibleCount).map((node) => <details key={node.id} className="min-w-0 break-words rounded border border-slate-200 p-3 text-xs text-slate-600"><summary className="cursor-pointer font-semibold text-slate-900">{node.label} · {node.type}</summary><div className="mt-2 space-y-2"><p>{node.layer} · {node.reviewState} · ID: {node.id}</p><p>Validity: {node.validFrom ?? 'not recorded'} → {node.validUntil ?? 'not recorded'}</p><Authorship provenance={node.provenance} /></div></details>)}</div>{nodes.length > visibleCount ? <button type="button" className={`${controlClass} mt-2`} onClick={() => setVisibleCount((value) => value + 50)}>Show more nodes</button> : null}</details>
    <details><summary className="cursor-pointer text-xs font-semibold text-slate-700">Inspect saved evidence ({evidence.length})</summary><div className="mt-3 space-y-3"><label className="block text-xs font-semibold text-slate-700">Select evidence excerpt<select className={`${controlClass} mt-1`} value={selectedEvidence?.id ?? ''} onChange={(event) => setSelectedEvidenceId(event.target.value)}>{!evidence.length ? <option value="">No evidence matches</option> : evidence.map((span) => <option key={span.id} value={span.id}>{span.sourceId} · {span.id}</option>)}</select></label>{selectedEvidence ? <EvidenceExcerpt span={selectedEvidence} /> : <p className="text-xs text-slate-600">No saved evidence excerpt matches this search.</p>}</div></details>
  </section>;
}
