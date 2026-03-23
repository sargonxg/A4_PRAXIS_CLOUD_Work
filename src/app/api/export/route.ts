import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { generateSituationReportDOCX, generateBriefingDOCX, generateDossierDOCX, exportConflictGrammarJSON, exportTimelineCSV } from '@/lib/services/export-engine';
import type { Situation } from '@/types/situation';

export const POST = withAuth(async (req, user) => {
  if (user.isDemo) {
    return NextResponse.json({ error: 'Export requires a PRAXIS account' }, { status: 403 });
  }

  try {
    const { type, situation, content } = await req.json();
    const sit = situation as Situation;

    if (!sit?.name) {
      return NextResponse.json({ error: 'Situation data required' }, { status: 400 });
    }

    let buffer: Buffer;
    let filename: string;
    let contentType: string;

    switch (type) {
      case 'situation-report': {
        buffer = await generateSituationReportDOCX(sit, content);
        filename = `PRAXIS_SitRep_${sit.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      }
      case 'briefing': {
        buffer = await generateBriefingDOCX(sit, content);
        filename = `PRAXIS_Briefing_${sit.name.replace(/\s+/g, '_')}.docx`;
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      }
      case 'dossier': {
        buffer = await generateDossierDOCX(sit, content.actor, content.sections);
        filename = `PRAXIS_Dossier_${content.actor?.replace(/\s+/g, '_') || 'Actor'}.docx`;
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      }
      case 'conflict-grammar-json': {
        const json = exportConflictGrammarJSON(content.entities, sit);
        buffer = Buffer.from(json, 'utf-8');
        filename = `PRAXIS_ACO_${sit.name.replace(/\s+/g, '_')}.json`;
        contentType = 'application/json';
        break;
      }
      case 'timeline-csv': {
        const csv = exportTimelineCSV(content.events);
        buffer = Buffer.from(csv, 'utf-8');
        filename = `PRAXIS_Timeline_${sit.name.replace(/\s+/g, '_')}.csv`;
        contentType = 'text/csv';
        break;
      }
      default:
        return NextResponse.json({ error: `Unknown export type: ${type}` }, { status: 400 });
    }

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.length),
      },
    });
  } catch (err) {
    console.error('[export] Failed:', err);
    return NextResponse.json({ error: 'Export generation failed' }, { status: 500 });
  }
});
