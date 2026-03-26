import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getProModel } from '@/lib/ai/providers';
import { buildToolContext } from '@/lib/ai/situation-context';
import { withAuth } from '@/lib/api/with-auth';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { searchWeb, formatResultsAsContext } from '@/lib/ai/firecrawl';
import { searchArticles, getVolumeTimeline, getToneTimeline } from '@/lib/data-feeds/gdelt-client';
import { getSituationIntelligence } from '@/lib/data-feeds/feed-aggregator';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

const MediaScanSchema = z.object({
  outlets: z.array(
    z.object({
      name: z.string().describe('Name of the media outlet'),
      articles: z.array(
        z.object({
          url: z.string().describe('URL of the article'),
          title: z.string().describe('Title of the article'),
          sentiment: z.enum(['positive', 'negative', 'neutral', 'mixed']).describe('Overall sentiment of the article'),
          framing: z.string().describe('How the outlet frames the topic — narrative angle, emphasis, omissions'),
        })
      ).describe('Articles found for this outlet'),
      overallBias: z.string().describe('Overall editorial bias assessment for this outlet on the topic'),
    })
  ).describe('Per-outlet analysis results'),
  comparativeAnalysis: z.string().describe('Cross-outlet comparative analysis highlighting divergent framing, shared narratives, and information gaps'),
  situationSources: z.array(z.object({
    name: z.string().describe('Name of the media source'),
    x: z.number().min(-1).max(1).describe('Political orientation: -1 (far left) to 1 (far right)'),
    y: z.number().min(0).max(1).describe('Reliability: 0 (unreliable) to 1 (highly reliable)'),
    type: z.string().describe('Source type: wire, public, private, state, local, diaspora, think_tank'),
    region: z.string().describe('Geographic region of this source'),
    description: z.string().describe('Brief description of this source'),
    relevance: z.string().describe('Why this source is specifically relevant to this situation'),
    url: z.string().optional().describe('Homepage URL of the source'),
  })).describe('5-10 media sources that are particularly relevant to this specific situation — local media, regional outlets, think tanks, diaspora media. Include sources that international analysts should monitor for this conflict. Assign x (orientation) and y (reliability) coordinates for plotting on a bias/reliability chart.'),
});

// Static demo response
const DEMO_RESPONSE = {
  outlets: [
    {
      name: 'Nordalian State Broadcasting',
      articles: [
        {
          url: 'https://nsb.nd/news/ceasefire-progress-2026',
          title: 'Government Forces Maintain Order in Eastern Provinces',
          sentiment: 'positive' as const,
          framing: 'Frames the conflict as a counter-terrorism operation. Emphasizes government legitimacy and territorial integrity. Omits civilian displacement figures and DRM political grievances.',
        },
        {
          url: 'https://nsb.nd/analysis/peace-roadmap',
          title: 'AU Roadmap Advances Under Presidential Leadership',
          sentiment: 'positive' as const,
          framing: 'Credits the GoN for all peace process progress. Attributes delays to DRM intransigence and foreign interference from Westmark.',
        },
      ],
      overallBias: 'Strong pro-government bias. State-owned outlet functioning as GoN messaging platform. Systematically underreports civilian harm and frames the DRM exclusively as a terrorist organization rather than a political movement.',
    },
    {
      name: 'Nordalian Independent Media Network',
      articles: [
        {
          url: 'https://nimn.org/reports/ceasefire-violations-march2026',
          title: 'Ceasefire Violations Accelerate in Kessara Corridor',
          sentiment: 'negative' as const,
          framing: 'Documents violations by both parties with specific dates and coordinates. Highlights civilian impact. Provides context on structural drivers of escalation.',
        },
        {
          url: 'https://nimn.org/analysis/humanitarian-crisis-deepens',
          title: 'Eastern Province Humanitarian Crisis Deepens as Access Restricted',
          sentiment: 'negative' as const,
          framing: 'Focuses on humanitarian consequences with OCHA data. Attributes access restrictions to both GoN checkpoints and DRM administrative barriers.',
        },
      ],
      overallBias: 'Moderate pro-accountability bias. Independent network with strong investigative capacity. Tends to emphasize humanitarian dimensions and government accountability. Coverage is fact-based but editorial framing leans toward civilian protection advocacy.',
    },
  ],
  comparativeAnalysis: 'The two outlets present fundamentally divergent narratives of the same conflict. NSB frames the situation as a government-led stabilization effort against terrorism, while NIMN frames it as a humanitarian crisis driven by both parties\' actions. Key information gaps: NSB omits displacement figures and ceasefire violations by AFN forces; NIMN provides limited coverage of DRM internal politics and command disputes. Neither outlet adequately covers the Karovia-Westmark proxy dimension. Cross-referencing both sources with UNMN reporting provides the most complete picture.',
};

