'use client';

import { useState, type FormEvent } from 'react';
import type { CognitiveCapsule, CognitiveNode, CognitiveStatement, Condition } from '@/lib/cognitive-capsule/types';
import { CaptureField, captureFieldClass, captureRefs, parseCaptureConditions } from './CapsuleKnowledgeCapture';
import { describeCognitiveStatement } from './CapsuleCognitiveGraphPanel';

export type GraphReviewCard = { cognitiveNodeIds?: string[]; cognitiveStatementIds?: string[]; cognitiveSupersededIds?: string[]; proposedEnvelopePatch: { cognition?: Partial<CognitiveCapsule> } };
type GraphRecord = CognitiveNode | CognitiveStatement;
const conditionText = (values: Condition[]) => values.map((value) => `${value.operator}:${value.key}${value.operator === 'equals' ? `=${String(value.value)}` : ''}`).join('\n');
const fieldsToText = (value: unknown): string => typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : Array.isArray(value) ? value.map(fieldsToText).join('; ') : value && typeof value === 'object' ? Object.entries(value).map(([key, entry]) => `${key}: ${fieldsToText(entry)}`).join(' · ') : 'not recorded';

export function graphReviewRecords(card: GraphReviewCard): GraphRecord[] {
  const cognition = card.proposedEnvelopePatch.cognition;
  return [...(cognition?.nodes ?? []).filter((node) => card.cognitiveNodeIds?.includes(node.id)), ...(cognition?.statements ?? []).filter((statement) => card.cognitiveStatementIds?.includes(statement.id))];
}

export function buildGraphReviewEdit(item: GraphRecord, read: (key: string) => string): GraphRecord {
  const updated = { ...item, label: 'label' in item ? read('label').trim() : undefined } as GraphRecord & { label?: string };
  if ('predicate' in item) {
    delete updated.label;
    const result: CognitiveStatement = { ...item, subject: read('subject'), predicate: read('predicate').trim(),
      object: read('objectKind') === 'node' ? { node: read('objectNode') } : { literal: read('literalType') === 'number' ? Number(read('objectLiteral')) : read('literalType') === 'boolean' ? read('objectLiteral') === 'true' : read('objectLiteral') },
      polarity: read('polarity') as CognitiveStatement['polarity'], sourceRefs: captureRefs(read('sourceRefs')) };
    if (read('objectKind') !== 'node' && read('literalType') === 'boolean' && !['true', 'false'].includes(read('objectLiteral'))) throw new Error('A true-or-false relationship value must be true or false.');
    if (read('objectKind') !== 'node' && read('literalType') === 'number' && !read('objectLiteral').trim()) throw new Error('Enter a number for the relationship value.');
    if ('literal' in result.object && typeof result.object.literal === 'number' && !Number.isFinite(result.object.literal)) throw new Error('Enter a finite number for the relationship value.');
    for (const key of ['conditions', 'exceptions'] as const) if (read(key) !== conditionText(item[key])) result[key] = parseCaptureConditions(read(key));
    for (const key of ['modality', 'speechAct', 'assertedBy', 'language', 'validFrom', 'validUntil'] as const) {
      const value = read(key).trim();
      if (value) Object.assign(result, { [key]: value }); else delete result[key];
    }
    return result;
  }
  for (const key of ['validFrom', 'validUntil'] as const) { const value = read(key).trim(); if (value) updated[key] = value; else delete updated[key]; }
  return updated;
}

