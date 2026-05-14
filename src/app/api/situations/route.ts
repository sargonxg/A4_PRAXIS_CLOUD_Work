import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import {
  createSituationAdmin,
  listSituations,
} from '@/lib/firebase/situations';
import { classifyDomainAndPath } from '@/lib/domain/classifier';
import { getAnalystProfile } from '@/lib/firebase/analyst-profile-admin';
import { isDomainId } from '@/types/domain';
import { isPathId, pathIdForDomain } from '@/lib/path/types';
import type { EscalationTrend } from '@/types/situation';
import { classifyCaseTypeSignals, isCaseTypeId } from '@/lib/ontology/case-types';
import { classifyOntologySignals } from '@/lib/ontology/classifier';
import { isOntologyId, type OntologyId } from '@/lib/ontology/types';
import { normalizeOntologySelection } from '@/lib/ontology/suggestions';
import { emitTelemetrySafe } from '@/lib/telemetry/emit';
import { SEMANTICA_CONTEXT_GRAPH_SCHEMA_VERSION } from '@/lib/semantica/context-core-adapter';
import type {
  SemanticaContextGraph,
  SemanticaContextNode,
  SemanticaContextEdge,
} from '@/lib/semantica/context-core-adapter';

const ESCALATION_TRENDS: EscalationTrend[] = ['stable', 'escalating', 'de-escalating', 'volatile'];
const MAX_CONTEXT_NOTES_CHARS = 12_000;
const MAX_SOURCE_URLS = 40;
const MAX_CUSTOM_SOURCES = 40;
const MAX_SEMANTICA_GRAPH_BYTES = 50_000;
const MAX_SEMANTICA_NODES = 80;
const MAX_SEMANTICA_EDGES = 160;

function isEscalationTrend(value: unknown): value is EscalationTrend {
  return typeof value === 'string' && ESCALATION_TRENDS.includes(value as EscalationTrend);
}

function cleanUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function cleanContextNotes(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, MAX_CONTEXT_NOTES_CHARS);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cleanSemanticaContextGraph(value: unknown): SemanticaContextGraph | undefined {
  if (!isRecord(value)) return undefined;
  const encoded = JSON.stringify(value);
  if (encoded.length > MAX_SEMANTICA_GRAPH_BYTES) return undefined;
  if (value.schemaVersion !== SEMANTICA_CONTEXT_GRAPH_SCHEMA_VERSION) return undefined;
  if (!Array.isArray(value.entities) || !Array.isArray(value.relationships)) return undefined;
  if (value.entities.length === 0 || value.entities.length > MAX_SEMANTICA_NODES) return undefined;
  if (value.relationships.length > MAX_SEMANTICA_EDGES) return undefined;

  const entities = value.entities
    .map(cleanSemanticaNode)
    .filter(Boolean) as SemanticaContextNode[];
  const entityIds = new Set(entities.map((node) => node.id));
  const relationships = value.relationships
    .map(cleanSemanticaEdge)
    .filter((edge): edge is SemanticaContextEdge => Boolean(edge && entityIds.has(edge.sourceId) && entityIds.has(edge.targetId)));

  if (entities.length === 0) return undefined;

  return {
    ...(value as unknown as SemanticaContextGraph),
    entities,
    relationships,
    quality: {
      nodeCount: entities.length,
      edgeCount: relationships.length,
      hasContextRoot: entities.some((node) => node.type === 'context_core'),
      hasDomainOntology: entities.some((node) => node.type === 'domain_ontology'),
      hasWorkOntology: entities.some((node) => node.type === 'work_ontology'),
      hasFrame: entities.some((node) => node.type === 'frame_statement'),
      semanticaReady: entities.some((node) => node.type === 'context_core'),
    },
  };
}

function cleanSemanticaNode(value: unknown): SemanticaContextNode | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || typeof value.type !== 'string' || typeof value.label !== 'string') return null;
  return {
    ...(value as unknown as SemanticaContextNode),
    id: value.id.trim().slice(0, 160),
    label: value.label.trim().slice(0, 240),
    text: typeof value.text === 'string' ? value.text.trim().slice(0, 2_000) : undefined,
    properties: cleanSemanticaProperties(value.properties),
    provenance: {
      source: 'server-sanitized',
      sourceField: isRecord(value.provenance) && typeof value.provenance.sourceField === 'string'
        ? value.provenance.sourceField.slice(0, 120)
        : 'unknown',
      confidence: isRecord(value.provenance) && typeof value.provenance.confidence === 'number'
        ? Math.max(0, Math.min(1, value.provenance.confidence))
        : 1,
      capturedAt: new Date().toISOString(),
    },
  };
}

