import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const route = readFileSync(join(process.cwd(), 'src/app/api/ai/chat/route.ts'), 'utf8');
const chat = readFileSync(join(process.cwd(), 'src/components/app/praxis-chat.tsx'), 'utf8');

describe('Direct Ask server continuity and retry integration', () => {
  it('uses the same stable history partition for owner-scoped reads and both persistence stores', () => {
    expect(route.includes('const historyCapsuleId = askHistoryCapsuleId({')).toBe(true);
    for (const operation of ['loadServerAskHistory', 'persistAskThreadTurn', 'persistAskThreadTurnSql']) {
      const start = route.indexOf(`await ${operation}({`);
      const fields = route.slice(start, route.indexOf('});', start));
      expect(fields.includes('uid: _user.uid')).toBe(true);
      expect(fields.includes('capsuleId: historyCapsuleId')).toBe(true);
    }
    expect(chat.includes('activeCapsuleId ?? DIRECT_ASK_HISTORY_CAPSULE_ID')).toBe(true);
  });

  it('restores the composer for HTTP/network/stream failure and preserves real stream error detail', () => {
    expect(chat.includes('const restoreFailedPrompt = () =>')).toBe(true);
    expect(chat.includes('!requestController.signal.aborted && currentDraft.current.ownerScope === draftOwnerScope && !currentDraft.current.text.trim()')).toBe(true);
    expect(chat.includes('const streamError = parseDataStreamError(line)')).toBe(true);
    expect(chat.includes('describeAskFailure(streamError)')).toBe(true);
    expect(chat.match(/restoreFailedPrompt\(\);/g)?.length).toBeGreaterThanOrEqual(3);
    expect(chat.includes('autoSendNonce === consumedAutoSendNonce.current')).toBe(true);
    expect(chat.includes('consumedAutoSendNonce.current = autoSendNonce')).toBe(true);
  });
});
