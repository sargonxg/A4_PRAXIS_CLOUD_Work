import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getProModel } from '@/lib/ai/providers';
import { withAuth } from '@/lib/api/with-auth';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { buildToolContext } from '@/lib/ai/situation-context';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

const DiscoveredSourceSchema = z.object({
  sources: z.array(z.object({
    name: z.string(),
    url: z.string().optional(),
    type: z.enum(['wire', 'newspaper', 'broadcaster', 'state_media', 'local_media', 'diaspora', 'think_tank', 'academic', 'social_media', 'telegram', 'blog', 'ngo', 'government', 'military', 'other']),
    platform: z.string().describe('Platform: website, Telegram, X/Twitter, YouTube, Facebook, RSS, etc.'),
    language: z.string(),
    region: z.string(),
    reliability: z.number().min(0).max(1),
    orientation: z.number().min(-1).max(1),
    description: z.string(),
    relevanceToSituation: z.string(),
    nomenclature: z.array(z.object({
      term: z.string().describe('How this source refers to an actor or concept'),
      standardTerm: z.string().describe('The standard/neutral term'),
      significance: z.string().describe('What this naming choice reveals about their perspective'),
    })).optional().describe('Key naming conventions this source uses that reveal editorial perspective'),
    coverageStrengths: z.array(z.string()),
    knownBiases: z.array(z.string()),
    updateFrequency: z.string().describe('How often: real-time, daily, weekly, etc.'),
    audienceProfile: z.string().describe('Who reads/watches this source'),
  })),
});

export const POST = withAuth(async (req, _user) => {
  const creditCheck = await checkAndDeductCredits('research', 'AI source discovery');
  if (!creditCheck.allowed) return creditCheck.response;

  try {
    const { situation, existingSources } = await req.json() as {
      situation?: Situation;
      existingSources?: { name: string }[];
    };
    const sitContext = situation ? buildToolContext(situation) : '';

    const existingNames = (existingSources || []).map((s) => s.name).join(', ');

    const result = await generateText({
      model: getProModel(),
      output: Output.object({ schema: DiscoveredSourceSchema }),
      prompt: `You are a conflict intelligence source analyst. For the situation below, discover 8-12 high-value intelligence sources that an analyst should monitor.

SITUATION: ${sitContext}

${existingNames ? `ALREADY TRACKED (do not repeat): ${existingNames}` : ''}

Find sources across these categories:
- Local media from the conflict region (newspapers, TV, radio)
- Social media channels (Telegram channels, X/Twitter accounts, Facebook pages) that are influential in this conflict
- Diaspora media covering this situation from abroad
- Think tanks and research institutes with specific expertise
- NGO situation reports and field updates
- Government/military official channels
- Academic/journal sources with regional expertise
- Wire services with special correspondents in the region

For each source:
1. Assess reliability (0-1) and political orientation (-1 left to 1 right)
2. Note their nomenclature — how they name actors, groups, events (this reveals editorial perspective)
3. Identify coverage strengths and known biases
4. Describe who their audience is

IMPORTANT: Recommend REAL sources that actually exist. Do not fabricate outlets.`,
      system: 'You are a senior conflict intelligence source analyst with experience at UN DPPA, ICG, and major think tanks. You specialize in mapping the information ecosystems of conflict zones — identifying which outlets, channels, and platforms provide actionable intelligence and understanding their editorial perspectives through nomenclature analysis.',
    });

    return NextResponse.json(result.output);
  } catch (err) {
    console.error('[discover-sources] Error:', err);
    return NextResponse.json({ error: 'Source discovery failed' }, { status: 500 });
  }
});
