import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CapsuleAgentViewContent, type CapsuleAgentPacketResponse } from '@/components/capsules/CapsuleAgentView';

const packet: CapsuleAgentPacketResponse = {
  packetText: [
    '## PRAXIS Agent Context Graph Packet v1',
    'packet_id: capsule:cap-1:turn:unknown:graph-packet-v1',
    '',
    '### 3. Salience Ledger',
    'selected_counts: nodes=1; edges=1; claims=1; sources=1; omitted=1',
    '',
    '### 5. Claim Cards',
    '[CL-1] text=The commitment is contested.',
  ].join('\n'),
  selectedCounts: {
    nodes: 1,
    edges: 1,
    claims: 1,
    sources: 1,
    paths: 0,
    timeline: 0,
    causalLinks: 0,
  },
  omitted: [{ id: 'edge-9', kind: 'edge', reason: 'budget', detail: 'Exceeded standard edge limit 30.' }],
  groundingMap: {
    display: {
      nodes: { 'N-1': 'actor-1' },
      edges: { 'E-1': 'edge-1' },
      claims: { 'CL-1': 'claim-1' },
      sources: { 'SR-1': 'source-1' },
      paths: {},
    },
    claims: [{
      id: 'CL-1',
      originalId: 'claim-1',
      text: 'The commitment is contested.',
      nodes: [{ id: 'N-1', originalId: 'actor-1', label: 'Ministry' }],
      edges: [{ id: 'E-1', originalId: 'edge-1', label: 'supports_claim' }],
      sources: [{ id: 'SR-1', originalId: 'source-1', title: 'UN report', url: 'https://example.test/source' }],
      contradicts: [],
    }],
  },
  riskFlags: [
    { id: 'source-1', kind: 'stale_source', severity: 'warning', label: 'Stale source', detail: 'UN report may need refresh.' },
    { id: 'edge-1', kind: 'inferred_edge', severity: 'notice', label: 'Inferred edge', detail: 'supports_claim is inferred.' },
  ],
};

describe('CapsuleAgentViewContent', () => {
  it('renders the exact packet text, salience counts, grounding map, omissions, and risk flags', () => {
    const html = renderToStaticMarkup(<CapsuleAgentViewContent data={packet} />);

    expect(html).toContain('What the agent sees');
    expect(html).toContain('PRAXIS Agent Context Graph Packet v1');
    expect(html).toContain('selected_counts: nodes=1; edges=1; claims=1; sources=1; omitted=1');
    expect(html).toContain('Nodes');
    expect(html).toContain('1');
    expect(html).toContain('edge-9');
    expect(html).toContain('budget');
    expect(html).toContain('CL-1');
    expect(html).toContain('The commitment is contested.');
    expect(html).toContain('N-1');
    expect(html).toContain('E-1');
    expect(html).toContain('SR-1');
    expect(html).toContain('Stale source');
    expect(html).toContain('Inferred edge');
    expect(html).not.toContain('react-force-graph');
  });

  it('renders a quiet empty state for empty-graph packets', () => {
    const html = renderToStaticMarkup(
      <CapsuleAgentViewContent
        data={{
          ...packet,
          selectedCounts: { nodes: 0, edges: 0, claims: 0, sources: 0, paths: 0, timeline: 0, causalLinks: 0 },
          omitted: [],
          groundingMap: { ...packet.groundingMap, claims: [] },
          riskFlags: [],
        }}
      />,
    );

    expect(html).toContain('No selected graph rows yet');
    expect(html).toContain('No risk flags');
  });
});
