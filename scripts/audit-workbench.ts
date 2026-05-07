import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { WORKBENCH_TABS } from '../src/lib/workbench/tabs';
import { WORKBENCH_CHAPTER_FLOW } from '../src/lib/workbench/chapter-flow';
import { getCaseModule } from '../src/lib/cases/registry';

const root = process.cwd();
const requiredFiles = [
  'src/app/app/workbench/page.tsx',
  'src/app/app/workbench/[caseId]/page.tsx',
  'src/app/app/workbench/[caseId]/ach/page.tsx',
  'src/app/app/workbench/[caseId]/ach/[achId]/page.tsx',
  'src/components/workbench/workbench-tabs.tsx',
  'src/components/workbench/workbench-tab-content.tsx',
  'src/components/workbench/chapter-shell.tsx',
  'src/components/workbench/chapter-renderer.tsx',
  'src/tabs/registry.ts',
  'src/chapters/registry.ts',
  'src/hooks/useOrchestratorEvents.ts',
  'backend/routers/tabs.py',
  'backend/routers/chapters.py',
  'backend/routers/workspace.py',
  'backend/services/workspace_orchestrator/log.py',
  'backend/services/cognee_aco_models.py',
  'backend/mcp/praxis_server.py',
  'backend/migrations/versions/0016_workspace_chapter_products.py',
  'docs/architecture/PRAXIS_ONE_PAGE.md',
  'docs/implementation/WORKSPACE_TABS_CHAPTERS_FOUNDATION.md',
  'src/components/workbench/StructuredChapterContent.tsx',
  'src/components/workbench/DeskTab.tsx',
  'src/components/workbench/desk/WhatChangedPanel.tsx',
  'src/components/workbench/desk/NextBestActionsPanel.tsx',
  'src/components/workbench/desk/StaleContextPanel.tsx',
  'src/components/workbench/desk/OpenQuestionsPanel.tsx',
  'src/components/workbench/ContextTab.tsx',
  'src/components/workbench/context/FrameEditor.tsx',
  'src/components/workbench/context/ScopeAdvisory.tsx',
  'src/components/workbench/context/SourcePreferences.tsx',
  'src/components/workbench/context/DocumentUploadInline.tsx',
  'src/components/workbench/context/ActorClaimInterestRefiner.tsx',
  'src/components/workbench/LibraryTab.tsx',
  'src/components/workbench/ResearchTab.tsx',
  'src/components/workbench/draft/DraftTab.tsx',
  'src/components/workbench/draft/MemosSelection.tsx',
  'src/components/workbench/draft/CoverPageEditor.tsx',
  'src/components/workbench/draft/AppendixPicker.tsx',
  'src/components/workbench/draft/RedactionSettings.tsx',
  'src/components/workbench/draft/ExportControls.tsx',
  'src/app/api/cases/[caseId]/draft/export/route.ts',
  'src/lib/workbench/draft-export-store.ts',
  'src/types/draft-export.ts',
  'src/components/workbench/empty-state/EmptyStateGuidance.tsx',
  'src/components/workbench/workbench-surface-elements.tsx',
  'src/lib/workbench/library-state.ts',
  'src/lib/workbench/research-state.ts',
  'src/lib/workbench/saved-claims-store.ts',
  'src/lib/workbench/research-ingest-store.ts',
  'src/lib/workbench/surface-state.ts',
  'src/lib/workbench/chapter-content-layer.ts',
  'src/lib/workbench/open-questions-store.ts',
  'src/lib/workbench/draft-assembly-state.ts',
  'src/lib/workbench/case-density.ts',
  'src/lib/workbench/empty-state-actions.ts',
  'src/lib/ontology/validator-pass-rate.ts',
  'src/lib/onboarding/case-scaffold.ts',
  'src/lib/onboarding/case-scaffold-audit-store.ts',
  'src/types/open-questions.ts',
  'src/types/saved-claims.ts',
  'src/app/api/cases/[caseId]/context-scope/route.ts',
  'src/app/api/cases/[caseId]/open-questions/route.ts',
  'src/app/api/cases/[caseId]/open-questions/[questionId]/route.ts',
  'src/app/api/cases/[caseId]/research/route.ts',
  'src/app/api/cases/[caseId]/research/plan/route.ts',
  'src/app/api/cases/[caseId]/research/ingest/route.ts',
  'src/app/api/cases/[caseId]/saved-claims/route.ts',
  'src/app/api/cases/[caseId]/ontologies/route.ts',
  'src/app/api/cases/scaffold/route.ts',
  'src/app/api/cases/scaffold/audit/route.ts',
  'src/components/onboarding/ai-first-case-creation/AiFirstCaseCreation.tsx',
  'src/components/sats/ACHWorkbench.tsx',
  'src/components/sats/ACHMatrix.tsx',
  'src/app/api/sats/ach/route.ts',
  'src/app/api/sats/ach/[achId]/route.ts',
  'src/lib/sats/ach-store.ts',
  'src/app/app/workbench/[caseId]/boardroom/page.tsx',
  'src/app/app/workbench/[caseId]/boardroom/new/page.tsx',
  'src/app/app/workbench/[caseId]/boardroom/[deliberationId]/page.tsx',
  'src/app/app/workbench/[caseId]/boardroom/[deliberationId]/synthesis/page.tsx',
  'src/app/app/settings/personas/page.tsx',
  'src/app/app/settings/personas/new/page.tsx',
  'src/app/app/settings/personas/[personaId]/page.tsx',
  'docs/architecture/WORKBENCH_SURFACES.md',
  'docs/adr/0040-chapters-layered-content-rendering.md',
  'docs/adr/0041-desk-command-center-contract.md',
  'docs/adr/0042-library-tab-as-artifact-faceted-view.md',
  'docs/adr/0043-research-as-ingestion-front-door.md',
  'docs/adr/0044-draft-as-briefing-assembly-contract.md',
  'docs/adr/0045-ai-first-case-creation-pattern.md',
  'docs/audits/2026-05-07-PACK26_27_28_SURFACES_TRIPLE_CHECK.md',
  'tests/e2e/workbench/chapters-structured-content.spec.ts',
  'tests/e2e/workbench/desk-command-center.spec.ts',
  'tests/e2e/workbench/context-scope-studio.spec.ts',
  'tests/e2e/workbench/library-faceted-browse.spec.ts',
  'tests/e2e/workbench/research-source-scout.spec.ts',
  'tests/e2e/workbench/ontology-interactive.spec.ts',
  'tests/e2e/workbench/draft-briefing-assembly.spec.ts',
  'tests/e2e/onboarding/ai-first-case-creation.spec.ts',
  'tests/e2e/onboarding/new-user-end-to-end.spec.ts',
  'src/app/api/boardroom/deliberations/route.ts',
  'src/app/api/boardroom/deliberations/[deliberationId]/route.ts',
  'src/app/api/boardroom/deliberations/[deliberationId]/start/route.ts',
  'src/app/api/boardroom/deliberations/[deliberationId]/abort/route.ts',
  'src/app/api/boardroom/deliberations/[deliberationId]/stream/route.ts',
  'src/app/api/boardroom/deliberations/[deliberationId]/export/route.ts',
  'src/app/api/boardroom/deliberations/[deliberationId]/synthesis/promote/route.ts',
  'src/app/api/boardroom/personas/route.ts',
  'src/app/api/boardroom/personas/[personaId]/route.ts',
  'src/components/boardroom/BoardroomWorkspace.tsx',
  'src/lib/boardroom/personas.ts',
  'src/lib/cases/registry.ts',
  'src/lib/cases/user-cases/loader.ts',
];

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) {
    throw new Error(`Missing workbench contract file: ${file}`);
  }
}

