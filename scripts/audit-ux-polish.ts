import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const checks: Array<{ label: string; file: string; mustInclude: string[] }> = [
  {
    label: 'App loading route uses skeleton shell',
    file: 'src/app/app/loading.tsx',
    mustInclude: ['animate-pulse', 'rounded', 'Content skeleton'],
  },
  {
    label: 'Dashboard loading route uses skeleton shell',
    file: 'src/app/app/dashboard/loading.tsx',
    mustInclude: ['Skeleton'],
  },
  {
    label: 'App error boundary has retry reset path',
    file: 'src/app/app/error.tsx',
    mustInclude: ['ErrorFallback', 'reset'],
  },
  {
    label: 'Dashboard error boundary has retry reset path',
    file: 'src/app/app/dashboard/error.tsx',
    mustInclude: ['ErrorFallback', 'reset'],
  },
  {
    label: 'Shared empty state is testable',
    file: 'src/components/shared/empty-state.tsx',
    mustInclude: ['data-testid="shared-empty-state"', 'action'],
  },
  {
    label: 'PRAXIS empty state is testable',
    file: 'src/components/praxis/empty-state.tsx',
    mustInclude: ['data-testid="praxis-empty-state"', 'primaryCta'],
  },
  {
    label: 'Tool error boundary exposes retry and alert semantics',
    file: 'src/components/praxis/tool-error-boundary.tsx',
    mustInclude: ['role="alert"', 'Retry', 'data-testid="tool-error-state"'],
  },
  {
    label: 'AI error toast is accessible and retryable',
    file: 'src/components/praxis/ai-error-toast.tsx',
    mustInclude: ['aria-live="polite"', 'retryable', 'RotateCcw'],
  },
  {
    label: 'PRAXIS loading states announce progress',
    file: 'src/components/praxis/loading-states.tsx',
    mustInclude: ['role="status"', 'aria-live="polite"', 'data-testid="praxis-generating-state"'],
  },
  {
    label: 'Workbench smoke covers the five primary surfaces',
    file: 'tests/e2e/app-usability-smoke.spec.ts',
    mustInclude: ['Context Studio', 'ontology-schema-viewer', 'praxis-graph-canvas', 'tool-marketplace', 'Memo Studio', 'Each case opens'],
  },
  {
    label: 'Intermediate app text utilities are defined for contrast',
    file: 'src/app/globals.css',
    mustInclude: ['.text-slate-650', '.text-slate-750', 'var(--color-app-text-secondary)'],
  },
];

const failures: string[] = [];

for (const check of checks) {
  const fullPath = path.join(root, check.file);
  if (!existsSync(fullPath)) {
    failures.push(`${check.label}: missing ${check.file}`);
    continue;
  }
  const body = readFileSync(fullPath, 'utf8');
  for (const expected of check.mustInclude) {
    if (!body.includes(expected)) {
      failures.push(`${check.label}: ${check.file} missing ${expected}`);
    }
  }
}

const allowedIntermediateTextUtilities = new Set(['text-slate-650', 'text-slate-750']);
const filesToScan = collectFiles(path.join(root, 'src'), /\.(ts|tsx|css)$/);
for (const file of filesToScan) {
  const body = readFileSync(file, 'utf8');
  const matches = body.matchAll(/\btext-(slate|gray|zinc|neutral)-([0-9]{3})\b/g);
  for (const match of matches) {
    const utility = match[0];
    const step = match[2];
    const isTailwindStep = ['050', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'].includes(step.padStart(3, '0'));
    if (!isTailwindStep && !allowedIntermediateTextUtilities.has(utility)) {
      failures.push(`unsupported text color utility ${utility} in ${path.relative(root, file)}`);
    }
  }
}

if (failures.length > 0) {
  console.error('[audit:ux-polish] failures:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:ux-polish] ok');

function collectFiles(dir: string, pattern: RegExp): string[] {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectFiles(fullPath, pattern);
    return pattern.test(entry.name) ? [fullPath] : [];
  });
}
