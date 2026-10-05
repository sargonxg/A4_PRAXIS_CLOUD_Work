import type { SignalAssessment, SignalClaim, SignalDesk, SignalNarrative, SignalSource } from './schema';

export type SignalEvidenceKind = 'source' | 'claim' | 'narrative' | 'assessment';
export type SignalEvidenceStatus = 'available' | 'withdrawn' | 'superseded' | 'proposed' | 'accepted' | 'rejected' | 'unresolved' | 'stale';
export type SignalReviewStates = Record<'accepted' | 'proposed' | 'rejected' | 'unresolved' | 'stale', number>;
export interface SignalEvidenceFilters { kinds?: readonly SignalEvidenceKind[]; statuses?: readonly SignalEvidenceStatus[]; languages?: readonly string[]; search?: string; currentOnly?: boolean }
export interface SignalEvidenceNode {
  /** Namespaced graph identity avoids cross-kind collisions; recordId is the canonical stored ID. */
  id: string; recordId: string; kind: SignalEvidenceKind; label: string; description: string; status: SignalEvidenceStatus;
  recordedStatus?: SignalClaim['status']; current: boolean; synthetic: boolean; languages: string[];
  sourceRevisionId?: string; sourceFamilyId?: string; claimId?: string; narrativeId?: string; assessmentId?: string;
  position: { x: number; y: number; z: number };
}
export interface SignalEvidenceEdge { id: string; source: string; target: string; predicate: 'reports_claim' | 'member_of_narrative' | 'depends_on'; claimId: string; sourceRevisionId?: string; status: SignalEvidenceStatus }
export interface SignalEvidenceNetwork { nodes: SignalEvidenceNode[]; edges: SignalEvidenceEdge[]; summary: { totalNodes: number; visibleNodes: number; visibleEdges: number; currentNodes: number; staleNodes: number; truncated: boolean; contextStale: boolean }; limitations: string[] }
export interface SignalMediaGroup {
  /** Actual normalized hostname, never an inferred publisher or ownership group. */
  id: string; key: string; label: string; hostname: string | null; sourceRevisionIds: string[]; activeSourceRevisionIds: string[];
  currentFamilyCount: number; historicalFamilyCount: number; historicalRevisionCount: number; activeRevisionCount: number;
  withdrawnRevisionCount: number; supersededRevisionCount: number; originalTextCount: number; headlineCount: number;
  languages: string[]; languageCounts: Array<{ language: string; activeRevisions: number; historicalRevisions: number }>;
  reviewStates: SignalReviewStates; unknownTimes: { publication: number; discovery: number; capture: number }; synthetic: boolean; activeSyntheticCount: number;
}
export interface SignalMediaLandscape { groups: SignalMediaGroup[]; totals: { groupCount: number; currentFamilyCount: number; historicalFamilyCount: number; historicalRevisionCount: number; activeRevisionCount: number; withdrawnRevisionCount: number; supersededRevisionCount: number; originalTextCount: number; headlineCount: number; reviewStates: SignalReviewStates; unknownTimes: SignalMediaGroup['unknownTimes']; synthetic: boolean; activeSyntheticCount: number; truncated: boolean }; limitations: string[] }
const LIMITS = { sources: 80, claims: 160, narratives: 30, assessments: 30 } as const;
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const unique = (values: string[]) => [...new Set(values)].sort(compare);
const nodeId = (kind: SignalEvidenceKind, id: string) => `${kind}:${id}`;
const counts = (): SignalReviewStates => ({ accepted: 0, proposed: 0, rejected: 0, unresolved: 0, stale: 0 });
const clocks = () => ({ publication: 0, discovery: 0, capture: 0 });
const unknownTime = (value: unknown) => typeof value !== 'string' || !Number.isFinite(Date.parse(value));
const limits = ['Only the retained, bounded desk panel is shown; this is not population coverage.', 'Edges mean source reports, narrative membership or analytical dependence. They do not establish event truth, influence, coordination or public opinion.'];
function bounded(desk: SignalDesk) { return { sources: desk.sources.slice(0, LIMITS.sources), claims: desk.claims.slice(0, LIMITS.claims), narratives: (desk.narratives ?? []).slice(0, LIMITS.narratives), assessments: (desk.assessments ?? []).slice(0, LIMITS.assessments), truncated: desk.sources.length > LIMITS.sources || desk.claims.length > LIMITS.claims || (desk.narratives?.length ?? 0) > LIMITS.narratives || (desk.assessments?.length ?? 0) > LIMITS.assessments }; }
/** Match canonical activation history without importing server-only domain crypto. */
function head(desk: SignalDesk, sourceId: string): { revisionId: string; epoch: number } | undefined {
  const saved = desk.sourceHeads?.[sourceId]; if (saved) return saved;
  let current: { revisionId: string; epoch: number } | undefined;
  for (const observation of desk.captures) { const revision = desk.sources.find(s => s.id === observation.revisionId && s.sourceId === sourceId); if (revision && revision.id !== current?.revisionId) current = { revisionId: revision.id, epoch: (current?.epoch ?? 0) + 1 }; }
  if (!current) { const revisions = desk.sources.filter(s => s.sourceId === sourceId); const last = revisions.at(-1); if (last) current = { revisionId: last.id, epoch: revisions.length }; }
  return current;
}
export function sourceStatus(desk: SignalDesk, source: SignalSource): SignalEvidenceStatus { return source.withdrawn ? 'withdrawn' : head(desk, source.sourceId)?.revisionId === source.id ? 'available' : 'superseded'; }
export function getSignalClaimStatus(desk: SignalDesk, claim: SignalClaim): SignalEvidenceStatus {
  const source = desk.sources.find(s => s.id === claim.sourceRevisionId); const activation = source && head(desk, source.sourceId);
  if (!source || sourceStatus(desk, source) !== 'available' || claim.stale || desk.contextStale || (claim.activationEpoch ?? 1) !== activation?.epoch || (claim.contextEpoch ?? 0) !== (desk.contextEpoch ?? 0) || claim.evidenceHash !== source.hash || source.kind !== 'original_text' || source.text.slice(claim.start, claim.end) !== claim.quote) return 'stale';
  if (claim.status === 'accepted') { const review = [...desk.reviews].reverse().find(r => r.targetId === claim.id); if (!review || review.decision !== 'accepted' || review.digest !== claim.digest || review.evidenceHash !== source.hash || review.contextDigest !== (claim.contextDigest ?? null) || !review.reviewerUid) return 'stale'; }
  return claim.status;
}
function interpretationStatus(desk: SignalDesk, record: SignalNarrative | SignalAssessment, statuses: Map<string, SignalEvidenceStatus>): SignalEvidenceStatus {
  if (record.stale || desk.contextStale || !record.claimIds.length || record.claimIds.some(id => statuses.get(id) !== 'accepted')) return 'stale';
  if ('sourcePackVersion' in record && (record.sourcePackVersion !== desk.sourcePack.version || JSON.stringify(record.contextReceipt) !== JSON.stringify(desk.contextReceipt ?? null))) return 'stale';
  if (record.status === 'accepted') { const review = [...desk.reviews].reverse().find(r => r.targetId === record.id); if (!review || review.decision !== 'accepted' || review.digest !== record.digest || !review.reviewerUid || record.claimIds.some(id => review.contextDigest !== (desk.claims.find(c => c.id === id)?.contextDigest ?? null))) return 'stale'; }
  return record.status;
}
function position(kind: SignalEvidenceKind, id: string, rank: number, count: number) {
  let seed = 2166136261; for (let i = 0; i < id.length; i++) seed = Math.imul(seed ^ id.charCodeAt(i), 16777619) >>> 0;
  const ring = { source: 170, claim: 105, narrative: 65, assessment: 35 }[kind]; const angle = 2 * Math.PI * rank / Math.max(count, 1) + (seed % 1000) / 1000;
  const rounded = (n: number) => Math.round(n * 1000) / 1000;
  return { x: rounded(Math.cos(angle) * ring), y: rounded(Math.sin(angle) * ring), z: rounded(({ source: -80, claim: 0, narrative: 80, assessment: 140 }[kind]) + (seed % 51) - 25) };
}
/** Pure deterministic projection. Layout coordinates have no geographic or analytical meaning. */
export function buildSignalEvidenceNetwork(desk: SignalDesk, filters: SignalEvidenceFilters = {}): SignalEvidenceNetwork {
  const data = bounded(desk); const statuses = new Map(data.claims.map(c => [c.id, getSignalClaimStatus(desk, c)])); const nodes: SignalEvidenceNode[] = []; const edges: SignalEvidenceEdge[] = [];
  const sourceById = new Map(data.sources.map(s => [s.id, s]));
  const languageForClaims = (ids: string[]) => unique(ids.flatMap(id => { const c = data.claims.find(c => c.id === id); const s = c && sourceById.get(c.sourceRevisionId); return s ? [s.language] : []; }));
  const syntheticForClaims = (ids: string[]) => ids.some(id => { const c = data.claims.find(c => c.id === id); return c ? sourceById.get(c.sourceRevisionId)?.synthetic === true : false; });
  for (const source of data.sources) { const status = sourceStatus(desk, source); nodes.push({ id: nodeId('source', source.id), recordId: source.id, kind: 'source', label: source.title, description: `${source.kind === 'headline' ? 'Discovery headline only' : 'Captured original text'} · ${source.language}`, status, current: status === 'available', synthetic: source.synthetic, languages: [source.language], sourceRevisionId: source.id, sourceFamilyId: source.sourceId, position: { x: 0, y: 0, z: 0 } }); }
  for (const claim of data.claims) { const status = statuses.get(claim.id)!; nodes.push({ id: nodeId('claim', claim.id), recordId: claim.id, kind: 'claim', label: claim.proposition, description: `${claim.speaker} · ${claim.modality} · ${claim.polarity}`, status, recordedStatus: claim.status, current: status !== 'stale', synthetic: sourceById.get(claim.sourceRevisionId)?.synthetic ?? false, languages: languageForClaims([claim.id]), sourceRevisionId: claim.sourceRevisionId, claimId: claim.id, position: { x: 0, y: 0, z: 0 } }); edges.push({ id: `reports_${claim.id}`, source: nodeId('source', claim.sourceRevisionId), target: nodeId('claim', claim.id), predicate: 'reports_claim', claimId: claim.id, sourceRevisionId: claim.sourceRevisionId, status }); }
  for (const [kind, records] of [['narrative', data.narratives], ['assessment', data.assessments]] as const) for (const record of records) {
    const status = interpretationStatus(desk, record, statuses); nodes.push({ id: nodeId(kind, record.id), recordId: record.id, kind, label: 'title' in record ? record.title : record.conclusion, description: kind === 'narrative' ? 'Analyst narrative framing; not an influence score' : 'Analyst assessment; not verified event truth', status, recordedStatus: record.status, current: status !== 'stale', synthetic: syntheticForClaims(record.claimIds), languages: languageForClaims(record.claimIds), ...(kind === 'narrative' ? { narrativeId: record.id } : { assessmentId: record.id }), position: { x: 0, y: 0, z: 0 } });
    for (const claimId of unique(record.claimIds)) { const claim = data.claims.find(c => c.id === claimId); edges.push({ id: `${kind === 'narrative' ? 'member' : 'depends'}_${record.id}_${claimId}`, source: nodeId('claim', claimId), target: nodeId(kind, record.id), predicate: kind === 'narrative' ? 'member_of_narrative' : 'depends_on', claimId, ...(claim ? { sourceRevisionId: claim.sourceRevisionId } : {}), status }); }
  }
  nodes.sort((a, b) => compare(a.id, b.id));
  for (const kind of ['source', 'claim', 'narrative', 'assessment'] as const) { const layer = nodes.filter(n => n.kind === kind); layer.forEach((n, i) => { n.position = position(kind, n.id, i, layer.length); }); }
  const search = filters.search?.trim().toLowerCase();
  const visible = nodes.filter(n => (!filters.kinds?.length || filters.kinds.includes(n.kind)) && (!filters.statuses?.length || filters.statuses.includes(n.status)) && (!filters.languages?.length || n.languages.some(l => filters.languages!.some(f => f.toLowerCase() === l.toLowerCase()))) && (!filters.currentOnly || n.current) && (!search || `${n.label} ${n.description} ${n.recordId}`.toLowerCase().includes(search)));
  const ids = new Set(visible.map(n => n.id)); const connected = edges.filter(e => ids.has(e.source) && ids.has(e.target)).sort((a, b) => compare(a.id, b.id));
  return { nodes: visible, edges: connected, summary: { totalNodes: nodes.length, visibleNodes: visible.length, visibleEdges: connected.length, currentNodes: visible.filter(n => n.current).length, staleNodes: visible.filter(n => n.status === 'stale').length, truncated: data.truncated, contextStale: desk.contextStale ?? false }, limitations: [...limits, '3D positions are a deterministic reading layout, not locations, rankings or distances of influence.'] };
}
function host(source?: SignalSource) { if (!source) return { key: 'Unresolved source', hostname: null }; if (!source.url) return { key: 'Supplied text', hostname: null }; try { const hostname = new URL(source.url).hostname.toLowerCase().replace(/\.$/, ''); return hostname ? { key: hostname, hostname } : { key: 'Unresolved URL', hostname: null }; } catch { return { key: 'Unresolved URL', hostname: null }; } }
/** Panel inventory grouped by exact hostnames. No outlet ownership, reach or independence inference. */
export function buildSignalMediaLandscape(desk: SignalDesk): SignalMediaLandscape {
  const data = bounded(desk); const groups = new Map<string, SignalMediaGroup>(); const currentFamilies = new Map<string, Set<string>>(); const historicalFamilies = new Map<string, Set<string>>();
  function group(source?: SignalSource) { const h = host(source); let g = groups.get(h.key); if (!g) { g = { id: h.key, key: h.key, label: h.key, hostname: h.hostname, sourceRevisionIds: [], activeSourceRevisionIds: [], currentFamilyCount: 0, historicalFamilyCount: 0, historicalRevisionCount: 0, activeRevisionCount: 0, withdrawnRevisionCount: 0, supersededRevisionCount: 0, originalTextCount: 0, headlineCount: 0, languages: [], languageCounts: [], reviewStates: counts(), unknownTimes: clocks(), synthetic: false, activeSyntheticCount: 0 }; groups.set(h.key, g); currentFamilies.set(h.key, new Set()); historicalFamilies.set(h.key, new Set()); } return g; }
  for (const source of data.sources) { const g = group(source); const status = sourceStatus(desk, source); const active = status === 'available'; g.sourceRevisionIds.push(source.id); g.historicalRevisionCount++; historicalFamilies.get(g.key)!.add(source.sourceId); g.synthetic ||= source.synthetic;
    let language = g.languageCounts.find(l => l.language === source.language); if (!language) { language = { language: source.language, historicalRevisions: 0, activeRevisions: 0 }; g.languageCounts.push(language); } language.historicalRevisions++;
    if (!active) { if (status === 'withdrawn') g.withdrawnRevisionCount++; else g.supersededRevisionCount++; continue; }
    g.activeSourceRevisionIds.push(source.id); g.activeRevisionCount++; currentFamilies.get(g.key)!.add(source.sourceId); language.activeRevisions++; g.activeSyntheticCount += Number(source.synthetic); if (source.kind === 'original_text') g.originalTextCount++; else g.headlineCount++;
    g.unknownTimes.publication += Number(unknownTime(source.publicationTime)); g.unknownTimes.discovery += Number(unknownTime(source.discoveredAt)); g.unknownTimes.capture += Number(unknownTime(source.capturedAt));
  }
  for (const claim of data.claims) { const source = data.sources.find(s => s.id === claim.sourceRevisionId); const status = getSignalClaimStatus(desk, claim); const g = group(source); g.reviewStates[status === 'accepted' || status === 'proposed' || status === 'rejected' || status === 'unresolved' ? status : 'stale']++; }
  const list = [...groups.values()].sort((a, b) => compare(a.key, b.key));
  for (const g of list) { g.currentFamilyCount = currentFamilies.get(g.key)!.size; g.historicalFamilyCount = historicalFamilies.get(g.key)!.size; g.sourceRevisionIds.sort(compare); g.activeSourceRevisionIds.sort(compare); g.languageCounts.sort((a, b) => compare(a.language, b.language)); g.languages = g.languageCounts.map(l => l.language); }
  const totals: SignalMediaLandscape['totals'] = { groupCount: list.length, currentFamilyCount: new Set(data.sources.filter(s => sourceStatus(desk, s) === 'available').map(s => s.sourceId)).size, historicalFamilyCount: new Set(data.sources.map(s => s.sourceId)).size, historicalRevisionCount: data.sources.length, activeRevisionCount: 0, withdrawnRevisionCount: 0, supersededRevisionCount: 0, originalTextCount: 0, headlineCount: 0, reviewStates: counts(), unknownTimes: clocks(), synthetic: list.some(g => g.synthetic), activeSyntheticCount: 0, truncated: data.truncated };
  for (const g of list) { for (const key of ['activeRevisionCount', 'withdrawnRevisionCount', 'supersededRevisionCount', 'originalTextCount', 'headlineCount', 'activeSyntheticCount'] as const) totals[key] += g[key]; for (const key of ['accepted', 'proposed', 'rejected', 'unresolved', 'stale'] as const) totals.reviewStates[key] += g.reviewStates[key]; for (const key of ['publication', 'discovery', 'capture'] as const) totals.unknownTimes[key] += g.unknownTimes[key]; }
  return { groups: list, totals, limitations: [limits[0], 'Hostnames are actual URL hosts, including distinct subdomains. They do not establish publisher identity, ownership, syndication or source independence.', 'Current families count active canonical source IDs; historical revisions include all retained versions. Clock and text/headline counts describe active revisions only.', 'Review states are current desk workflow states; historical accepted rows with invalid inputs are counted as stale. No audience size, sentiment, ideology, influence or reach is inferred.'] };
}
