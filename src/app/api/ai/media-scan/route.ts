import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getModel } from '@/lib/ai/providers';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { searchWeb, formatResultsAsContext } from '@/lib/ai/firecrawl';

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

export async function POST(request: Request) {
  try {
    const { outlets, topic, conflictContext } = await request.json() as {
      outlets: string[];
      topic: string;
      conflictContext?: string;
    };

    // --- Demo mode ---
    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_RESPONSE);
    }

    // --- Credit check ---
    const creditCheck = await checkAndDeductCredits('ai_media_scan', 'Media scan analysis');
    if (!creditCheck.allowed) return creditCheck.response;

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
      model: getModel(),
      output: Output.object({ schema: MediaScanSchema }),
      prompt: `You are a senior media analyst specializing in conflict coverage analysis. Analyze how the following media outlets cover the given topic.

TOPIC: ${topic}
${conflictContext ? `CONFLICT CONTEXT: ${conflictContext}` : ''}

OUTLETS TO ANALYZE: ${outlets.join(', ')}

WEB SEARCH RESULTS:
${allContext}

For each outlet, analyze:
1. The articles found — their sentiment and narrative framing
2. The overall editorial bias on this topic
3. What is emphasized, what is omitted, and what narrative angle is adopted

Then provide a comparative analysis highlighting:
- Divergent framing between outlets
- Shared narratives or consensus points
- Information gaps that require cross-referencing
- Potential propaganda or influence operation indicators`,
      system: 'You are a senior media analyst at a conflict monitoring organization. Provide rigorous, evidence-based media bias assessments for diplomatic and security professionals. Always distinguish between factual reporting and editorial framing.',
    });

    return NextResponse.json(result.output);
  } catch (err) {
    console.error('Media scan route error:', err);
    return NextResponse.json({ error: 'Media scan failed' }, { status: 500 });
  }
}
