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

const context = read('src/components/workbench/ContextTab.tsx');
if (context.includes('Context storage contract')) failures.push('Context implementation contract copy is still visible');
if (context.includes('full re-genesis jobs remain backend follow-up work')) failures.push('Context exposes backend follow-up copy');

const library = read('src/components/workbench/LibraryTab.tsx');
if (library.includes('Save case-frame claim')) failures.push('Library still exposes duplicate save-case-frame-claim action');
if (library.includes('Saved case-frame claim')) failures.push('Library still has duplicate saved-claim fallback copy');

const draft = read('src/components/workbench/draft/DraftTab.tsx');
for (const marker of ['Redaction aware', 'Manifest embedded', 'DOCX/PDF/Markdown']) {
  if (draft.includes(marker)) failures.push(`Draft still exposes decorative badge ${marker}`);
}

const debugPanel = read('src/components/app/debug-panel.tsx');
if (!debugPanel.includes('NEXT_PUBLIC_DEBUG_PANEL')) failures.push('Debug panel is not gated behind explicit production opt-in');
if (!debugPanel.includes("process.env.NODE_ENV !== 'production'")) failures.push('Debug panel lacks production environment guard');

const askPraxis = read('src/components/syria/ask-praxis.tsx');
for (const marker of ['UN NY', 'P-Rep', 'Security Council', 'NGO Working Group', 'UNSC informal']) {
  if (askPraxis.includes(marker)) failures.push(`Ask Praxis still exposes generic institution/persona copy: ${marker}`);
}

const briefBlocks = read('src/components/briefing/brief-blocks-panel.tsx');
for (const marker of ["useState('UNSC informal consultations')", "audience: 'UNSC informal consultations'", 'Audience (e.g., UNSC, Cabinet)']) {
  if (briefBlocks.includes(marker)) failures.push(`Briefing builder still exposes institutional placeholder: ${marker}`);
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