const expectedTabs = ['context', 'library', 'ontology', 'graph'];
const actualTabs = WORKBENCH_TABS.map((tab) => tab.id);
if (actualTabs.join(',') !== expectedTabs.join(',')) {
  throw new Error(`Workbench tabs mismatch: ${actualTabs.join(',')}`);
}

const expectedChapters = ['desk', 'research', 'memos', 'draft', 'ach', 'tools', 'boardroom'];
const actualChapters = WORKBENCH_CHAPTER_FLOW.map((chapter) => chapter.id);
if (actualChapters.join(',') !== expectedChapters.join(',')) {
  throw new Error(`Workbench chapters mismatch: ${actualChapters.join(',')}`);
}

for (const id of ['syria-2026', 'nordalia-2026']) {
  if (!getCaseModule(id)) throw new Error(`Example case did not resolve: ${id}`);
}

for (const path of ['src/components/workbench/chapter-shell.tsx', 'src/components/workbench/chapter-renderer.tsx']) {
  const text = existsSync(path) ? readFileSync(path, 'utf8') : '';
  if (/syria|nordalia/i.test(text)) {
    throw new Error(`Generic workbench component contains case-specific copy/imports: ${path}`);
  }
}

const tabContent = readFileSync('src/components/workbench/workbench-tab-content.tsx', 'utf8');
for (const marker of ['<ContextTab />', '<LibraryTab />', '<OntologySchemaViewer />', '<WorkbenchGraphPanel />', '<EmptyStateGuidance']) {
  if (!tabContent.includes(marker)) {
    throw new Error(`Workbench tab content missing surface dispatch: ${marker}`);
  }
}

