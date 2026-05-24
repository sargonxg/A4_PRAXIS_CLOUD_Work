import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyIdToken, getAdminDbOrThrow } from '@/lib/firebase/admin';
import { DEFAULT_AI_SETTINGS, type AISettings } from '@/lib/firebase/firestore';
import { isModelPreferenceValue } from '@/lib/ai/model-preferences';
import { verifyCookie } from '@/lib/auth/cookie-signer';

function parseSessionCookie(value: string): Record<string, unknown> | null {
  const verified = verifyCookie(value);
  if (!verified) return null;
  try {
    const parsed = JSON.parse(verified);
    return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('tacitus-auth-session');
    if (!session?.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const data = parseSessionCookie(session.value);
    if (!data) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    if (data.demo) {
      return NextResponse.json({ settings: DEFAULT_AI_SETTINGS });
    }

    if (typeof data.token !== 'string') {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const verified = await verifyIdToken(data.token);
    if (!verified?.uid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const adminDb = getAdminDbOrThrow();
    const userSnap = await adminDb.collection('users').doc(verified.uid).get();

    if (!userSnap.exists) {
      return NextResponse.json({ settings: DEFAULT_AI_SETTINGS });
    }

    const profile = userSnap.data() as Record<string, unknown>;
    return NextResponse.json({ settings: profile.aiSettings ?? DEFAULT_AI_SETTINGS });
  } catch {
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('tacitus-auth-session');
    if (!session?.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const sessionData = parseSessionCookie(session.value);
    if (!sessionData) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    if (sessionData.demo) {
      return NextResponse.json({ success: true }); // No-op for demo
    }

    if (typeof sessionData.token !== 'string') {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const verified = await verifyIdToken(sessionData.token);
    if (!verified?.uid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const uid = verified.uid;

    const body: Partial<AISettings> = await request.json();

    // Validate and sanitize
    const settings: Partial<AISettings> = {};
    if (isModelPreferenceValue(body.preferredModel)) {
      settings.preferredModel = body.preferredModel;
    }
    if (typeof body.temperature === 'number') {
      settings.temperature = Math.max(0, Math.min(1, body.temperature));
    }
    if (body.researchDepth && ['quick', 'standard', 'comprehensive'].includes(body.researchDepth)) {
      settings.researchDepth = body.researchDepth;
    }
    if (typeof body.customInstructions === 'string') {
      settings.customInstructions = body.customInstructions.slice(0, 1000);
    }
    if (typeof body.maxTokens === 'number') {
      settings.maxTokens = Math.max(256, Math.min(8192, Math.round(body.maxTokens)));
    }

    const adminDb = getAdminDbOrThrow();
    await adminDb.collection('users').doc(uid).update({ aiSettings: settings });

    return NextResponse.json({ success: true, settings });
  } catch {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
