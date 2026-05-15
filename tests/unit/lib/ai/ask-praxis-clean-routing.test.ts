import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PRAXIS_CANONICAL_TOOLS } from '@/lib/tools/canonical';

const repoRoot = process.cwd();
const chatRouteSource = readFileSync(join(repoRoot, 'src/app/api/ai/chat/route.ts'), 'utf8');
const askToolsSource = readFileSync(join(repoRoot, 'src/lib/ai/ask-praxis-tools.ts'), 'utf8');

describe('Ask PRAXIS clean routing contract', () => {
  it('routes heavy work through the simple app spine instead of removed tool pages', () => {
    expect(chatRouteSource).not.toContain('recommend running the **Brainstorming Table**');
    expect(chatRouteSource).not.toContain('`/app/brainstorming-table`');
    expect(chatRouteSource).toContain('Memo Studio at \\`/app/write\\`');
    expect(chatRouteSource).toContain('Canvas at \\`/app/canvas\\`');
    expect(chatRouteSource).toContain('label it as a routed internal capability');
  });

  it('uses the canonical tool registry instead of stale hard-coded tool counts', () => {
    expect(PRAXIS_CANONICAL_TOOLS.length).toBeGreaterThanOrEqual(12);
    expect(PRAXIS_CANONICAL_TOOLS.some((tool) => tool.id === 'sourceability')).toBe(true);
    expect(chatRouteSource).toContain('PRAXIS_CANONICAL_TOOLS.length');
    expect(chatRouteSource).toContain('buildAskPraxisToolCatalogPrompt');
    expect(chatRouteSource).not.toContain('10 consolidated primary tools');
  });

  it('keeps deep research as a routed internal capability, not a fake-live page', () => {
    expect(askToolsSource).not.toContain("toolPath: '/app/deep-search-agent'");
    expect(askToolsSource).toContain("directive: 'suggest_internal_tool'");
    expect(askToolsSource).toContain("toolId: 'grounded-research'");
    expect(askToolsSource).toContain("toolPath: '/app/tools'");
  });
});
