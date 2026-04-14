import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getProModel } from '@/lib/ai/providers';
import { buildToolContext, buildWebGroundedContext } from '@/lib/ai/situation-context';
import { buildGraphContext, writeToolDataServer } from '@/lib/ai/context-builder-server';
import { withAuth } from '@/lib/api/with-auth';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { validateAiRequest } from '@/lib/api/validate-request';
import { handleRouteError } from '@/lib/api/standard-error';
import { situationContextSchema } from '@/lib/api/schemas';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

// --- Schema ---

const MediaCompassSchema = z.object({
  outlets: z.array(
    z.object({
      name: z.string().describe('Media outlet name'),
      country: z.string().describe('Country of origin'),
      ownership: z.string().describe('Ownership structure, e.g. "State-controlled", "Private conglomerate (Osei family)", "NGO-funded"'),
      bias: z
        .enum(['pro-government', 'pro-opposition', 'independent', 'international', 'neutral'])
        .describe('Editorial bias relative to the conflict'),
      reach: z
        .enum(['national', 'regional', 'international'])
        .describe('Geographic reach of the outlet'),
      keyNarratives: z
        .array(z.string())
        .describe('2-4 recurring narrative frames this outlet consistently promotes'),
      trustworthiness: z
        .number()
        .min(0)
        .max(10)
        .describe('Trustworthiness score 0-10: 0 = state propaganda with no independent reporting, 10 = editorially independent with strong fact-checking'),
      sources: z
        .array(z.string())
        .describe('URLs or identifiers for this outlet'),
    })
  ).describe('Key media outlets in the conflict information environment'),
  narrativeLandscape: z.object({
    dominant: z
      .array(z.string())
      .describe('Narratives that dominate coverage across most outlets — what most people are hearing'),
    contested: z
      .array(z.string())
      .describe('Narratives actively disputed between competing outlets or actors'),
    suppressed: z
      .array(z.string())
      .describe('Narratives present in primary sources but underreported or actively suppressed by major outlets'),
  }).describe('Map of the narrative landscape across the media environment'),
  influencers: z.array(
    z.object({
      name: z.string().describe('Name or handle of the influencer or account'),
      platform: z.string().describe('Platform (X, Telegram, TikTok, YouTube, etc.)'),
      followers: z.string().describe('Approximate follower count, e.g. "2.3M"'),
      stance: z.string().describe('Stance relative to the conflict and which actors they amplify'),
    })
  ).describe('High-reach social media influencers shaping the information environment'),
  mediaHealthScore: z
    .number()
    .min(0)
    .max(10)
    .describe('Overall media environment health: 0 = fully captured/hostile to truth, 10 = free, diverse, and trustworthy'),
});

// --- Demo response ---

