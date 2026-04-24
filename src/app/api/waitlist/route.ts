import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  // Honeypot: legitimate browsers never fill this hidden field. Bots do.
  website: z.string().optional(),
  // Elapsed ms from form mount to submit. Real humans need ≥1.2s.
  elapsedMs: z.number().int().nonnegative().optional(),
});

const IP_RATE_LIMIT = 3; // max submissions per IP per 10-min window

async function checkIpRateLimit(
  db: FirebaseFirestore.Firestore,
  ip: string,
): Promise<boolean> {
  const windowKey = Math.floor(Date.now() / 600_000).toString(); // 10-min bucket
  const ref = db.collection('rate_limits').doc(`waitlist_${ip}_${windowKey}`);
  try {
    return await db.runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      const current = doc.exists ? (doc.data()?.count ?? 0) : 0;
      if (current >= IP_RATE_LIMIT) return false;
      tx.set(
        ref,
        { count: current + 1, ip, kind: 'waitlist', expiresAt: Date.now() + 900_000 },
        { merge: true },
      );
      return true;
    });
  } catch {
    return true; // fail open
  }
}

async function getClientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  return h.get('x-real-ip') ?? 'unknown';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.parse(body);

    // Honeypot — silently accept (don't signal) so bots keep wasting their time.
    if (parsed.website && parsed.website.trim().length > 0) {
      return NextResponse.json({ success: true });
    }

    // Time-trap — forms submitted in < 1.2s are almost certainly bots.
    if (typeof parsed.elapsedMs === 'number' && parsed.elapsedMs < 1_200) {
      return NextResponse.json({ success: true });
    }

    const { email } = parsed;

    const { getAdminDbOrThrow } = await import('@/lib/firebase/admin');

    let db;
    try {
      db = getAdminDbOrThrow();
    } catch {
      console.error('[waitlist] Firestore unavailable, cannot persist waitlist entry');
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
    }

    const ip = await getClientIp();
    if (!(await checkIpRateLimit(db, ip))) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      );
    }

    // Duplicate check — enumeration-safe
    const existing = await db.collection('waitlist')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json({ success: true });
    }

    await db.collection('waitlist').add({
      email,
      createdAt: new Date().toISOString(),
      source: 'landing-page',
      status: 'pending',
      ip,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }
    console.error('Waitlist error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
