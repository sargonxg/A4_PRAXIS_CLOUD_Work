import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getModel } from '@/lib/ai/providers';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { searchWeb, formatResultsAsContext } from '@/lib/ai/firecrawl';

export const maxDuration = 60;

const BriefingSchema = z.object({
  slides: z.array(
    z.object({
      title: z.string().describe('Slide title'),
      content: z.string().describe('Slide content in markdown format — concise, bullet-pointed where appropriate'),
      speakerNotes: z.string().optional().describe('Speaker notes with additional context and talking points for the presenter'),
      sources: z.array(z.string()).optional().describe('Sources referenced in this slide'),
    })
  ).describe('Briefing slides'),
});

// Static demo response
const DEMO_RESPONSE = {
  slides: [
    {
      title: 'Situation Overview: Nordalia Crisis',
      content: `- **Conflict status:** Stage 5 (Glasl) — Loss of Face
- **Ceasefire:** Fragile but holding since September 2025
- **Violations:** 47 documented since inception; accelerating in Kessara corridor
- **Displacement:** 1.2M IDPs + 340K refugees in Westmark
- **Political track:** Stalled since November 2025 mediation round`,
      speakerNotes: 'Frame this as a conflict at a critical inflection point. The ceasefire provides a framework but is under increasing strain. The 60-90 day window for political progress is the key message.',
      sources: ['UNMN SRSG briefing, 14 Feb 2026', 'OCHA Situation Report, 28 Feb 2026'],
    },
    {
      title: 'Key Developments (Last 30 Days)',
      content: `- **Cabinet reshuffle:** President Osei replaced moderate Defence Minister with AFN hardliner General Mensah
- **Buffer zone incursions:** Third consecutive week of violations by both parties in Kessara corridor
- **Karovian logistics:** 40% increase in military transport flights to Nordalia City
- **Journalist detentions:** Two additional NIMN journalists arrested, bringing total to five
- **Currency:** Nordalian krone fell 2.1%, cumulative depreciation now 36.4%`,
      speakerNotes: 'The cabinet reshuffle is the most significant political development. It signals that the hardline faction within the GoN is currently ascendant. Combined with the Karovian logistics increase, this suggests preparation for potential military escalation if the political track does not produce results.',
      sources: ['NIMN reporting, March 2026', 'Open-source flight tracking data', 'ICG Africa Report No. 312'],
    },
    {
      title: 'Escalation Assessment',
      content: `- **Current stage:** Glasl Stage 5 (Loss of Face) — upper boundary
- **Stage 6 indicators:** Two of four partially present
  - Demonstrative military actions (buffer zone incursions)
  - Increasing reliance on mediated communication
- **Escalation probability:** 35% chance of Stage 6 transition within 3-6 months
- **De-escalation anchors:** SRSG back-channel, prisoner exchange framework, economic interdependence`,
      speakerNotes: 'Emphasize that the conflict has crossed the second Glasl threshold (Win-Win to Win-Lose) but has not yet reached the critical third threshold (Win-Lose to Lose-Lose). The window for de-escalation remains open but is narrowing.',
      sources: ['PRAXIS Glasl assessment, March 2026'],
    },
    {
      title: 'Humanitarian Situation',
      content: `- **Food insecurity:** 2.8M people affected; planting season (April-May) at risk
- **Humanitarian access:** Three corridors operating below capacity
  - GoN administrative obstacles at Checkpoint Alpha
  - DRM taxation of aid convoys in Sector 3
- **Protection concerns:** Five NIMN journalists detained; CSCN leaders under pressure from both parties
- **Refugee burden:** Westmark hosting 340K refugees, straining host communities`,
      speakerNotes: 'The approaching planting season is a critical window. If agricultural activity is disrupted for a second consecutive year, we face a protracted food crisis. This creates urgency for humanitarian access improvements regardless of political progress.',
      sources: ['OCHA Situation Report, 28 Feb 2026', 'WFP food security assessment', 'UNHCR data'],
    },
    {
      title: 'Regional Dynamics',
      content: `- **Karovia:** Deepening military partnership with GoN; arms embargo violations documented
- **Westmark:** Maintaining targeted sanctions on 23 GoN officials; hosting refugee population
- **P5 dynamics:** Split mirrors local conflict polarization; complicating UNSC action
- **RECONA:** Limited capacity for independent intervention; Karovian influence constrains action
- **Risk:** Low but non-trivial (10-15%) probability of direct Karovian military intervention if GoN faces existential threat`,
      speakerNotes: 'The proxy dimension is critical. The conflict cannot be resolved without addressing the Karovia-Westmark security competition. A parallel regional track is needed alongside the domestic political process.',
      sources: ['Panel of Experts interim report S/2025/892', 'Security Council Report forecast, Feb 2026'],
    },
    {
      title: 'Policy Options and Recommendations',
      content: `1. **Reinforce ceasefire monitoring** — Additional UNMN observers at three highest-risk contact points
2. **Economic working group** — Joint GoN-DRM group on rare earth revenue-sharing
3. **Military-to-military channel** — Expand SRSG back-channel to include senior military representatives
4. **Arms embargo enforcement** — Implement Panel of Experts monitoring recommendations
5. **Regional security dialogue** — Dedicated envoy or contact group for Karovia-Westmark dimension`,
      speakerNotes: 'Frame these as a sequenced package. Items 1-3 are immediately actionable. Items 4-5 require UNSC consensus-building. The economic working group is the most promising entry point because both parties have material interests in rare earth revenue stability.',
      sources: ['PRAXIS policy analysis', 'UN Peacebuilding Fund cost-benefit methodology'],
    },
    {
      title: 'Key Dates and Decision Points',
      content: `- **April-May 2026:** Eastern Province planting season — critical humanitarian window
- **June 2026:** Proposed third AU mediation round
- **September 2026:** UNMN mandate renewal review
- **Q2 2027:** AU Roadmap target for transitional elections (increasingly unrealistic)

**Watchlist:** AFN troop movements near Kessara corridor; Karovian military flights; DRM procurement patterns; UNSC informal consultations on mandate`,
      speakerNotes: 'The September 2026 mandate renewal is the next major institutional decision point. If the political track remains stalled, there is a real risk of mandate contraction or non-renewal. This creates a window of opportunity but also a deadline pressure that could be destabilizing.',
    },
  ],
};