export function CapsuleGraphProposalDetails({ card, current }: { card: GraphReviewCard; current?: CognitiveCapsule }) {
  const proposed = card.proposedEnvelopePatch.cognition;
  const nodes = Array.from(new Map([...(current?.nodes ?? []), ...(proposed?.nodes ?? [])].map((node) => [node.id, node])).values());
  return <div className="min-w-0 space-y-3" aria-label="Proposed graph changes">
    {graphReviewRecords(card).map((item) => {
      const prior = 'predicate' in item ? current?.statements.find((value) => value.id === item.id) : current?.nodes.find((value) => value.id === item.id);
      const before = prior ? 'predicate' in prior ? describeCognitiveStatement(prior, current?.nodes ?? []) : prior.label : 'New item';
      const after = 'predicate' in item ? describeCognitiveStatement(item, nodes) : item.label;
      const keys = Object.keys(item).filter((key) => !['id', 'provenance', 'reviewState'].includes(key) && JSON.stringify((prior as unknown as Record<string, unknown> | undefined)?.[key]) !== JSON.stringify((item as unknown as Record<string, unknown>)[key]));
      return <details key={item.id} open className="min-w-0 space-y-2 break-words rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700"><summary className="cursor-pointer font-semibold text-slate-950">{'predicate' in item ? 'Relationship' : 'Node'}: {after}</summary>
        <p>Before: {before}</p><p>After: {after}</p><p>Review state: {item.reviewState}</p>
        <div className="space-y-1">{keys.map((key) => <p key={key}><span className="font-semibold">{key.replace(/([A-Z])/g, ' $1')}: </span>{fieldsToText((item as unknown as Record<string, unknown>)[key])}</p>)}</div>
        <p>Why: {'predicate' in item && item.rationaleRef ? nodes.find((node) => node.id === item.rationaleRef)?.label ?? item.rationaleRef : 'Inspect the proposal rationale and attached evidence before accepting.'}</p>
        <p>Authored by {item.provenance.generatedBy.id} ({item.provenance.generatedBy.type}) · {item.provenance.generatedBy.at}</p>
        {('predicate' in item ? item.sourceRefs : item.provenance.sourceRefs).map((id) => { const span = proposed?.evidence?.find((value) => value.id === id); return <blockquote key={id} className="break-words border-l-2 border-slate-300 pl-3">{span ? <><p>{span.quote}</p><p>Source: {span.sourceId} · Evidence ID: {span.id}</p></> : <p>Evidence reference unavailable: {id}</p>}</blockquote>; })}
        <p>Impact: this {prior ? 'changes a saved' : 'adds a new'} {'predicate' in item ? 'relationship' : 'node'}. Existing capsule knowledge remains saved until this review is accepted.</p>
      </details>;
    })}
    {card.cognitiveSupersededIds?.length ? <p className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">Accepting this proposal supersedes: {card.cognitiveSupersededIds.join(', ')}. Inspect these replacements before accepting.</p> : null}
  </div>;
}

export function CapsuleGraphProposalEditForm({ card, current, disabled, onAccept, onCancel }: { card: GraphReviewCard; current?: CognitiveCapsule; disabled: boolean; onAccept: (value: GraphRecord) => void; onCancel: () => void }) {
  const records = graphReviewRecords(card);
  const [selectedId, setSelectedId] = useState(records[0]?.id ?? '');
  const [error, setError] = useState('');
  const item = records.find((value) => value.id === selectedId) ?? records[0];
  const [objectKind, setObjectKind] = useState('auto');
  if (!item) return null;
  const nodes = Array.from(new Map([...(current?.nodes ?? []), ...(card.proposedEnvelopePatch.cognition?.nodes ?? [])].map((node) => [node.id, node])).values());
  const isStatement = 'predicate' in item;
  const selectedObjectKind = objectKind === 'auto' ? isStatement && 'literal' in item.object ? 'literal' : 'node' : objectKind;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (disabled || !item) return;
    const data = new FormData(event.currentTarget);
    try { onAccept(buildGraphReviewEdit(item, (key) => String(data.get(key) ?? ''))); setError(''); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Check the graph edit fields.'); }
  }
  function selectNode(name: string, label: string, defaultValue?: string, optional = false) {
    return <label className="block text-xs font-semibold text-slate-700">{label}<select name={name} className={captureFieldClass} defaultValue={defaultValue ?? ''} required={!optional}>{optional ? <option value="">Not recorded</option> : null}{nodes.map((node) => <option key={node.id} value={node.id}>{node.label}</option>)}</select></label>;
  }
  return <div className="min-w-0 space-y-3"><label className="block text-xs font-semibold text-slate-700">Graph item to edit<select value={item.id} className={captureFieldClass} onChange={(event) => { setSelectedId(event.target.value); setError(''); const next = records.find((value) => value.id === event.target.value); setObjectKind(next && 'predicate' in next && 'literal' in next.object ? 'literal' : 'node'); }}>{records.map((record) => <option key={record.id} value={record.id}>{'predicate' in record ? describeCognitiveStatement(record, nodes) : record.label}</option>)}</select></label>
    <form key={item.id} className="min-w-0 space-y-3 rounded-md bg-slate-50 p-3" onSubmit={submit}>
      <p className="text-xs text-slate-600">Edit this selected graph item. Acceptance applies to every changed item in the proposal; the original author is preserved.</p>
      {!isStatement ? <CaptureField name="label" label="Node label" defaultValue={item.label} required /> : <>
        {selectNode('subject', 'Subject', item.subject)}<CaptureField name="predicate" label="Relationship" defaultValue={item.predicate} required maxLength={240} />
        <label className="block text-xs font-semibold text-slate-700">Relationship target<select name="objectKind" className={captureFieldClass} value={selectedObjectKind} onChange={(event) => setObjectKind(event.target.value)}><option value="node">Graph node</option><option value="literal">Literal value</option></select></label>
        {selectedObjectKind === 'literal' ? <><label className="block text-xs font-semibold text-slate-700">Value type<select name="literalType" className={captureFieldClass} defaultValue={'literal' in item.object ? typeof item.object.literal : 'string'}><option value="string">Text</option><option value="number">Number</option><option value="boolean">True or false</option></select></label><CaptureField name="objectLiteral" label="Literal value" defaultValue={'literal' in item.object ? String(item.object.literal) : ''} required /></> : selectNode('objectNode', 'Target node', 'node' in item.object ? item.object.node : undefined)}
        <label className="block text-xs font-semibold text-slate-700">Polarity<select name="polarity" className={captureFieldClass} defaultValue={item.polarity}>{['positive', 'negative', 'mixed'].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="block text-xs font-semibold text-slate-700">Modality<select name="modality" className={captureFieldClass} defaultValue={item.modality ?? ''}><option value="">Not recorded</option>{['asserted', 'possible', 'probable', 'conditional', 'counterfactual', 'desired', 'obligatory'].map((value) => <option key={value}>{value}</option>)}</select></label>
        <CaptureField name="conditions" label="Relationship conditions (one per line)" defaultValue={conditionText(item.conditions)} area /><CaptureField name="exceptions" label="Relationship exceptions (one per line)" defaultValue={conditionText(item.exceptions)} area />
        <CaptureField name="speechAct" label="Communicative act" defaultValue={item.speechAct} />{selectNode('assertedBy', 'Speaker', item.assertedBy, true)}<CaptureField name="language" label="Language" defaultValue={item.language} maxLength={40} />
        <CaptureField name="sourceRefs" label="Evidence IDs (comma separated)" defaultValue={item.sourceRefs.join(', ')} />
      </>}
      <div className="grid min-w-0 gap-3 sm:grid-cols-2"><CaptureField name="validFrom" label="Valid from (ISO date)" defaultValue={item.validFrom} maxLength={40} /><CaptureField name="validUntil" label="Valid until (ISO date)" defaultValue={item.validUntil} maxLength={40} /></div>
      {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
      <div className="flex flex-wrap gap-2"><button type="submit" disabled={disabled} className="min-h-10 rounded border border-slate-300 px-3 py-2 text-xs font-semibold disabled:opacity-50">Edit selected graph item and accept proposal</button><button type="button" disabled={disabled} onClick={onCancel} className="min-h-10 rounded border border-slate-300 px-3 py-2 text-xs">Cancel edit</button></div>
    </form>
  </div>;
}
