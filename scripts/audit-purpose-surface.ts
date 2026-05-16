import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures: string[] = [];

function read(rel: string): string {
  const full = path.join(root, rel);
  if (!existsSync(full)) {
    failures.push(`${rel} missing`);
    return '';
  }
  return readFileSync(full, 'utf8');
}

const report = read('PURPOSE_AUDIT_REPORT.md');
for (const marker of [
  '## TL;DR',
  '## Findings: Remove',
  '## Findings: Simplify',
  '## Findings: Consolidate',
  '## Cross-cutting findings',
  '## Recommended sequence',
  '## Things kept after consideration',
]) {
  if (!report.includes(marker)) failures.push(`purpose report missing ${marker}`);
}

const contexts = read('src/app/app/contexts/page.tsx');
if (!contexts.includes('ContextBuilderRoom')) failures.push('Contexts page must render the unified ContextBuilderRoom');
const toolsPage = read('src/app/app/tools/page.tsx');
if (!toolsPage.includes('ContextBuilderRoom')) failures.push('Tools page must reuse the unified ContextBuilderRoom');

const draft = read('src/components/writer/PraxisWriter.tsx');
for (const marker of ['Redaction aware', 'Manifest embedded', 'DOCX/PDF/Markdown']) {
  if (draft.includes(marker)) failures.push(`Draft still exposes decorative badge ${marker}`);
}
for (const marker of ['PraxisWriter', 'CitationSidebar', 'useWriterAutosave', "onExport={(format) => void exportDocument(format)}"]) {
  if (!draft.includes(marker)) failures.push(`PraxisWriter missing canonical writing marker ${marker}`);
}

const debugPanel = read('src/components/app/debug-panel.tsx');
if (!debugPanel.includes('NEXT_PUBLIC_DEBUG_PANEL')) failures.push('Debug panel is not gated behind explicit production opt-in');
if (!debugPanel.includes("process.env.NODE_ENV !== 'production'")) failures.push('Debug panel lacks production environment guard');

if (existsSync(path.join(root, 'src/components/user-case'))) {
  failures.push('retired the selected situation component directory still exists');
}

const briefBlocksPath = 'src/components/briefing/brief-blocks-panel.tsx';
if (existsSync(path.join(root, briefBlocksPath))) {
  const briefBlocks = read(briefBlocksPath);
  for (const marker of ["useState('UNSC informal consultations')", "audience: 'UNSC informal consultations'", 'Audience (e.g., UNSC, Cabinet)']) {
    if (briefBlocks.includes(marker)) failures.push(`Briefing builder still exposes institutional placeholder: ${marker}`);
  }
}

const tools = read('src/app/app/tools/page.tsx');
if (tools.includes('Showing the opinionated 8-surface PRAXIS shell')) {
  failures.push('Tools page still shows archived-tool explanation before active workflow');
}
if (!tools.includes('Review archived tools')) failures.push('Tools page lacks secondary archive access after hiding first-view archive copy');

const notificationSettings = read('src/app/app/settings/notifications/page.tsx');
if (!notificationSettings.includes('formatNotificationType')) failures.push('Notification settings do not format event names as human labels');
for (const marker of ['Source ingest complete', 'Research thread saved to memory', 'Memory service degraded']) {
  if (!notificationSettings.includes(marker)) failures.push(`Notification settings missing human label ${marker}`);
}

if (failures.length) {
  console.error('[audit:purpose-surface] failures:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:purpose-surface] ok (static-marker)');