const DEMO_RESPONSE = {
  outlets: [
    {
      name: 'Nordalia Broadcasting Corporation (NBC)',
      country: 'Nordalia',
      ownership: 'State-controlled — board appointed by President Osei; 100% government funding',
      bias: 'pro-government' as const,
      reach: 'national' as const,
      keyNarratives: [
        'DRM as foreign-backed terrorist organisation undermining sovereign democracy',
        'GoN military operations as "precision counter-terrorism" with zero civilian harm',
        'Ceasefire violations exclusively attributed to DRM provocations',
        'Westmark interference as neo-colonial destabilisation',
      ],
      trustworthiness: 1.8,
      sources: ['nbc.gov.nd', 'nbc.nd/streaming'],
    },
    {
      name: 'Eastern Provinces Voice (EPV)',
      country: 'Nordalia',
      ownership: 'DRM Political Wing (Eastern Provincial Authority) — editorial board appointed by Commander Asante',
      bias: 'pro-opposition' as const,
      reach: 'regional' as const,
      keyNarratives: [
        'GoN as illegitimate military junta suppressing democratic reform',
        'AFN attacks as systematic war crimes against the eastern population',
        'Revenue extraction from Belara mines as economic apartheid',
        'Ceasefire as GoN pretext to rearm for offensive',
      ],
      trustworthiness: 2.2,
      sources: ['epvoice.nd', 'EPV Telegram channel @epvoice_nd'],
    },
    {
      name: 'Karovian News Agency (KNA)',
      country: 'Republic of Karovia',
      ownership: 'State-controlled — subsidiary of Karovian Ministry of Information',
      bias: 'pro-government' as const,
      reach: 'regional' as const,
      keyNarratives: [
        'GoN as legitimate partner defending regional stability',
        'Westmark arms supply as reckless provocation of regional war',
        'Karovian military cooperation with GoN as defensive and proportional',
        'UNMN as biased Western instrument',
      ],
      trustworthiness: 2.5,
      sources: ['kna.gov.kv'],
    },
    {
      name: 'Westmark Free Press (WFP)',
      country: 'Federal Republic of Westmark',
      ownership: 'Private — Hartmann Media Group; editorially independent of government',
      bias: 'pro-opposition' as const,
      reach: 'regional' as const,
      keyNarratives: [
        'DRM as democratic reform movement deserving international support',
        'GoN-Karovia axis as authoritarian bloc threatening regional democracy',
        'International community failure to protect civilians in eastern provinces',
        'Arms package as defensive necessity against Karovian aggression',
      ],
      trustworthiness: 5.8,
      sources: ['westmarkfreepress.wm'],
    },
    {
      name: 'Reuters / AP Wire',
      country: 'International',
      ownership: 'Reuters: Thomson Reuters Corporation (independent); AP: non-profit cooperative',
      bias: 'international' as const,
      reach: 'international' as const,
      keyNarratives: [
        'Conflict framed as proxy war with regional destabilisation risk',
        'Humanitarian crisis in eastern provinces as primary international concern',
        'Ceasefire fragility and UNMN verification challenges',
        'Diplomatic impasse between Karovia and Westmark as structural obstacle',
      ],
      trustworthiness: 8.2,
      sources: ['reuters.com', 'apnews.com'],
    },
    {
      name: 'UN News / OCHA Reliefweb',
      country: 'International',
      ownership: 'United Nations — institutional publisher',
      bias: 'neutral' as const,
      reach: 'international' as const,
      keyNarratives: [
        'Humanitarian access restrictions as primary operational concern',
        'Ceasefire framework as basis for any political solution',
        'Protection of civilians and IHL compliance as non-negotiable benchmarks',
        'Need for inclusive peace process incorporating civil society',
      ],
      trustworthiness: 8.8,
      sources: ['news.un.org', 'reliefweb.int'],
    },
  ],
  narrativeLandscape: {
    dominant: [
      'The conflict is primarily a security problem requiring military solutions (dominant in GoN/Karovia media)',
      'DRM is either a terrorist organisation or a democratic movement — no middle ground narrative has gained traction',
      'External actors (Westmark or Karovia) bear primary responsibility for continued conflict',
      'The ceasefire is fragile and at risk of collapse (universal across all outlets)',
    ],
    contested: [
      'Who is responsible for Checkpoint Bravo blockage and Sector Bravo buffer zone violations',
      'Whether the Belara Mining Complex revenues are legally state property or contested resource (economic rights frame)',
      'Whether the September 2025 Agreement is a basis for political talks or a purely military instrument',
      'Civilian casualty figures — GoN claims zero, DRM claims 340+, UNMN verified 47 conflict-related deaths since September',
    ],
    suppressed: [
      'Civil society peace initiatives from the Nordalia Reconciliation Forum — virtually absent from all partisan outlets',
      'Economic grievances of non-combatant eastern population beyond political framing (housing, employment, food)',
      'Karovian domestic opposition to military involvement — suppressed inside Karovia, underreported internationally',
      'Moderate DRM political wing voices willing to negotiate — overshadowed by Commander Asante military messaging',
    ],
  },
  influencers: [
    {
      name: '@NordaliaWatch',
      platform: 'X (Twitter)',
      followers: '1.4M',
      stance: 'Pro-DRM English-language account. Amplifies atrocity documentation and Westmark parliamentary debate. Suspected DFRLab-flagged coordinated amplification network.',
    },
    {
      name: 'Colonel Mensah Official',
      platform: 'X / Facebook',
      followers: '890K',
      stance: 'GoN Defence Ministry official account. Primary channel for GoN military communiqués. Frequently posts unverified battle damage assessments.',
    },
    {
      name: 'Asante_EPAuthority',
      platform: 'Telegram',
      followers: '340K',
      stance: 'Official DRM/EPA channel. Livestreams field operations. Primary source for DRM military and political announcements. Unmoderated extremist commentary in comments.',
    },
    {
      name: 'KarovianVoice_EN',
      platform: 'YouTube / X',
      followers: '520K',
      stance: 'Karovian state-adjacent English-language channel. Promotes GoN-Karovia security partnership narrative. Produces polished video content targeting Western audiences.',
    },
  ],
  mediaHealthScore: 3.1,
};