const chapterRenderer = readFileSync('src/components/workbench/chapter-renderer.tsx', 'utf8');
for (const marker of ['<DeskTab />', '<ResearchTab />', '<MemoStudio />', '<DraftTab />', '<ACHIndex', '<ToolMarketplace />', '<BoardroomIndex']) {
  if (!chapterRenderer.includes(marker)) {
    throw new Error(`Chapter renderer missing seven-chapter component: ${marker}`);
  }
}
if (/GenericChapterContent|The default case flow/i.test(chapterRenderer)) {
  throw new Error('Chapter renderer still contains generic placeholder fallback copy.');
}

const foundationDoc = readFileSync('docs/implementation/WORKSPACE_TABS_CHAPTERS_FOUNDATION.md', 'utf8');
for (const marker of ['Context', 'Library', 'Ontology', 'Graph', 'Desk, always on', 'Research', 'Boardroom', 'four-field situation frame', '12 DIALECTICA recipes']) {
  if (!foundationDoc.includes(marker)) {
    throw new Error(`Workspace foundation doc missing marker: ${marker}`);
  }
}

const praxisOnePage = readFileSync('docs/architecture/PRAXIS_ONE_PAGE.md', 'utf8');
for (const marker of ['PRAXIS in One Page', 'User context', 'Situation context', 'Source receipts', 'ACO candidates', 'Current Honest Status']) {
  if (!praxisOnePage.includes(marker)) {
    throw new Error(`PRAXIS one-page reference missing marker: ${marker}`);
  }
}

const frameEditor = readFileSync('src/components/workbench/context/FrameEditor.tsx', 'utf8');
for (const marker of ['What is happening?', 'Why does it matter?', 'What would change the assessment?', 'Policy question']) {
  if (!frameEditor.includes(marker)) {
    throw new Error(`Tabs guide four-field frame editor missing marker: ${marker}`);
  }
}

const tabsRouter = readFileSync('backend/routers/tabs.py', 'utf8');
for (const marker of ['@router.post("/library/ingest")', '@router.get("/library")', '@router.get("/library/{source_id}")', '@router.post("/library/{source_id}/re-extract")', '@router.delete("/library/{source_id}")', 'cognee_memory.add', 'cognee_memory.cognify', 'cognee_pending_writes', 'dataPoint": "Situation"']) {
  if (!tabsRouter.includes(marker)) {
    throw new Error(`Tabs backend router missing guide marker: ${marker}`);
  }
}

const chaptersRouter = readFileSync('backend/routers/chapters.py', 'utf8');
for (const marker of [
  'DIALECTICA_RECIPES',
  'stakeholder-map',
  'contradiction-scan',
  'constraint-leverage-map',
  'commitment-tracker',
  'narrative-arc',
  'ambiguity-audit',
  'red-team-counterclaim',
  'counterfactual-branch',
  'evidence-gap-finder',
  'policy-option-generator',
  'risk-weighting',
  'decision-memo-synth',
  '@router.post("/research/threads")',
  '@router.post("/memos")',
  '@router.post("/drafts")',
  '@router.post("/ach/suggest-evidence")',
  '@router.post("/tools/run")',
  '@router.post("/boardroom/briefings")',
]) {
  if (!chaptersRouter.includes(marker)) {
    throw new Error(`Chapters backend router missing guide marker: ${marker}`);
  }
}

const mcpServer = readFileSync('backend/mcp/praxis_server.py', 'utf8');
for (const marker of ['list_research_threads', 'list_memos', 'list_drafts']) {
  if (!mcpServer.includes(marker)) {
    throw new Error(`MCP workspace read surface missing marker: ${marker}`);
  }
}

const chapterLayers = readFileSync('src/lib/workbench/chapter-content-layer.ts', 'utf8');
for (const marker of ['SuggestedChapterItem', 'ChapterContentLayer', 'CHAPTER_LAYERS', 'renderLayeredChapterContent']) {
  if (!chapterLayers.includes(marker)) {
    throw new Error(`Pack 26 chapter-content-layer missing marker: ${marker}`);
  }
}

