import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CapsuleCognitiveGraphPanel, filterCognitiveStatements, describeCognitiveStatement } from '@/components/capsules/CapsuleCognitiveGraphPanel';
import { CognitiveCapsuleSchema } from '@/lib/cognitive-capsule/schema';
import { buildGraphReviewEdit, CapsuleGraphProposalDetails, CapsuleGraphProposalEditForm } from '@/components/capsules/CapsuleGraphProposalReview';

const generatedBy = { type: 'human', id: 'expert-a', at: '2026-10-03T00:00:00Z' };
const provenance = { generatedBy, sourceRefs: ['ev-1'], reviewedBy: generatedBy, reviewedAt: generatedBy.at };
const capsule = CognitiveCapsuleSchema.parse({ schemaVersion: 'cognitive-capsule/vNext', capsuleId: 'graph-qa', version: '1.0.0',
  nodes: [{ id: 'actor', label: 'State A', type: 'Actor', layer: 'world', provenance }, { id: 'proposal', label: 'Arrangement', type: 'Proposal', layer: 'world', provenance }],
  statements: [{ id: 'conditional', subject: 'actor', predicate: 'ACCEPTS_CONDITIONALLY', object: { node: 'proposal' }, layer: 'language', polarity: 'positive', modality: 'conditional', sourceRefs: ['ev-1'], provenance, conditions: [{ kind: 'context', key: 'approval', operator: 'present' }], exceptions: [{ kind: 'context', key: 'objection', operator: 'present' }], validFrom: '2026-10-01', validUntil: '2026-10-31', reviewState: 'accepted' }, { id: 'literal', subject: 'actor', predicate: 'HAS_BUDGET', object: { literal: 0 }, layer: 'world', polarity: 'negative', sourceRefs: ['ev-1'], provenance }],
  evidence: [{ id: 'ev-1', sourceId: 'source-1', sourceVersion: 'v1', quote: 'Prepared to consider under appropriate circumstances.', page: 2, uri: 'https://example.org/source', anchorStatus: 'exact' }],
});
describe('cognitive graph inspection', () => {
  it('searches relation, node labels and evidence while respecting the selected layer', () => {
    expect(filterCognitiveStatements(capsule, 'prepared', 'language').map((value) => value.id)).toEqual(['conditional']);
    expect(filterCognitiveStatements(capsule, 'State A', 'world').map((value) => value.id)).toEqual(['literal']);
    expect(filterCognitiveStatements(capsule, 'missing', 'all')).toEqual([]);
    expect(describeCognitiveStatement(capsule.statements[1], capsule.nodes)).toContain('0');
  });
  it('shows the selected edge semantics and exact evidence provenance rather than an unexplained graph line', () => {
    const html = renderToStaticMarkup(<CapsuleCognitiveGraphPanel cognition={capsule} />);
    expect(html).toContain('State A'); expect(html).toContain('Arrangement'); expect(html).toContain('accepts conditionally');
    expect(html).toContain('approval'); expect(html).toContain('objection'); expect(html).toContain('2026-10-31');
    expect(html).toContain('Prepared to consider'); expect(html).toContain('source-1'); expect(html).toContain('expert-a'); expect(html).toContain('Page 2');
    expect(html).toContain('aria-pressed="true"'); expect(html).toContain('min-w-0');
  });
  it('reports unresolved evidence references and an empty graph explicitly', () => {
    const html = renderToStaticMarkup(<CapsuleCognitiveGraphPanel cognition={{ ...capsule, evidence: [] }} />);
    expect(html).toContain('Evidence reference unavailable: ev-1');
    expect(renderToStaticMarkup(<CapsuleCognitiveGraphPanel cognition={{ nodes: [], statements: [], evidence: [] }} />)).toContain('No cognitive relationships');
  });
  it('shows proposed graph changes with before, after, source and explicit supersession impact', () => {
    const card = { cognitiveNodeIds: [], cognitiveStatementIds: ['conditional'], cognitiveSupersededIds: ['old-relation'], proposedEnvelopePatch: { cognition: { ...capsule, statements: [{ ...capsule.statements[0], predicate: 'CONSIDERS', reviewState: 'proposed' as const }] } } };
    const html = renderToStaticMarkup(<CapsuleGraphProposalDetails card={card} current={capsule} />);
    expect(html).toContain('Before:'); expect(html).toContain('accepts conditionally'); expect(html).toContain('After:'); expect(html).toContain('considers');
    expect(html).toContain('Prepared to consider'); expect(html).toContain('supersedes: old-relation'); expect(html).toContain('Impact:');
    expect(renderToStaticMarkup(<CapsuleGraphProposalEditForm card={card} disabled={false} onAccept={() => {}} onCancel={() => {}} />)).toContain('Edit selected graph item and accept proposal');
  });
  it('edits a typed relationship while preserving untouched conditions and original provenance', () => {
    const original = capsule.statements[0];
    const values: Record<string, string> = { subject: 'actor', predicate: 'CONSIDERS', objectKind: 'literal', literalType: 'boolean', objectLiteral: 'false', polarity: 'negative', modality: 'possible', conditions: 'present:approval', exceptions: 'present:objection', sourceRefs: 'ev-1', validFrom: '2026-10-01', validUntil: '2026-10-31' };
    const edited = buildGraphReviewEdit(original, (key) => values[key] ?? '');
    expect(edited).toMatchObject({ id: original.id, object: { literal: false }, predicate: 'CONSIDERS', conditions: original.conditions, provenance: original.provenance });
    expect(original.object).toEqual({ node: 'proposal' });
    expect(() => buildGraphReviewEdit(original, (key) => key === 'objectLiteral' ? 'not-boolean' : values[key] ?? '')).toThrow(/true or false/);
  });
  it('keeps unchanged existing graph nodes selectable when the review projection contains only changed records', () => {
    const card = { cognitiveNodeIds: [], cognitiveStatementIds: ['conditional'], proposedEnvelopePatch: { cognition: { ...capsule, nodes: [], statements: [capsule.statements[0]] } } };
    const html = renderToStaticMarkup(<CapsuleGraphProposalEditForm card={card} current={capsule} disabled={false} onAccept={() => {}} onCancel={() => {}} />);
    expect(html).toContain('value="actor"'); expect(html).toContain('value="proposal"'); expect(html).toContain('State A');
  });
});
