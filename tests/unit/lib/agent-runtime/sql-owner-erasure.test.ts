import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ createPool: vi.fn(), query: vi.fn() }));
vi.mock('pg', () => ({ Pool: class {
  constructor(options: unknown) { mocks.createPool(options); }
  query = mocks.query;
} }));

describe('account erasure through exact configured SQL stores', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    for (const key of ['DOCUMENT_DATABASE_URL', 'ASK_THREAD_DATABASE_URL', 'AGENT_RUNTIME_DATABASE_URL', 'PRAXIS_DATABASE_URL', 'DATABASE_URL']) vi.stubEnv(key, '');
    mocks.query.mockResolvedValue({ rows: [{ relation: 'existing' }] });
  });
  afterEach(() => vi.unstubAllEnvs());

  it('uses document and Ask URLs rather than assuming runtime shares their database', async () => {
    vi.stubEnv('DOCUMENT_DATABASE_URL', 'postgres://document-fixture');
    vi.stubEnv('ASK_THREAD_DATABASE_URL', 'postgres://ask-fixture');
    vi.stubEnv('AGENT_RUNTIME_DATABASE_URL', 'postgres://runtime-fixture');
    const document = await import('@/lib/agent-runtime/document-postgres');
    const ask = await import('@/lib/agent-runtime/ask-thread-postgres');
    await document.eraseOwnerDocumentMirror('owner');
    await ask.eraseOwnerAskThreadMemory('owner');
    expect(mocks.createPool.mock.calls.map(([options]) => options.connectionString)).toEqual(['postgres://document-fixture', 'postgres://ask-fixture']);
    expect(mocks.query).toHaveBeenCalledWith('DELETE FROM document_ingestion_records WHERE owner_uid = $1', ['owner']);
    expect(mocks.query).toHaveBeenCalledWith('DELETE FROM ask_threads WHERE owner_uid = $1', ['owner']);
    expect(mocks.query.mock.calls.some(([sql]) => String(sql).includes('CREATE TABLE'))).toBe(false);
  });
  it('treats unconfigured stores as absent without opening a pool', async () => {
    const document = await import('@/lib/agent-runtime/document-postgres');
    const ask = await import('@/lib/agent-runtime/ask-thread-postgres');
    await document.eraseOwnerDocumentMirror('owner');
    await ask.eraseOwnerAskThreadMemory('owner');
    expect(mocks.createPool).not.toHaveBeenCalled();
  });
  it('does not create tables during cleanup when the configured store has no mirror', async () => {
    vi.stubEnv('DOCUMENT_DATABASE_URL', 'postgres://document-fixture');
    mocks.query.mockResolvedValue({ rows: [{ relation: null }] });
    const document = await import('@/lib/agent-runtime/document-postgres');
    await document.eraseOwnerDocumentMirror('owner');
    expect(mocks.query).toHaveBeenCalledOnce();
  });
  it('propagates unavailable SQL cleanup so account deletion remains pending', async () => {
    vi.stubEnv('ASK_THREAD_DATABASE_URL', 'postgres://ask-fixture');
    mocks.query.mockRejectedValueOnce(new Error('SQL unavailable'));
    const ask = await import('@/lib/agent-runtime/ask-thread-postgres');
    await expect(ask.eraseOwnerAskThreadMemory('owner')).rejects.toThrow('SQL unavailable');
  });
});