function cleanSemanticaEdge(value: unknown): SemanticaContextEdge | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || typeof value.sourceId !== 'string' || typeof value.targetId !== 'string' || typeof value.type !== 'string') {
    return null;
  }
  return {
    ...(value as unknown as SemanticaContextEdge),
    id: value.id.trim().slice(0, 260),
    sourceId: value.sourceId.trim().slice(0, 160),
    targetId: value.targetId.trim().slice(0, 160),
    label: typeof value.label === 'string' ? value.label.trim().slice(0, 160) : value.type,
    properties: cleanSemanticaProperties(value.properties),
    provenance: {
      source: 'server-sanitized',
      sourceField: isRecord(value.provenance) && typeof value.provenance.sourceField === 'string'
        ? value.provenance.sourceField.slice(0, 120)
        : 'unknown',
      confidence: isRecord(value.provenance) && typeof value.provenance.confidence === 'number'
        ? Math.max(0, Math.min(1, value.provenance.confidence))
        : 1,
      capturedAt: new Date().toISOString(),
    },
  };
}

function cleanSemanticaProperties(value: unknown): Record<string, string | number | boolean | string[]> {
  if (!isRecord(value)) return {};
  const cleaned: Record<string, string | number | boolean | string[]> = {};
  for (const [key, raw] of Object.entries(value).slice(0, 40)) {
    const cleanKey = key.trim().slice(0, 80);
    if (!cleanKey) continue;
    if (typeof raw === 'string') cleaned[cleanKey] = raw.trim().slice(0, 500);
    else if (typeof raw === 'number' && Number.isFinite(raw)) cleaned[cleanKey] = raw;
    else if (typeof raw === 'boolean') cleaned[cleanKey] = raw;
    else if (Array.isArray(raw)) {
      cleaned[cleanKey] = raw
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim().slice(0, 160))
        .filter(Boolean)
        .slice(0, 40);
    }
  }
  return cleaned;
}

export const GET = withAuth(async (_req, user) => {
  if (user.isDemo) {
    return NextResponse.json({ situations: [] });
  }
  try {
    const situations = await listSituations(user.uid);
    return NextResponse.json({ situations });
  } catch (err) {
    console.error('[situations] List failed:', err);
    return NextResponse.json({ situations: [] });
  }
});

