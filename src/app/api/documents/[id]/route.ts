import { NextRequest, NextResponse } from 'next/server';

const DEMO_DOCUMENTS: Record<string, object> = {
  'doc-001': {
    id: 'doc-001',
    title: 'SG Report S/2026/100 - Situation in Nordalia',
    fileType: 'pdf',
    status: 'processed',
    uploadedAt: '2026-02-28T10:00:00Z',
    entityCount: 24,
    preview: 'I have the honour to submit the present report on the situation in Nordalia, pursuant to Security Council resolution 2890 (2025). The reporting period covers developments from 1 December 2025 to 28 February 2026...',
    entities: [
      { type: 'Actor', name: 'Government of Nordalia', count: 18 },
      { type: 'Actor', name: 'Democratic Reform Movement', count: 15 },
      { type: 'Event', name: 'Framework Agreement signing', count: 8 },
      { type: 'Commitment', name: 'Ceasefire Agreement', count: 6 },
      { type: 'Actor', name: 'UNMIN', count: 12 },
    ],
    usedInReports: [
      { id: 'report-001', title: 'Nordalia Situation Assessment Q1 2026' },
      { id: 'report-003', title: 'Security Council Briefing Notes - March 2026' },
    ],
  },
  'doc-002': {
    id: 'doc-002',
    title: 'Ceasefire Agreement - Government and DRM',
    fileType: 'docx',
    status: 'processed',
    uploadedAt: '2026-02-25T14:30:00Z',
    entityCount: 18,
    preview: 'The Government of the Republic of Nordalia and the Democratic Reform Movement, desiring to end hostilities and establish conditions for a durable peace...',
    entities: [
      { type: 'Commitment', name: 'Ceasefire terms', count: 12 },
      { type: 'Actor', name: 'Government of Nordalia', count: 8 },
      { type: 'Actor', name: 'Democratic Reform Movement', count: 8 },
      { type: 'Constraint', name: 'Buffer zone provisions', count: 4 },
    ],
    usedInReports: [
      { id: 'report-001', title: 'Nordalia Situation Assessment Q1 2026' },
    ],
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const document = DEMO_DOCUMENTS[id];

  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  return NextResponse.json(document);
}
