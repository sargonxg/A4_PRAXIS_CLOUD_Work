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
  'src/components/workbench/empty-state/EmptyStateGuidance.tsx',
  'src/components/workbench/workbench-surface-elements.tsx',
  'src/lib/workbench/library-state.ts',
  'src/lib/workbench/research-state.ts',
  'src/lib/workbench/surface-state.ts',
  'src/lib/workbench/chapter-content-layer.ts',
  'src/lib/workbench/open-questions-store.ts',
  'src/lib/workbench/draft-assembly-state.ts',
  'src/lib/workbench/case-density.ts',
  'src/lib/workbench/empty-state-actions.ts',
  'src/lib/ontology/validator-pass-rate.ts',
  'src/lib/onboarding/case-scaffold.ts',
  'src/types/open-questions.ts',
  'src/app/api/cases/[caseId]/context-scope/route.ts',
  'src/app/api/cases/[caseId]/open-questions/route.ts',
  'src/app/api/cases/[caseId]/open-questions/[questionId]/route.ts',
  'src/app/api/cases/[caseId]/research/route.ts',
  'src/app/api/cases/scaffold/route.ts',
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

const expectedTabs = ['chapters', 'desk', 'context', 'library', 'research', 'ontology', 'graph', 'ach', 'tools', 'memos', 'boardroom', 'draft'];
const actualTabs = WORKBENCH_TABS.map((tab) => tab.id);
if (actualTabs.join(',') !== expectedTabs.join(',')) {
  throw new Error(`Workbench tabs mismatch: ${actualTabs.join(',')}`);
}

const expectedChapters = ['situation-frame', 'source-receipts', 'conflict-graph', 'dialectica-reasoning', 'decision-product'];
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
for (const marker of ['<DeskTab />', '<ContextTab />', '<LibraryTab />', '<ResearchTab />', '<DraftTab />', '<EmptyStateGuidance', '<WorkbenchChapterRenderer />']) {
  if (!tabContent.includes(marker)) {
    throw new Error(`Workbench tab content missing surface dispatch: ${marker}`);
  }
}

const chapterRenderer = readFileSync('src/components/workbench/chapter-renderer.tsx', 'utf8');
if (!chapterRenderer.includes('renderLayeredChapterContent')) {
  throw new Error('Chapters must use the Pack 26 layered content dispatcher for user cases.');
}
if (/GenericChapterContent|The default case flow/i.test(chapterRenderer)) {
  throw new Error('Chapter renderer still contains generic placeholder fallback copy.');
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
for (const marker of ['FrameEditor', 'ScopeAdvisory', 'SourcePreferences', 'DocumentUploadInline', 'ActorClaimInterestRefiner', 'context-scope']) {
  if (!contextTab.includes(marker)) {
    throw new Error(`Pack 26 Context Studio missing section/API marker: ${marker}`);
  }
}

const openQuestionsRoute = readFileSync('src/app/api/cases/[caseId]/open-questions/route.ts', 'utf8');
for (const marker of ['withAuth', 'listOpenQuestions', 'createOpenQuestion']) {
  if (!openQuestionsRoute.includes(marker)) {
    throw new Error(`Pack 26 open-questions API missing marker: ${marker}`);
  }
}

const libraryState = readFileSync('src/lib/workbench/library-state.ts', 'utf8');
for (const marker of ['source', 'document', 'claim', 'memo', 'export', 'buildLibraryArtifacts']) {
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

const draftState = readFileSync('src/lib/workbench/draft-assembly-state.ts', 'utf8');
for (const marker of ['buildDraftMemoOptions', 'buildDraftAppendices', 'renderDraftMarkdown', 'DraftExportSettings']) {
  if (!draftState.includes(marker)) {
    throw new Error(`Pack 28 draft assembly helper missing marker: ${marker}`);
  }
}

const draftTab = readFileSync('src/components/workbench/draft/DraftTab.tsx', 'utf8');
for (const marker of ['Briefing Assembly', 'MemosSelection', 'CoverPageEditor', 'AppendixPicker', 'RedactionSettings', 'ExportControls']) {
  if (!draftTab.includes(marker)) {
    throw new Error(`Pack 28 DraftTab missing section marker: ${marker}`);
  }
}

const caseScaffold = readFileSync('src/lib/onboarding/case-scaffold.ts', 'utf8');
for (const marker of ['CaseScaffoldProposal', 'buildCaseScaffoldProposal', 'initialActors', 'initialClaims', 'suggestedSourceIds']) {
  if (!caseScaffold.includes(marker)) {
    throw new Error(`Pack 28 case scaffold helper missing marker: ${marker}`);
  }
}

const newSituation = readFileSync('src/app/app/situations/new/page.tsx', 'utf8');
for (const marker of ['AiFirstCaseCreation', 'Create with AI assistance', 'handleApplyScaffold', 'CreationModeChooser']) {
  if (!newSituation.includes(marker)) {
    throw new Error(`Pack 28 new-user case creation missing marker: ${marker}`);
  }
}

const emptyGuidance = readFileSync('src/components/workbench/empty-state/EmptyStateGuidance.tsx', 'utf8');
for (const marker of ['computeCaseDensity', 'getEmptyStateActions', 'data-testid={`empty-state-guidance-${tabId}`']) {
  if (!emptyGuidance.includes(marker)) {
    throw new Error(`Pack 28 empty-state guidance missing marker: ${marker}`);
  }
}

const ontologyViewer = readFileSync('src/components/ontology/OntologySchemaViewer.tsx', 'utf8');
for (const marker of ['Active Ontologies', 'Validator Pass-Rate Detail', 'Primitive Coverage', 'Recommended Tools Not Yet Run']) {
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