export const POST = withAuth(async (req, user) => {
  const startedAt = Date.now();
  if (user.isDemo) {
    return NextResponse.json(
      { error: 'Demo users cannot create situations' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const {
      name,
      type,
      description,
      region,
      actors,
      userRole,
      status,
      sourceUrls,
      contextNotes,
      initialDocumentIds,
      ontology,
      ontologyIds: clientOntologyIds,
      primaryOntologyId: clientPrimaryOntologyId,
      ontologyOverriddenByUser,
      caseType: clientCaseType,
      caseTypeSecondary: clientCaseTypeSecondary,
      caseTypeLocked,
      domain: clientDomain,
      domainOverriddenByUser,
      pathId: clientPathId,
      pathOverriddenByUser,
      riskScore,
      glaslStage,
      escalationTrend,
      sourceCategoriesEnabled,
      sourceCategoryOrder,
      workflowPath,
      workflowPathLabel,
      semanticaLayer,
      semanticaContextGraph,
      customSources,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const filteredUrls = Array.from(
      new Set((Array.isArray(sourceUrls) ? sourceUrls : []).map(cleanUrl).filter(Boolean) as string[]),
    ).slice(0, MAX_SOURCE_URLS);
    const cleanedContextNotes = cleanContextNotes(contextNotes);
    const cleanedSemanticaGraph = cleanSemanticaContextGraph(semanticaContextGraph);
    const cleanedCustomSources = (Array.isArray(customSources) ? customSources : [])
      .map((source: unknown) => {
        if (!source || typeof source !== 'object') return null;
        const raw = source as Record<string, unknown>;
        const url = cleanUrl(raw.url);
        if (!url) return null;
        return {
          id: typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim().slice(0, 80) : `custom-${url}`,
          url,
          name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim().slice(0, 120) : undefined,
          categoryId: typeof raw.categoryId === 'string' && raw.categoryId.trim() ? raw.categoryId.trim().slice(0, 80) : 'custom',
        };
      })
      .filter(Boolean)
      .slice(0, MAX_CUSTOM_SOURCES);

    // Resolve domain:
    //   1. If the wizard already ran a preview and the user confirmed a domain,
    //      trust the client pick (marked as `domainOverriddenByUser`).
    //   2. Otherwise, classify server-side using profile hint + description.
    //   3. On any failure, fall back to 'generic'.
    let domain = 'generic';
    let domainConfidence = 0;
    let overridden = false;
    let pathId: string | undefined;
    let pathConfidence = 0;
    let pathOverridden = false;

    if (typeof clientDomain === 'string' && isDomainId(clientDomain)) {
      domain = clientDomain;
      domainConfidence = 1;
      overridden = domainOverriddenByUser === true;
      if (typeof clientPathId === 'string' && isPathId(clientPathId)) {
        pathId = clientPathId;
        pathConfidence = 1;
        pathOverridden = pathOverriddenByUser === true;
      } else {
        pathId = pathIdForDomain(domain) ?? undefined;
        pathConfidence = pathId ? 0.75 : 0;
      }
    } else {
      let userPrimaryDomain: string | undefined;
      try {
        const profile = await getAnalystProfile(user.uid);
        userPrimaryDomain = profile?.perspective?.primaryDomain;
      } catch {
        /* ignore */
      }
      const classification = await classifyDomainAndPath({
        name,
        description: description ?? '',
        sourceUrls: filteredUrls,
        hints: userPrimaryDomain ? { userPrimaryDomain } : undefined,
      });
      domain = classification.domainId;
      domainConfidence = classification.confidence;
      pathId = classification.pathId ?? undefined;
      pathConfidence = classification.pathConfidence;
    }

    const requestedOntologyIds = Array.isArray(clientOntologyIds)
      ? clientOntologyIds.filter(isOntologyId)
      : [];
    const classifiedOntology = classifyOntologySignals({
      name,
      description: description ?? '',
      sourceUrls: filteredUrls,
      role: userRole,
    });
    const ontologyIds = normalizeOntologySelection(
      requestedOntologyIds.length > 0 ? requestedOntologyIds : classifiedOntology.ontologyIds,
    );
    const primaryOntologyId: OntologyId =
      isOntologyId(clientPrimaryOntologyId) && ontologyIds.includes(clientPrimaryOntologyId)
        ? clientPrimaryOntologyId
        : ontologyIds[0];
    const classifiedCaseType = classifyCaseTypeSignals({
      name,
      description: description ?? '',
      sourceUrls: filteredUrls,
      role: userRole,
    });
    const caseType = isCaseTypeId(clientCaseType) ? clientCaseType : classifiedCaseType.caseType;
    const caseTypeSecondary =
      isCaseTypeId(clientCaseTypeSecondary) && clientCaseTypeSecondary !== caseType
        ? clientCaseTypeSecondary
        : classifiedCaseType.caseTypeSecondary !== caseType
          ? classifiedCaseType.caseTypeSecondary
          : undefined;
    const caseTypeConfidence = isCaseTypeId(clientCaseType) ? 1 : classifiedCaseType.confidence;
    const resolvedCaseTypeLocked = caseTypeLocked === true || isCaseTypeId(clientCaseType);

    const situation = await createSituationAdmin(user.uid, {
      name: name.trim(),
      type: type || 'custom',
      description: description?.trim() || '',
      region: region?.trim() || '',
      actors: actors || [],
      userRole: userRole || 'analyst',
      status: status || 'active',
      ...(filteredUrls.length ? { sourceUrls: filteredUrls } : {}),
      ...(cleanedContextNotes ? { contextNotes: cleanedContextNotes } : {}),
      ...(initialDocumentIds?.length ? { initialDocumentIds } : {}),
      ...(ontology ? { ontology } : {}),
      ontologyId: primaryOntologyId,
      ontologyIds,
      primaryOntologyId,
      ontologyConfidence: requestedOntologyIds.length > 0 ? 1 : classifiedOntology.confidence,
      ontologyRationale: requestedOntologyIds.length > 0
        ? 'User confirmed ontology lenses during situation creation.'
        : classifiedOntology.rationale,
      ontologyOverriddenByUser: ontologyOverriddenByUser === true,
      caseType,
      ...(caseTypeSecondary ? { caseTypeSecondary } : {}),
      caseTypeConfidence,
      caseTypeLocked: resolvedCaseTypeLocked,
      ...(typeof riskScore === 'number' ? { riskScore } : {}),
      ...(typeof glaslStage === 'number' || glaslStage === null ? { glaslStage } : {}),
      ...(isEscalationTrend(escalationTrend) ? { escalationTrend } : {}),
      ...(sourceCategoriesEnabled && typeof sourceCategoriesEnabled === 'object'
        ? { sourceCategoriesEnabled: sourceCategoriesEnabled as Record<string, boolean> }
        : {}),
      ...(Array.isArray(sourceCategoryOrder) ? { sourceCategoryOrder } : {}),
      ...(typeof workflowPath === 'string' ? { workflowPath } : {}),
      ...(typeof workflowPathLabel === 'string' ? { workflowPathLabel } : {}),
      ...(cleanedSemanticaGraph ? { semanticaContextGraph: cleanedSemanticaGraph } : {}),
      ...(cleanedSemanticaGraph && isRecord(semanticaLayer)
        ? {
            semanticaLayer: {
              enabled: semanticaLayer.enabled === true,
              adapterVersion: typeof semanticaLayer.adapterVersion === 'string'
                ? semanticaLayer.adapterVersion.slice(0, 120)
                : 'unknown',
              serviceBoundary: typeof semanticaLayer.serviceBoundary === 'string'
                ? semanticaLayer.serviceBoundary.slice(0, 120)
                : 'future-python-or-rest-worker',
            },
          }
        : {}),
      ...(cleanedCustomSources.length ? { customSources: cleanedCustomSources as NonNullable<typeof customSources> } : {}),
      domain,
      domainConfidence,
      domainOverriddenByUser: overridden,
      ...(pathId ? { pathId, pathConfidence, pathOverriddenByUser: pathOverridden } : {}),
    });
    await emitTelemetrySafe({
      eventName: 'case.create',
      uid: user.uid,
      orgId: orgIdOf(user),
      caseId: situation.id,
      route: '/api/situations',
      status: 'ok',
      latencyMs: Date.now() - startedAt,
      details: {
        domain,
        pathId: pathId ?? null,
        primaryOntologyId,
        caseType,
        sourceUrlCount: filteredUrls.length,
        semanticaGraphNodes: cleanedSemanticaGraph?.quality.nodeCount ?? 0,
      },
    });

    // Fire-and-forget: auto-extract Episodes (chronology) so Timeline tab is
    // populated within ~60s of situation creation. Never block the response.
    // Spec §6: auto-extraction pipeline.
    try {
      const origin = new URL(req.url).origin;
      const cookie = req.headers.get('cookie') ?? '';
      const extractUrl = `${origin}/api/ai/extract-episodes`;
      void fetch(extractUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cookie ? { cookie } : {}),
        },
        body: JSON.stringify({ situationId: situation.id }),
      }).catch((err) => {
        console.warn('[situations] extract-episodes fire-and-forget failed:', err);
      });
    } catch (err) {
      console.warn('[situations] extract-episodes dispatch failed:', err);
    }

    return NextResponse.json({ situation });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await emitTelemetrySafe({
      eventName: 'case.create',
      uid: user.uid,
      orgId: orgIdOf(user),
      route: '/api/situations',
      status: 'fail',
      latencyMs: Date.now() - startedAt,
      details: { message: message.slice(0, 240) },
    });
    console.error('[situations] Create failed:', message, err);
    return NextResponse.json(
      { error: `Failed to create situation: ${message}` },
      { status: 500 }
    );
  }
});

function orgIdOf(user: unknown): string | null {
  return (user as { orgId?: string }).orgId ?? null;
}
