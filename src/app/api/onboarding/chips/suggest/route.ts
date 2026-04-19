import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { checkAndDeductCreditsForUid } from '@/lib/api/with-credits';
import { generateText } from 'ai';
import { getModel } from '@/lib/ai/providers';
import { z } from 'zod';

const Body = z.object({
  role: z.string(),
  field: z.enum(['mandate', 'redLines']),
  currentText: z.string().max(600).optional(),
});

export const POST = withAuth(async (req, user) => {
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  if (!user.isDemo) {
    const gate = await checkAndDeductCreditsForUid(user.uid, 'ai_chat', 'onboarding chip suggest');
    if (!gate.allowed) return gate.response;
  }

  const prompt = parsed.data.field === 'mandate'
    ? `The analyst has role "${parsed.data.role}". Suggest 3 additional short mandate descriptions (each a single sentence, max 110 chars). Return ONLY a JSON array of strings.`
    : `Suggest 3 additional red-line constraints (each a single sentence, max 110 chars, imperative). Return ONLY a JSON array of strings.`;

  const { text } = await generateText({ model: getModel(), prompt });
  // Parse JSON array from text robustly
  const match = text.match(/\[[\s\S]*\]/);
  let chips: string[] = [];
  try { chips = JSON.parse(match?.[0] ?? '[]'); } catch { chips = []; }
  return NextResponse.json({ chips: chips.filter((c): c is string => typeof c === 'string').slice(0, 5) });
});
