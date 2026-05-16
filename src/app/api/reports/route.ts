import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ reports: [] });
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