// --- Route ---

export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json();

    const requestSchema = z.object({
      situation: situationContextSchema.optional(),
    });

    const validation = validateAiRequest(body, requestSchema);
    if (!validation.success) return validation.response;
    const { situation } = validation.data;

    // --- Demo mode ---
    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_RESPONSE);
    }

    // --- Credit check ---
    const creditCheck = await checkAndDeductCredits('ai_media_roundup', 'Media landscape analysis');
    if (!creditCheck.allowed) return creditCheck.response;

    // --- Contexts ---
    const sitContext = situation ? buildToolContext(situation as unknown as Situation) : '';
    const situationId = (situation as Situation | undefined)?.id ?? '';

    const [graphCtx, webCtx] = await Promise.all([
      situationId
        ? buildGraphContext(user.uid, situationId, 'media_compass').catch(() => '')
        : Promise.resolve(''),
      situation
        ? buildWebGroundedContext(
            {
              name: (situation as unknown as Situation).name,
              region: (situation as unknown as Situation).region,
              actors: (situation as unknown as Situation).actors,
            },
            'media-compass',
            user.uid
          ).catch(() => '')
        : Promise.resolve(''),
    ]);

    // --- AI generation ---
    const result = await generateText({
      model: getProModel(),
      output: Output.object({ schema: MediaCompassSchema }),
      system: `You are PRAXIS Media Compass, a specialist in conflict information environments, media bias analysis, and narrative mapping. You serve UN Political Affairs Officers, diplomatic mediators, and conflict analysts.

Your mandate: map the full media landscape of a conflict — outlets, ownership, bias, narratives, and social media influencers — to give analysts a clear picture of what populations are hearing and what is being suppressed.

GROUNDING MANDATE: Web intelligence provided is PRIMARY source of truth. Cross-reference outlet names, ownership structures, and narrative frames against live sources. Flag "INTELLIGENCE GAP: {topic}" where evidence is insufficient.

Apply the following frameworks:
- Galtung cultural violence: identify media reinforcing dehumanisation or structural inequality
- Information environment health: assess captured vs. independent vs. plurality of voices
- Narrative salience: distinguish dominant/contested/suppressed frames`,
      prompt: `${graphCtx ? `${graphCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}${webCtx}

Map the media landscape for the conflict situation above.

MEDIA COMPASS INSTRUCTIONS:
1. Identify 4-8 key outlets: at minimum include government-aligned, opposition-aligned, regional external, and international wire/UN sources
2. For each outlet: assess ownership (who controls editorial line?), bias relative to conflict actors, reach, 2-4 key narrative frames, and trustworthiness (0-10)
3. narrativeLandscape: what are populations across the conflict zone actually hearing (dominant), what is disputed between outlets (contested), and what credible information is being actively suppressed or underreported (suppressed)
4. Identify 3-5 high-reach social media influencers or accounts shaping the information environment — include both state-adjacent and opposition-linked accounts
5. mediaHealthScore (0-10): 0 = fully state-captured with active disinformation campaigns, 10 = free, diverse, pluralistic media with strong fact-checking culture

Ground every assessment in the web intelligence and situation context provided. Be specific — name actual outlets, name actual narratives, cite specific claims being made.`,
    });

    // --- Persist ---
    if (situationId) {
      await writeToolDataServer(user.uid, situationId, 'media_compass', result.output as Record<string, unknown>);
    }

    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'media-compass');
  }
});