const surfaceState = readFileSync('src/lib/workbench/surface-state.ts', 'utf8');
for (const marker of ['buildWorkbenchSurfaceState', 'openQuestions', 'nextActions', 'chapterFacts']) {
  if (!surfaceState.includes(marker)) {
    throw new Error(`Pack 26 surface state helper missing marker: ${marker}`);
  }
}

const deskTab = readFileSync('src/components/workbench/DeskTab.tsx', 'utf8');
for (const marker of ['WhatChangedPanel', 'NextBestActionsPanel', 'StaleContextPanel', 'OpenQuestionsPanel']) {
  if (!deskTab.includes(marker)) {
    throw new Error(`Pack 26 Desk command center missing panel: ${marker}`);
  }
}

const contextTab = readFileSync('src/components/workbench/ContextTab.tsx', 'utf8');
for (const marker of ['FrameEditor', 'ScopeAdvisory', 'SourcePreferences', 'DocumentUploadInline', 'ActorClaimInterestRefiner', 'tabs/context/situation-frame']) {
  if (!contextTab.includes(marker)) {
    throw new Error(`Pack 26 Context Studio missing section/API marker: ${marker}`);
  }
}

const documentUploadInline = readFileSync('src/components/workbench/context/DocumentUploadInline.tsx', 'utf8');
for (const marker of ['tabs/library/ingest', 'FormData', 'Memory layer queued']) {
  if (!documentUploadInline.includes(marker)) {
    throw new Error(`Tabs guide document upload handoff missing marker: ${marker}`);
  }
}

const libraryTabComponent = readFileSync('src/components/workbench/LibraryTab.tsx', 'utf8');
for (const marker of ['tabs/library?case_id', 'tabs/library/ingest', 're-extract', 'Remove receipt', 'sourceReceiptToArtifact']) {
  if (!libraryTabComponent.includes(marker)) {
    throw new Error(`Tabs guide Library frontend missing backend marker: ${marker}`);
  }
}

const researchTabComponent = readFileSync('src/components/workbench/ResearchTab.tsx', 'utf8');
for (const marker of ['chapters/research/threads', 'Recall graph', 'Close to memory', 'Research threads']) {
  if (!researchTabComponent.includes(marker)) {
    throw new Error(`Chapters guide Research frontend missing backend marker: ${marker}`);
  }
}

const memoStudioComponent = readFileSync('src/components/memo/MemoStudio.tsx', 'utf8');
for (const marker of ['chapters/memos', 'chapters/memos/${encodeURIComponent(memoId)}/assist', 'Suggest content', 'memo-studio']) {
  if (!memoStudioComponent.includes(marker)) {
    throw new Error(`Chapters guide Memo Studio missing backend marker: ${marker}`);
  }
}

const draftTabComponent = readFileSync('src/components/workbench/draft/DraftTab.tsx', 'utf8');
for (const marker of ['chapters/drafts', 'Find citations', 'Save draft', 'chapters/drafts/${encodeURIComponent(draftId)}/cite']) {
  if (!draftTabComponent.includes(marker)) {
    throw new Error(`Chapters guide Draft frontend missing backend marker: ${marker}`);
  }
}

const achWorkbenchComponent = readFileSync('src/components/sats/ACHWorkbench.tsx', 'utf8');
for (const marker of ['chapters/ach/suggest-hypotheses', 'chapters/ach/suggest-evidence', 'Suggest hypotheses', 'Suggest evidence']) {
  if (!achWorkbenchComponent.includes(marker)) {
    throw new Error(`Chapters guide ACH frontend missing backend marker: ${marker}`);
  }
}

const toolMarketplaceComponent = readFileSync('src/components/tools/ToolMarketplace.tsx', 'utf8');
for (const marker of ['chapters/tools/recipes', 'chapters/tools/run', 'DIALECTICA recipes', 'runDialecticaRecipe']) {
  if (!toolMarketplaceComponent.includes(marker)) {
    throw new Error(`Chapters guide Tools frontend missing backend marker: ${marker}`);
  }
}

const boardroomWorkspaceComponent = readFileSync('src/components/boardroom/BoardroomWorkspace.tsx', 'utf8');
for (const marker of ['chapters/boardroom?case_id', 'chapters/boardroom/briefings', 'Chapter briefings', 'exportChapterBriefing']) {
  if (!boardroomWorkspaceComponent.includes(marker)) {
    throw new Error(`Chapters guide Boardroom frontend missing backend marker: ${marker}`);
  }
}

