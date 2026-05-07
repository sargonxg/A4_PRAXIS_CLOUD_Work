import type { CaseModule } from '@/types/case-module';

export type LibraryArtifactType = 'source' | 'document' | 'claim' | 'memo' | 'export';

export interface LibraryArtifact {
  id: string;
  type: LibraryArtifactType;
  title: string;
  summary: string;
  date: string;
  badge: string;
  href?: string;
  meta: Record<string, string>;
}

export function buildLibraryArtifacts(caseModule: CaseModule, caseId: string): LibraryArtifact[] {
  const situation = caseModule.situation;
  const artifacts: LibraryArtifact[] = [];

  for (const source of caseModule.sources) {
    artifacts.push({
      id: `source:${source.receiptId}`,
      type: 'source',
      title: source.title ?? source.name ?? source.source,
      summary: source.excerpt ?? source.provider ?? 'Source receipt attached to this case.',
      date: source.timestamp ?? situation.updatedAt,
      badge: source.kind,
      href: source.url,
      meta: {
        Provider: source.provider ?? source.source,
        Confidence: source.confidence ?? 'medium',
        Reliability: source.reliabilityScore !== undefined ? `${Math.round(source.reliabilityScore * 100)}%` : 'not scored',
      },
    });
  }

  for (const custom of situation.customSources ?? []) {
    if (artifacts.some((artifact) => artifact.href === custom.url)) continue;
    artifacts.push({
      id: `source:${custom.id}`,
      type: 'source',
      title: custom.name ?? custom.url,
      summary: 'User supplied source waiting for extraction and source-layer review.',
      date: situation.updatedAt,
      badge: custom.categoryId,
      href: custom.url,
      meta: {
        Category: custom.categoryId,
        Status: 'source scope',
      },
    });
  }

  const knownDocumentCount = situation.documentCount ?? 0;
  for (let index = 0; index < Math.max(knownDocumentCount, 1); index += 1) {
    artifacts.push({
      id: `document:${caseId}:${index}`,
      type: 'document',
      title: knownDocumentCount > 0 ? `${situation.name} document ${index + 1}` : 'Document intake slot',
      summary: knownDocumentCount > 0
        ? 'Document registered on the case. Extraction details appear when the document service returns records.'
        : 'No uploaded documents yet. Add PDFs or DOCX files from Context or Library ingestion.',
      date: situation.updatedAt,
      badge: knownDocumentCount > 0 ? 'document' : 'empty',
      meta: {
        Status: knownDocumentCount > 0 ? 'registered' : 'empty state',
        Collection: situation.workflowPathLabel ?? 'case library',
      },
    });
  }

  const claimTexts = deriveClaims(caseModule);
  for (const [index, claim] of claimTexts.entries()) {
    artifacts.push({
      id: `claim:${caseId}:${index}`,
      type: 'claim',
      title: claim.title,
      summary: claim.summary,
      date: caseModule.truthLayers.claim.lastUpdated || situation.updatedAt,
      badge: claim.grounded ? 'source-grounded' : 'inferred',
      meta: {
        Trust: claim.grounded ? 'medium-high' : 'review needed',
        Layer: 'Claim',
      },
    });
  }

  const memoTitle = caseModule.manifest.domain === 'mediation' ? 'Mediation summary memo' : 'Decision memo draft';
  artifacts.push({
    id: `memo:${caseId}:current`,
    type: 'memo',
    title: memoTitle,
    summary: 'Memo Studio draft artifact tied to the active graph snapshot and editable memo blocks.',
    date: situation.updatedAt,
    badge: 'versioned',
    meta: {
      Template: caseModule.manifest.domain === 'mediation' ? 'mediation-summary' : 'policy-brief',
      Versions: 'local/server when signed in',
    },
  });

  artifacts.push({
    id: `export:${caseId}:latest`,
    type: 'export',
    title: `${memoTitle} export manifest`,
    summary: 'Export history and re-downloads appear here when a signed-in user exports DOCX, PDF, or Markdown.',
    date: situation.updatedAt,
    badge: 'DOCX/PDF/MD',
    meta: {
      Format: 'pending export',
      Provenance: 'graph snapshot required',
    },
  });

  return artifacts.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

function deriveClaims(caseModule: CaseModule): Array<{ title: string; summary: string; grounded: boolean }> {
  const situation = caseModule.situation;
  const claims: Array<{ title: string; summary: string; grounded: boolean }> = [];
  if (situation.description) {
    claims.push({
      title: 'Case frame claim',
      summary: truncate(situation.description, 180),
      grounded: caseModule.sources.length > 0,
    });
  }
  if (situation.contextNotes) {
    claims.push({
      title: 'Operator context claim',
      summary: truncate(situation.contextNotes, 180),
      grounded: caseModule.sources.length > 1,
    });
  }
  if (caseModule.truthLayers.claim.nodeCount > claims.length) {
    claims.push({
      title: `${caseModule.truthLayers.claim.nodeCount} graph claim nodes`,
      summary: 'Claim nodes are available in the graph layer and should be reviewed before export.',
      grounded: caseModule.truthLayers.claim.provenanceCoverage >= 0.5,
    });
  }
  return claims.slice(0, 4);
}

function truncate(value: string, max: number): string {
  const cleaned = value.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trim()}...`;
}
