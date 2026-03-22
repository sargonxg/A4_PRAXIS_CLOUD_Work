import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { DEFAULT_AI_SETTINGS, type AISettings } from '@/lib/firebase/firestore';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('tacitus-auth-session');
    if (!session?.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const data = JSON.parse(session.value);
    if (data.demo) {
      return NextResponse.json({ settings: DEFAULT_AI_SETTINGS });
    }

    if (!data.token) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const payload = JSON.parse(Buffer.from(data.token.split('.')[1], 'base64').toString());
    const uid = payload.user_id || payload.sub;

    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ settings: DEFAULT_AI_SETTINGS });
    }

    const profile = userSnap.data();
    return NextResponse.json({ settings: profile.aiSettings || DEFAULT_AI_SETTINGS });
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

    const sessionData = JSON.parse(session.value);
    if (sessionData.demo) {
      return NextResponse.json({ success: true }); // No-op for demo
    }

    if (!sessionData.token) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const payload = JSON.parse(Buffer.from(sessionData.token.split('.')[1], 'base64').toString());
    const uid = payload.user_id || payload.sub;

    const body: Partial<AISettings> = await request.json();

    // Validate and sanitize
    const settings: Partial<AISettings> = {};
    if (body.preferredModel && ['gemini-2.5-flash', 'gemini-2.5-pro', 'claude-sonnet-4'].includes(body.preferredModel)) {
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

    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { aiSettings: settings });

    return NextResponse.json({ success: true, settings });
  } catch {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
