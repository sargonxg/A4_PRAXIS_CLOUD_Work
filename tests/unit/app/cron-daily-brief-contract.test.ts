import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const cron = readFileSync(join(process.cwd(), 'src/app/api/cron/daily-brief/route.ts'), 'utf8');
const settings = readFileSync(join(process.cwd(), 'src/components/settings/account-settings-page.tsx'), 'utf8');
const prefs = readFileSync(join(process.cwd(), 'src/types/preferences.ts'), 'utf8');

describe('daily brief schedule contract', () => {
  it('uses opted-in preferences to enqueue durable Daily Brief agent runs', () => {
    expect(prefs).toContain('dailyBrief');
    expect(settings).toContain('data-testid="daily-brief-settings"');
    expect(settings).toContain('data-testid="daily-brief-toggle"');
    expect(cron).toContain(".where('dailyBrief.enabled', '==', true)");
    expect(cron).toContain("policyAgentId: 'daily-brief'");
    expect(cron).toContain("triggerType: 'schedule'");
    expect(cron).toContain('enqueueAgentRunDispatch');
    expect(cron).toContain('review-gated memo draft only');
  });
});
