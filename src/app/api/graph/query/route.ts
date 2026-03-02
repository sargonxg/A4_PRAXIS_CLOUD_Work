import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    // Demo graph query results
    const results = {
      query,
      nodes: [
        { id: 'gov', label: 'Government of Nordalia', type: 'Actor', color: '#E8B931', size: 30 },
        { id: 'drm', label: 'Democratic Reform Movement', type: 'Actor', color: '#E8B931', size: 28 },
        { id: 'unmin', label: 'UNMIN', type: 'Actor', color: '#E8B931', size: 22 },
        { id: 'eastland', label: 'Republic of Eastland', type: 'Actor', color: '#E8B931', size: 18 },
        { id: 'westmark', label: 'Federal Republic of Westmark', type: 'Actor', color: '#E8B931', size: 18 },
        { id: 'ceasefire', label: 'September Ceasefire', type: 'Commitment', color: '#D4A373', size: 16 },
        { id: 'framework', label: 'Framework Agreement', type: 'Commitment', color: '#D4A373', size: 20 },
        { id: 'elections', label: 'June 2025 Elections', type: 'Event', color: '#A63D40', size: 14 },
        { id: 'crackdown', label: 'July Crackdown', type: 'Event', color: '#A63D40', size: 14 },
      ],
      edges: [
        { source: 'gov', target: 'drm', type: 'adversary', label: 'Adversary' },
        { source: 'gov', target: 'eastland', type: 'ally', label: 'Allied' },
        { source: 'drm', target: 'westmark', type: 'ally', label: 'Allied' },
        { source: 'unmin', target: 'gov', type: 'mediator', label: 'Mediates' },
        { source: 'unmin', target: 'drm', type: 'mediator', label: 'Mediates' },
        { source: 'gov', target: 'ceasefire', type: 'party', label: 'Party to' },
        { source: 'drm', target: 'ceasefire', type: 'party', label: 'Party to' },
        { source: 'gov', target: 'framework', type: 'party', label: 'Party to' },
        { source: 'drm', target: 'framework', type: 'party', label: 'Party to' },
        { source: 'elections', target: 'gov', type: 'involves', label: 'Involves' },
        { source: 'crackdown', target: 'gov', type: 'involves', label: 'Involves' },
      ],
      totalNodes: 9,
      totalEdges: 11,
    };

    return NextResponse.json(results);
  } catch {
    return NextResponse.json({ error: 'Graph query failed' }, { status: 500 });
  }
}