export const POST = withAuth(async (request, _user) => {
  try {
    const { outlets, topic, conflictContext, situation } = await request.json() as {
      outlets: string[];
      topic: string;
      conflictContext?: string;
      situation?: Situation;
    };
    const sitContext = situation ? buildToolContext(situation) : '';

    // --- Demo mode ---
    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_RESPONSE);
    }

    // --- Credit check ---
    const creditCheck = await checkAndDeductCredits('ai_media_scan', 'Media scan analysis');
    if (!creditCheck.allowed) return creditCheck.response;

    // --- GDELT real-time media data ---
    let gdeltContext = '';
    try {
      const [gdeltArticles, volume, tone] = await Promise.all([
        searchArticles({ query: topic, timespan: '7d', maxRecords: 15 }),
        getVolumeTimeline(topic, '30d'),
        getToneTimeline(topic, '30d'),
      ]);
      if (gdeltArticles.length > 0) {
        const sourceCounts: Record<string, number> = {};
        gdeltArticles.forEach((a) => { sourceCounts[a.domain] = (sourceCounts[a.domain] || 0) + 1; });
        const topSources = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
        const avgTone = gdeltArticles.reduce((s, a) => s + a.tone, 0) / gdeltArticles.length;
        gdeltContext = `\nGDELT REAL-TIME DATA (last 7 days):
${gdeltArticles.length} articles found across ${Object.keys(sourceCounts).length} domains
Top sources: ${topSources.map(([d, c]) => `${d}(${c})`).join(', ')}
Average tone: ${avgTone.toFixed(1)} (negative=critical, positive=favorable)
Volume trend (30d): ${volume.length > 0 ? `${volume[0].value} → ${volume[volume.length - 1].value}` : 'N/A'}
Tone trend (30d): ${tone.length > 0 ? `${tone[0].value.toFixed(1)} → ${tone[tone.length - 1].value.toFixed(1)}` : 'N/A'}
Recent headlines: ${gdeltArticles.slice(0, 5).map((a) => `"${a.title}" (${a.domain})`).join('; ')}\n`;
      }
    } catch { /* continue without GDELT */ }

    // --- Live intelligence feed ---
    let intelContext = '';
    try {
      if (situation) {
        const intel = await getSituationIntelligence({
          country: situation.region || situation.name,
          query: situation.name,
          limit: 15,
        });
        if (intel.events.length > 0) {
          intelContext = '\n\nLIVE INTELLIGENCE FEED:\n' + intel.events.slice(0, 10).map(e =>
            `- [${e.source.toUpperCase()}] ${e.date}: ${e.title} (${e.severity})`
          ).join('\n');
        }
      }
    } catch { /* data feeds optional */ }

    // --- Gather web sources for each outlet ---
    const searchResults = await Promise.all(
      outlets.map((outlet) =>
        searchWeb(`${outlet} ${topic}`, { numResults: 2 })
      )
    );

    const allContext = outlets
      .map((outlet, i) => {
        const results = searchResults[i];
        if (!results.length) return `### ${outlet}\nNo recent articles found.`;
        return `### ${outlet}\n${formatResultsAsContext(results)}`;
      })
      .join('\n\n---\n\n');

    // --- AI analysis ---
    const result = await generateText({
      model: getProModel(),
      output: Output.object({ schema: MediaScanSchema }),
      prompt: `${sitContext ? `${sitContext}\n\n` : ''}Conduct a rigorous media landscape analysis applying the CRAAP test methodology, narrative ecosystem mapping, and cross-outlet triangulation.

TOPIC: ${topic}
${conflictContext ? `CONFLICT CONTEXT: ${conflictContext}` : ''}
${gdeltContext}${intelContext}
OUTLETS TO ANALYZE: ${outlets.join(', ')}

WEB SEARCH RESULTS:
${allContext}

## ANALYSIS FRAMEWORK

**Per-Outlet CRAAP Test Assessment**
For each outlet, evaluate each article/coverage using:
- **Currency**: Is the information timely? Publication date vs. event date lag.
- **Relevance**: Does coverage address the core conflict dynamics or peripheral issues?
- **Authority**: What is the outlet's track record, ownership, funding, editorial independence?
- **Accuracy**: Are claims verifiable? Are sources cited? Are opposing views represented?
- **Purpose**: What is the evident purpose — inform, persuade, advocate, entertain, destabilize?

**Narrative Framing Analysis**
For each outlet, identify:
1. Primary narrative frame (security threat, humanitarian crisis, political dispute, development failure, etc.)
2. Actor legitimization: who is portrayed as legitimate, who as spoiler?
3. Omission patterns: what context, actors, or events are systematically absent?
4. Language choices: use of loaded terms, passive/active voice, casualty asymmetry
5. Source selection bias: which voices are amplified, which silenced?

**Triangulation Matrix**
Compare coverage across outlets to identify:
- **Consensus facts**: claims appearing in 3+ independent outlets with divergent editorial lines (high reliability)
- **Disputed claims**: contradictory factual assertions requiring further verification
- **Exclusive narratives**: claims appearing only in single outlet or outlet cluster (requires scrutiny)
- **Information operations indicators**: coordinated messaging, astroturfing, attribution without evidence

**Reliability Scoring**
Score each outlet on a 1-5 scale:
5 = Highly reliable (multiple independent sources, editorial independence, corrections policy)
4 = Generally reliable with known editorial bias clearly disclosed
3 = Mixed reliability, requires cross-referencing
2 = Significant accuracy problems or undisclosed conflicts of interest
1 = Propaganda outlet or systematically unreliable

Then synthesize comparative analysis with specific evidence for all claims. Do not offer generic assessments.

Additionally, identify 5-10 media sources that are SPECIFICALLY relevant to this situation:
- Local media outlets from the conflict region
- Diaspora media covering this issue
- Think tanks and research institutes with expertise
- Regional outlets with special correspondents
- Online platforms/channels that are influential in this conflict

For each, provide a political orientation score (x: -1 to 1) and reliability score (y: 0 to 1).`,
      system: 'You are a senior media analyst trained in CRAAP test methodology, narrative ecosystem mapping, and information operations analysis. You have experience as a UN DPPA media advisor and conflict journalism monitor. Provide evidence-anchored assessments that help diplomatic professionals distinguish reliable intelligence from noise and identify influence operations.',
    });

    return NextResponse.json(result.output);
  } catch (err) {
    console.error('Media scan route error:', err);
    return NextResponse.json({ error: 'Media scan failed' }, { status: 500 });
  }
});
