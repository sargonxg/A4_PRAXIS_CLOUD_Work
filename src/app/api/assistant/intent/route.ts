import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Output, generateText } from 'ai';
import { withAuth } from '@/lib/api/with-auth';
import { getModel } from '@/lib/ai/providers';

const IntentSchema = z.object({
  intent: z.enum(['answer', 'profile.mutation', 'situation.action']),
  patch: z
    .object({
      path: z.string(),
      op: z.enum(['add', 'remove', 'replace']),
      value: z.unknown(),
    })
    .nullable(),
  humanSummary: z.string(),
});

const SYSTEM = `You classify a single chat turn from a PRAXIS user into one of three intents:

- "answer" — a normal question or request for analysis. No mutation intended.
- "profile.mutation" — the user is asking to change their own analyst profile (role, org, team, mandate, lenses, regions, audience, language, red lines, analytical style, preferred sources, primary/secondary domain).
- "situation.action" — the user is asking to create, edit, or delete a situation.

For "profile.mutation" you MUST emit a normalised JSON patch in this shape:
{ "path": "perspective.regions", "op": "add", "value": "Sahel" }

Allowed paths are dot-paths into AnalystProfile, for example:
- identity.role, identity.seniority, identity.org, identity.team
- perspective.mandate, perspective.lenses, perspective.regions, perspective.audience, perspective.primaryDomain, perspective.secondaryDomains
- workingStyle.language, workingStyle.analyticalStyle, workingStyle.redLines, workingStyle.sourceCategories

Ops:
- "add" / "remove" for list fields (lenses, regions, redLines, sourceCategories, secondaryDomains)
- "replace" for scalar fields (role, seniority, org, team, mandate, audience, language, analyticalStyle, primaryDomain)

If the intent is not "profile.mutation", set "patch" to null.

"humanSummary" is a short (<100 chars) plain-English description of what the user wants. For "answer" intent, describe what they asked. For mutations, describe the change ("Add Sahel to regions of focus").`;

export const POST = withAuth(async (req) => {
  try {
    const body = (await req.json().catch(() => ({}))) as { text?: unknown };
    const text = typeof body.text === 'string' ? body.text : '';
    if (!text) {
      return NextResponse.json({ error: 'missing text' }, { status: 400 });
    }

    const result = await generateText({
      model: getModel(),
      experimental_output: Output.object({ schema: IntentSchema }),
      system: SYSTEM,
      prompt: `User said: "${text}"`,
    });

    const output = (result as { experimental_output?: z.infer<typeof IntentSchema>; output?: z.infer<typeof IntentSchema> }).experimental_output
      ?? (result as { output?: z.infer<typeof IntentSchema> }).output;

    if (!output) {
      return NextResponse.json({ error: 'classification failed' }, { status: 502 });
    }
    return NextResponse.json(output);
  } catch (err) {
    console.error('[assistant/intent] failed:', err);
    return NextResponse.json({ error: 'classification failed' }, { status: 500 });
  }
});