const openQuestionsRoute = readFileSync('src/app/api/cases/[caseId]/open-questions/route.ts', 'utf8');
for (const marker of ['withAuth', 'listOpenQuestions', 'createOpenQuestion']) {
  if (!openQuestionsRoute.includes(marker)) {
    throw new Error(`Pack 26 open-questions API missing marker: ${marker}`);
  }
}

const libraryState = readFileSync('src/lib/workbench/library-state.ts', 'utf8');
for (const marker of ['source', 'document', 'claim', 'memo', 'export', 'buildLibraryArtifacts', 'SavedClaim']) {
  if (!libraryState.includes(marker)) {
    throw new Error(`Pack 27 library state helper missing marker: ${marker}`);
  }
}

const researchState = readFileSync('src/lib/workbench/research-state.ts', 'utf8');
for (const marker of ['RESEARCH_SOURCE_SETS', 'buildResearchPlan', 'buildResearchCandidates']) {
  if (!researchState.includes(marker)) {
    throw new Error(`Pack 27 research state helper missing marker: ${marker}`);
  }
}

const savedClaimsRoute = readFileSync('src/app/api/cases/[caseId]/saved-claims/route.ts', 'utf8');
for (const marker of ['withAuth', 'listSavedClaims', 'createSavedClaim']) {
  if (!savedClaimsRoute.includes(marker)) {
    throw new Error(`Pack 27 saved-claims API missing marker: ${marker}`);
  }
}

const researchPlanRoute = readFileSync('src/app/api/cases/[caseId]/research/plan/route.ts', 'utf8');
for (const marker of ['withAuth', 'research_planner', 'buildResearchPlan']) {
  if (!researchPlanRoute.includes(marker)) {
    throw new Error(`Pack 27 research plan API missing marker: ${marker}`);
  }
}

const researchIngestRoute = readFileSync('src/app/api/cases/[caseId]/research/ingest/route.ts', 'utf8');
for (const marker of ['withAuth', 'stageResearchIngest', 're_genesis']) {
  if (!researchIngestRoute.includes(marker)) {
    throw new Error(`Pack 27 research ingest API missing marker: ${marker}`);
  }
}

const ontologiesRoute = readFileSync('src/app/api/cases/[caseId]/ontologies/route.ts', 'utf8');
for (const marker of ['withAuth', 'ontologyIds', 'ontology-selection-update', 'advisory-pass']) {
  if (!ontologiesRoute.includes(marker)) {
    throw new Error(`Pack 27 ontology mutation API missing marker: ${marker}`);
  }
}

const draftState = readFileSync('src/lib/workbench/draft-assembly-state.ts', 'utf8');
for (const marker of ['buildDraftMemoOptions', 'buildDraftAppendices', 'renderDraftMarkdown', 'DraftExportSettings']) {
  if (!draftState.includes(marker)) {
    throw new Error(`Pack 28 draft assembly helper missing marker: ${marker}`);
  }
}

const draftTab = readFileSync('src/components/workbench/draft/DraftTab.tsx', 'utf8');
for (const marker of ['Briefing Assembly', 'MemosSelection', 'CoverPageEditor', 'AppendixPicker', 'RedactionSettings', 'ExportControls', '/draft/export', 'Export manifest persisted']) {
  if (!draftTab.includes(marker)) {
    throw new Error(`Pack 28 DraftTab missing section marker: ${marker}`);
  }
}

const draftExportRoute = readFileSync('src/app/api/cases/[caseId]/draft/export/route.ts', 'utf8');
for (const marker of ['withAuth', 'DraftExportSchema', 'persistDraftExport', 'c2pa-ready-manifest']) {
  if (!draftExportRoute.includes(marker)) {
    throw new Error(`Pack 28 draft export route missing marker: ${marker}`);
  }
}

const draftExportStore = readFileSync('src/lib/workbench/draft-export-store.ts', 'utf8');
for (const marker of ['persistDraftExport', 'artifactKind', 'draft-briefing-package', 'contentCredentials', 'auditManifest']) {
  if (!draftExportStore.includes(marker)) {
    throw new Error(`Pack 28 draft export store missing marker: ${marker}`);
  }
}

const caseScaffold = readFileSync('src/lib/onboarding/case-scaffold.ts', 'utf8');
for (const marker of ['CaseScaffoldProposal', 'buildCaseScaffoldProposal', 'initialActors', 'initialClaims', 'suggestedSourceIds']) {
  if (!caseScaffold.includes(marker)) {
    throw new Error(`Pack 28 case scaffold helper missing marker: ${marker}`);
  }
}

