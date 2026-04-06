import { NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = schema.parse(body);

    // Use Firebase Admin SDK to store in Firestore
    const { getAdminDbOrThrow } = await import('@/lib/firebase/admin');

    let db;
    try {
      db = getAdminDbOrThrow();
    } catch {
      // Firestore unavailable (e.g. missing service account key in dev)
      console.error('[waitlist] Firestore unavailable, cannot persist waitlist entry');
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
    }

    // Check for duplicate — don't reveal whether email exists (OWASP enumeration prevention)
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
