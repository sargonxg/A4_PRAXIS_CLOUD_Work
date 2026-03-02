import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Return a mock report
  const report = {
    id,
    title: 'Nordalia Situation Assessment Q1 2026',
    template: 'conflict_assessment',
    status: 'draft',
    createdAt: '2026-02-28T09:00:00Z',
    updatedAt: '2026-03-01T14:30:00Z',
    metadata: {
      conflictId: 'nordalia-crisis',
      tone: 'formal_un',
    },
    sections: [
      {
        id: 's1',
        title: 'Executive Summary',
        content: '',
        status: 'empty',
        wordCount: 0,
        sources: [],
      },
      {
        id: 's2',
        title: 'Conflict Profile',
        content: '',
        status: 'empty',
        wordCount: 0,
        sources: [],
      },
      {
        id: 's3',
        title: 'Key Actors',
        content: '',
        status: 'empty',
        wordCount: 0,
        sources: [],
      },
      {
        id: 's4',
        title: 'Dynamics',
        content: '',
        status: 'empty',
        wordCount: 0,
        sources: [],
      },
      {
        id: 's5',
        title: 'Scenarios',
        content: '',
        status: 'empty',
        wordCount: 0,
        sources: [],
      },
      {
        id: 's6',
        title: 'Risk Assessment',
        content: '',
        status: 'empty',
        wordCount: 0,
        sources: [],
      },
    ],
  };

  return NextResponse.json(report);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  return NextResponse.json({
    success: true,
    id,
    updatedAt: new Date().toISOString(),
    ...body,
  });
}