export async function POST(request: Request) {
  try {
    const { caseId, briefingType, conflictContext } = await request.json() as {
      caseId: string;
      briefingType: string;
      conflictContext?: string;
    };

    // --- Demo mode ---
    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_RESPONSE);
    }

    // --- Credit check ---
    const creditCheck = await checkAndDeductCredits('ai_briefing_generate', 'Briefing generation');
    if (!creditCheck.allowed) return creditCheck.response;

    // --- Web search for latest context ---
    const searchResults = await searchWeb(
      `${conflictContext || caseId} latest news developments`,
      { numResults: 5 }
    );
    const webContext = formatResultsAsContext(searchResults);

    // --- AI generation ---
    const result = await generateText({
      model: getModel(),
      output: Output.object({ schema: BriefingSchema }),
      prompt: `You are a senior briefing officer preparing a ${briefingType} briefing for senior diplomatic officials.

CASE: ${caseId}
BRIEFING TYPE: ${briefingType}
${conflictContext ? `CONFLICT CONTEXT: ${conflictContext}` : ''}

LATEST INTELLIGENCE:
${webContext || 'No web results available. Base analysis on the conflict context provided.'}

Generate a complete briefing with 5-7 slides. Each slide should have:
- A clear, concise title
- Bullet-pointed content suitable for presentation (not dense paragraphs)
- Speaker notes with additional context and talking points for the presenter
- Source attribution where applicable

The briefing should follow a logical arc:
1. Situation overview / current status
2. Key recent developments
3. Analytical assessment (escalation, trends)
4. Humanitarian/economic dimensions
5. Regional/international dynamics
6. Policy options and recommendations
7. Key dates and decision points

Write in authoritative diplomatic language suitable for UNSC, AU PSC, or similar senior forums.`,
      system: 'You are a senior briefing officer at a major international organization. Produce concise, analytically rigorous briefing content for senior diplomatic and security officials. Use bullet points for clarity. Speaker notes should provide the depth and nuance that slides cannot.',
    });

    return NextResponse.json(result.output);
  } catch (err) {
    console.error('Briefing generate route error:', err);
    return NextResponse.json({ error: 'Briefing generation failed' }, { status: 500 });
  }
}
