import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { auditAppHomeDispatch } from '../../../scripts/lib/public-home-dispatch';

const appIndex = readFileSync('src/app/app/page.tsx', 'utf8');

describe('public-surface Home dispatch audit', () => {
  it('accepts validated saved memo links and the Drafts panel while keeping ordinary Home on direct Ask', () => {
    expect(auditAppHomeDispatch(appIndex)).toEqual([]);
  });

  it('rejects memo IDs taken directly from unvalidated query input', () => {
    const rawId = appIndex.replace('const memoId = singleResourceId(query.memoId);', 'const memoId = query.memoId;');
    expect(auditAppHomeDispatch(rawId)).toContain('saved memo dispatch must validate memoId before opening the workbench');
  });

  it.each(["if (true)", "if (memoId || query.panel === 'advanced')", 'if (memoId || query.panel)'])('rejects broader workbench dispatch (%s)', (condition) => {
    const broaderDispatch = appIndex.replace("if (memoId || query.panel === 'memo')", condition);
    expect(auditAppHomeDispatch(broaderDispatch)).toContain('workbench dispatch must require a validated memoId or the explicit Drafts panel');
  });

  it('rejects a workbench added to the ordinary Home return', () => {
    const changedDefault = appIndex.replace('<PraxisChatFirstShell mode="authenticated" />', '<TaskletPraxisWorkbench mode="app" initialPanel="ask" />');
    const failures = auditAppHomeDispatch(changedDefault);
    expect(failures).toContain('ordinary signed-in Home must retain the direct Ask shell');
    expect(failures).toContain('memo and Drafts dispatch must be the only workbench render in the app index');
  });
});
