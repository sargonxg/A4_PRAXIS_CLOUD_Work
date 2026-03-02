import { NextRequest, NextResponse } from 'next/server';

const DEMO_REPORTS = [
  {
    id: 'report-001',
    title: 'Nordalia Situation Assessment Q1 2026',
    template: 'conflict_assessment',
    status: 'draft',
    createdAt: '2026-02-28T09:00:00Z',
    updatedAt: '2026-03-01T14:30:00Z',
    sections: [
      { id: 's1', title: 'Executive Summary', status: 'draft', wordCount: 245 },
      { id: 's2', title: 'Conflict Profile', status: 'draft', wordCount: 420 },
      { id: 's3', title: 'Key Actors', status: 'empty', wordCount: 0 },
      { id: 's4', title: 'Dynamics', status: 'empty', wordCount: 0 },
      { id: 's5', title: 'Scenarios', status: 'empty', wordCount: 0 },
      { id: 's6', title: 'Risk Assessment', status: 'empty', wordCount: 0 },
    ],
  },
  {
    id: 'report-002',
    title: 'Secretary-General Report on Nordalia',
    template: 'sg_report',
    status: 'review',
    createdAt: '2026-02-20T08:00:00Z',
    updatedAt: '2026-02-27T16:45:00Z',
    sections: [
      { id: 's1', title: 'Introduction', status: 'final', wordCount: 180 },
      { id: 's2', title: 'Political Developments', status: 'final', wordCount: 650 },
      { id: 's3', title: 'Security Situation', status: 'reviewed', wordCount: 540 },
      { id: 's4', title: 'Humanitarian Update', status: 'draft', wordCount: 320 },
      { id: 's5', title: 'Human Rights', status: 'empty', wordCount: 0 },
      { id: 's6', title: 'Observations and Recommendations', status: 'draft', wordCount: 410 },
    ],
  },
  {
    id: 'report-003',
    title: 'Security Council Briefing Notes - March 2026',
    template: 'briefing_note',
    status: 'draft',
    createdAt: '2026-02-26T11:00:00Z',
    updatedAt: '2026-02-28T09:15:00Z',
    sections: [
      { id: 's1', title: 'Key Messages', status: 'draft', wordCount: 210 },
      { id: 's2', title: 'Situation Update', status: 'draft', wordCount: 380 },
      { id: 's3', title: 'Talking Points', status: 'empty', wordCount: 0 },
    ],
  },
  {
    id: 'report-004',
    title: 'Options Paper: Nordalia Electoral Framework',
    template: 'options_paper',
    status: 'final',
    createdAt: '2026-02-10T07:00:00Z',
    updatedAt: '2026-02-18T17:00:00Z',
    sections: [
      { id: 's1', title: 'Issue', status: 'final', wordCount: 150 },
      { id: 's2', title: 'Background', status: 'final', wordCount: 520 },
      { id: 's3', title: 'Options Analysis', status: 'final', wordCount: 890 },
      { id: 's4', title: 'Recommendation', status: 'final', wordCount: 280 },
    ],
  },
  {
    id: 'report-005',
    title: 'Political Analysis Cable - Eastland Involvement',
    template: 'cable',
    status: 'final',
    createdAt: '2026-02-05T13:00:00Z',
    updatedAt: '2026-02-06T10:30:00Z',
    sections: [
      { id: 's1', title: 'Summary', status: 'final', wordCount: 120 },
      { id: 's2', title: 'Analysis', status: 'final', wordCount: 680 },
      { id: 's3', title: 'Assessment', status: 'final', wordCount: 340 },
      { id: 's4', title: 'Recommendations', status: 'final', wordCount: 200 },
    ],
  },
  {
    id: 'report-006',
    title: 'Nordalia Civil Society Consultation Summary',
    template: 'sg_report',
    status: 'archived',
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-01-28T15:00:00Z',
    sections: [
      { id: 's1', title: 'Introduction', status: 'final', wordCount: 160 },
      { id: 's2', title: 'Consultation Findings', status: 'final', wordCount: 720 },
      { id: 's3', title: 'Recommendations', status: 'final', wordCount: 310 },
    ],
  },
];

export async function GET() {
  return NextResponse.json({ reports: DEMO_REPORTS });
}

export async function POST(request: NextRequest) {
  try {
    const { title, template } = await request.json();

    const newReport = {
      id: `report-${Date.now()}`,
      title: title || 'Untitled Report',
      template: template || 'custom',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sections: [],
    };

    return NextResponse.json({ report: newReport }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}
