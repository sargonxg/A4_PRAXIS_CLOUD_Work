import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

interface MemoSearchResult {
  memoId: string;
  title: string;
  capsuleVersion: number;
  snippets: string[];
  sourceReceiptIds: string[];
  updatedAt: string;
}

const QuerySchema = z.object({
  capsuleVersion: z.coerce.number().int().positive().optional(),
  q: z.string().max(200).optional(),
  dateFrom: z.string().max(40).optional(),
  dateTo: z.string().max(40).optional(),
});

export const GET = withAuth(async (request, user) => {
  try {
    if (user.isDemo) return NextResponse.json({ results: [] satisfies MemoSearchResult[] });
    const parsed = QuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid memo search', details: parsed.error.flatten() }, { status: 400 });
    }

    const db = getAdminDbOrThrow();
    let query: FirebaseFirestore.Query = db.collection('users').doc(user.uid).collection('memos');
    if (parsed.data.capsuleVersion) query = query.where('capsuleVersion', '==', parsed.data.capsuleVersion);
    if (parsed.data.dateFrom) query = query.where('ts', '>=', parsed.data.dateFrom);
    if (parsed.data.dateTo) query = query.where('ts', '<=', parsed.data.dateTo);
    query = query.orderBy('ts', 'desc').limit(100);

    const snap = await query.get();
    const term = parsed.data.q?.trim().toLowerCase() ?? '';
    const results = snap.docs
      .map((doc) => normalizeMemoSearchResult(doc.id, doc.data()))
      .filter((result) => !term || searchHaystack(result).includes(term))
      .map((result) => ({
        ...result,
        snippets: term ? snippetsFor(result, term) : result.snippets.slice(0, 3),
      }));

    return NextResponse.json({ results });
  } catch (err) {
    return handleRouteError(err, 'memos/search');
  }
});

function normalizeMemoSearchResult(id: string, data: FirebaseFirestore.DocumentData): MemoSearchResult {
  const title = stringField(data.title) ?? stringField(data.memoTitle) ?? id;
  const updatedAt = stringField(data.updatedAt) ?? stringField(data.ts) ?? stringField(data.createdAt) ?? new Date(0).toISOString();
  return {
    memoId: stringField(data.memoId) ?? id,
    title,
    capsuleVersion: numberField(data.capsuleVersion) ?? 1,
    snippets: [
      title,
      ...stringsFromUnknown(data.claimChecks).slice(0, 2),
      ...stringsFromUnknown(data.toolInvocations).slice(0, 2),
    ].filter(Boolean).slice(0, 4),
    sourceReceiptIds: sourceReceiptIdsFrom(data.sourceReceiptIds ?? data.sourceReceipts),
    updatedAt,
  };
}

function searchHaystack(result: MemoSearchResult): string {
  return [result.memoId, result.title, result.capsuleVersion, ...result.snippets, ...result.sourceReceiptIds]
    .join(' ')
    .toLowerCase();
}

function snippetsFor(result: MemoSearchResult, term: string): string[] {
  const matches = result.snippets.filter((snippet) => snippet.toLowerCase().includes(term));
  return (matches.length ? matches : result.snippets).slice(0, 3);
}

function sourceReceiptIdsFrom(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        return stringField(record.id) ?? stringField(record.receiptId) ?? stringField(record.sourceReceiptId);
      }
      return null;
    })
    .filter((item): item is string => Boolean(item));
}

function stringsFromUnknown(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') {
      const record = item as Record<string, unknown>;
      return stringField(record.summary) ?? stringField(record.title) ?? stringField(record.text) ?? '';
    }
    return '';
  }).filter(Boolean);
}

function stringField(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function numberField(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