const newSituation = readFileSync('src/app/app/situations/new/page.tsx', 'utf8');
for (const marker of ['AiFirstCaseCreation', 'Create with AI assistance', 'handleApplyScaffold', 'CreationModeChooser', '/api/cases/scaffold/audit']) {
  if (!newSituation.includes(marker)) {
    throw new Error(`Pack 28 new-user case creation missing marker: ${marker}`);
  }
}

const scaffoldAuditRoute = readFileSync('src/app/api/cases/scaffold/audit/route.ts', 'utf8');
for (const marker of ['withAuth', 'persistCaseScaffoldAudit', 'CaseScaffoldProposal', 'demo-not-persisted']) {
  if (!scaffoldAuditRoute.includes(marker)) {
    throw new Error(`Pack 28 scaffold audit route missing marker: ${marker}`);
  }
}

const scaffoldAuditStore = readFileSync('src/lib/onboarding/case-scaffold-audit-store.ts', 'utf8');
for (const marker of ['persistCaseScaffoldAudit', 'discardedCandidates', 'user-reviewed', 'acceptedCounts']) {
  if (!scaffoldAuditStore.includes(marker)) {
    throw new Error(`Pack 28 scaffold audit store missing marker: ${marker}`);
  }
}

const emptyGuidance = readFileSync('src/components/workbench/empty-state/EmptyStateGuidance.tsx', 'utf8');
for (const marker of ['computeCaseDensity', 'getEmptyStateActions', 'data-testid={`empty-state-guidance-${tabId}`']) {
  if (!emptyGuidance.includes(marker)) {
    throw new Error(`Pack 28 empty-state guidance missing marker: ${marker}`);
  }
}

const emptyStateActions = readFileSync('src/lib/workbench/empty-state-actions.ts', 'utf8');
for (const marker of ['EMPTY_STATE_REVIEW_ROLES', 'EMPTY_STATE_REVIEW_ONTOLOGIES', 'EMPTY_STATE_GUIDED_TABS', 'EMPTY_STATE_ACTION_MATRIX_REVIEW_SET', 'ROLE_ACTION_PROFILES', 'ONTOLOGY_ACTION_PROFILES']) {
  if (!emptyStateActions.includes(marker)) {
    throw new Error(`Pack 28 empty-state matrix missing marker: ${marker}`);
  }
}

const surfaceMap = readFileSync('docs/architecture/WORKBENCH_SURFACES.md', 'utf8');
for (const marker of ['Desk', 'Context', 'Library', 'Research', 'Ontology', 'Graph', 'ACH', 'Tools', 'Memos', 'Boardroom', 'Draft']) {
  if (!surfaceMap.includes(`| ${marker} |`)) {
    throw new Error(`Workbench surface map missing surface row: ${marker}`);
  }
}
for (const marker of ['four persistent substrate tabs', 'seven work chapters']) {
  if (!surfaceMap.includes(marker)) {
    throw new Error(`Workbench surface map missing structure marker: ${marker}`);
  }
}

const ontologyViewer = readFileSync('src/components/ontology/OntologySchemaViewer.tsx', 'utf8');
for (const marker of ['Active Ontologies', 'Validator Pass-Rate Detail', 'Primitive Coverage', 'Recommended Tools Not Yet Run', 'Add secondary ontology', 'Remove secondary lens']) {
  if (!ontologyViewer.includes(marker)) {
    throw new Error(`Pack 27 ontology viewer missing section: ${marker}`);
  }
}

const appPageCount = countFiles('src/app/app', 'page.tsx');
// Pack 16 intentionally adds settings/personas, settings/personas/new, and settings/personas/[personaId].
if (appPageCount > 34) {
  throw new Error(`Too many visible app route pages: ${appPageCount}; expected <= 34.`);
}

const sidebarLines = readFileSync('src/components/app/app-sidebar.tsx', 'utf8').split(/\r?\n/).length;
if (sidebarLines >= 350) {
  throw new Error(`Sidebar is still too large: ${sidebarLines} lines; expected < 350.`);
}

console.log('audit-workbench: ok');

function countFiles(dir: string, fileName: string): number {
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).reduce((count, entry) => {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) return count + countFiles(path, fileName);
    return count + (entry === fileName ? 1 : 0);
  }, 0);
}
