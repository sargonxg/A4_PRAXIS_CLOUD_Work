import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  db: null as FakeFirestore | null,
}));

vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (handler: (request: Request, user: { uid: string; isDemo: boolean }, context?: { params: Promise<{ conversationId: string }> }) => Promise<Response>) => (
    request: Request,
    context?: { params: Promise<{ conversationId: string }> },
  ) => handler(request, { uid: 'user-a', isDemo: false }, context),
}));

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDbOrThrow: () => {
    if (!mocks.db) throw new Error('Fake Firestore not configured');
    return mocks.db;
  },
}));

describe('/api/conversations isolation', () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.db = new FakeFirestore();
  });

  it('does not return a conversation whose stored owner differs from the authenticated user', async () => {
    mocks.db!.data.set('users/user-a/conversations/conv-b', {
      ownerUid: 'user-b',
      conversationId: 'conv-b',
      capsuleId: 'cap-b',
      title: 'Other user conversation',
      updatedAt: '2026-05-24T10:00:00.000Z',
    });
    const { GET } = await import('@/app/api/conversations/[conversationId]/route');

    const response = await GET(new Request('https://praxis.tacitus.me/api/conversations/conv-b'), {
      params: Promise.resolve({ conversationId: 'conv-b' }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Conversation not found' });
  });

  it('lists only conversations owned by the authenticated user', async () => {
    mocks.db!.data.set('users/user-a/conversations/conv-a', {
      ownerUid: 'user-a',
      conversationId: 'conv-a',
      capsuleId: 'cap-a',
      title: 'Owned conversation',
      updatedAt: '2026-05-24T10:00:00.000Z',
    });
    mocks.db!.data.set('users/user-a/conversations/conv-b', {
      ownerUid: 'user-b',
      conversationId: 'conv-b',
      capsuleId: 'cap-b',
      title: 'Other user conversation',
      updatedAt: '2026-05-24T10:01:00.000Z',
    });
    const { GET } = await import('@/app/api/conversations/route');

    const response = await GET(new Request('https://praxis.tacitus.me/api/conversations'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.conversations.map((conversation: { conversationId: string }) => conversation.conversationId)).toEqual(['conv-a']);
  });
});

class FakeFirestore {
  data = new Map<string, Record<string, unknown>>();

  collection(path: string) {
    return new FakeCollection(this, path);
  }
}

class FakeCollection {
  private maxDocs: number | null = null;

  constructor(private db: FakeFirestore, private path: string) {}

  doc(id: string) {
    return new FakeDoc(this.db, `${this.path}/${id}`, id);
  }

  orderBy() {
    return this;
  }

  limit(count: number) {
    this.maxDocs = count;
    return this;
  }

  async get() {
    const prefix = `${this.path}/`;
    const docs = Array.from(this.db.data.entries())
      .filter(([path]) => path.startsWith(prefix) && !path.slice(prefix.length).includes('/'))
      .map(([path, value]) => new FakeSnapshot(Boolean(value), value, path.split('/').pop() ?? 'unknown'));
    return { docs: this.maxDocs ? docs.slice(0, this.maxDocs) : docs };
  }
}

class FakeDoc {
  constructor(private db: FakeFirestore, private path: string, public id: string) {}

  collection(name: string) {
    return new FakeCollection(this.db, `${this.path}/${name}`);
  }

  async get() {
    const value = this.db.data.get(this.path);
    return new FakeSnapshot(Boolean(value), value ?? {}, this.id);
  }
}

class FakeSnapshot {
  constructor(public exists: boolean, private value: Record<string, unknown>, public id: string) {}

  data() {
    return this.value;
  }
}
