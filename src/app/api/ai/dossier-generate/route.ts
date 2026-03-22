import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getProModel } from '@/lib/ai/providers';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { searchWeb, formatResultsAsContext } from '@/lib/ai/firecrawl';

export const maxDuration = 120;

const DossierSectionSchema = z.object({
  sections: z.array(
    z.object({
      title: z.string().describe('Section title'),
      content: z.string().describe('Full section content in markdown format'),
      sources: z.array(z.string()).describe('Sources referenced in this section'),
      confidence: z.number().min(0).max(1).describe('Confidence score for this section (0-1)'),
    })
  ).describe('Generated dossier sections'),
});

// Static demo response
const DEMO_RESPONSE = {
  sections: [
    {
      title: 'Executive Summary',
      content: `The Nordalia Crisis represents a complex, multi-layered conflict combining contested electoral legitimacy, armed insurgency, regional proxy dynamics, and resource competition. Since the disputed March 2024 elections, the situation has escalated to Glasl Stage 5 (Loss of Face) with the Government of Nordalia (GoN) and the Democratic Reform Movement (DRM) locked in a pattern of positional entrenchment reinforced by external patrons Karovia and Westmark respectively.

The September 2025 ceasefire, brokered by UNMN and the AU Panel of the Wise, remains fragile but intact. However, 47 documented violations, accelerating buffer-zone incursions, and a hardline cabinet reshuffle by President Osei suggest the window for political progress is narrowing. The humanitarian toll — 1.2 million IDPs, 340,000 refugees, 2.8 million food-insecure — continues to mount.

This dossier assesses that a 60-90 day window exists for meaningful diplomatic intervention before military dynamics overtake the political track. Priority actions: reinforce ceasefire monitoring, establish an economic working group on rare earth revenue-sharing, and address the Karovia-Westmark proxy dimension through a parallel regional security dialogue.`,
      sources: [
        'UNMN SRSG briefing to UNSC, 14 Feb 2026',
        'ICG Africa Report No. 312, March 2026',
        'OCHA Situation Report, 28 Feb 2026',
        'UNSC Panel of Experts interim report S/2025/892',
      ],
      confidence: 0.85,
    },
    {
      title: 'Conflict Background',
      content: `The Nordalia Crisis originated with the disputed presidential elections of March 2024, in which incumbent President Amara Osei claimed victory amid widespread allegations of electoral fraud. The Democratic Reform Movement, initially a peaceful pro-democracy coalition, transitioned to armed resistance following the government crackdown of July 2024, which resulted in an estimated 200+ civilian casualties and mass arrests of opposition figures.

The conflict rapidly acquired international dimensions as Karovia deepened its pre-existing military partnership with the GoN under the 2019 bilateral defence treaty, while Westmark provided political support and non-lethal assistance to the DRM. The UN Security Council authorized UNMN (Resolution 2847) under Chapter VII, deploying approximately 12,000 peacekeepers from 18 troop-contributing countries.

The September 2025 ceasefire marked a significant diplomatic achievement but has not translated into political progress. The AU Roadmap for Elections — the agreed framework for a transitional process leading to credible elections by Q2 2027 — has stalled after the second mediation round in November 2025.`,
      sources: [
        'UNSC Resolution 2847',
        'AU Roadmap for Elections, September 2025',
        'DRM founding charter and communiques, July-August 2024',
        'Nordalian Independent Media Network archival reporting',
      ],
      confidence: 0.92,
    },
    {
      title: 'Key Actors and Relationships',
      content: `**Government of Nordalia (GoN):** Led by President Amara Osei. Controls the Armed Forces of Nordalia (AFN, ~45,000 personnel), state revenue institutions, and the capital. International recognition intact but democratic legitimacy contested. Recent cabinet reshuffle replaced moderate Defence Minister with hardliner General Mensah.

**Democratic Reform Movement (DRM):** Led by Commander Kwame Asante (former parliamentarian). ~8,000 fighters across three corps in the Eastern Provinces. Political wing operates the Eastern Provincial Authority. Evolved from peaceful coalition to armed movement following July 2024 crackdown.

**UNMN:** ~12,000 peacekeepers, mandated for civilian protection, ceasefire monitoring, humanitarian access, and political process facilitation. Led by SRSG Maria Santos, who maintains private back-channels with both parties.

**Karovia:** Principal GoN patron. Military equipment, logistics, intelligence cooperation, and seconded military advisors. Under investigation for arms embargo violations.

**Westmark:** Principal DRM political supporter. Hosts 340,000 refugees. Imposed targeted sanctions on 23 GoN officials. Provides non-lethal support; denies military assistance.

**Critical relationship dynamic:** The Karovia-Westmark proxy dimension gives each external patron effective veto power over their client's concessions, significantly complicating mediation. Any viable settlement requires addressing regional security guarantees in a parallel track.`,
      sources: [
        'UNMN force composition reports',
        'ICG Africa Report No. 312',
        'Karovian parliamentary debates, Nov 2025',
        'Westmark Foreign Ministry statements, Jan 2026',
        'SIPRI arms transfer database',
      ],
      confidence: 0.88,
    },
  ],
};

export async function POST(request: Request) {
  try {
    const {
      caseId,
      type,
      sections,
      classification,
      audience,
      conflictContext,
    } = await request.json() as {
      caseId: string;
      type: string;
      sections: string[];
      classification?: string;
      audience?: string;
      conflictContext?: string;
    };

    // --- Demo mode ---
    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_RESPONSE);
    }

    // --- Credit check ---
    const creditCheck = await checkAndDeductCredits('ai_dossier_generate', 'Dossier generation');
    if (!creditCheck.allowed) return creditCheck.response;

    // --- Web research for context enrichment ---
    const searchResults = await searchWeb(
      `${conflictContext || caseId} latest developments analysis`,
      { numResults: 5 }
    );
    const webContext = formatResultsAsContext(searchResults);

    // --- Generate all sections via a single structured call ---
    const result = await generateText({
      model: getProModel(),
      output: Output.object({ schema: DossierSectionSchema }),
      prompt: `You are a senior intelligence analyst producing a formal dossier. Generate the following sections for a ${type} dossier.

CASE: ${caseId}
${classification ? `CLASSIFICATION: ${classification}` : ''}
${audience ? `TARGET AUDIENCE: ${audience}` : ''}
${conflictContext ? `CONFLICT CONTEXT: ${conflictContext}` : ''}

SECTIONS TO GENERATE:
${sections.map((s, i) => `${i + 1}. ${s}`).join('\n')}

LATEST INTELLIGENCE:
${webContext || 'No web results available. Base analysis on the conflict context provided.'}

Requirements:
- Each section must be substantive, analytically rigorous, and written in professional intelligence assessment style
- Include specific source attribution for key claims
- Calibrate confidence scores based on source quality and corroboration
- Use UN DPPA analytical standards and frameworks
- Content should be suitable for senior diplomatic officials
- Use markdown formatting for structure within each section`,
      system: 'You are a senior intelligence analyst at a major international crisis monitoring organization. Produce formal dossier content that meets the analytical standards of UN DPPA, ICG, and major diplomatic services. Write in authoritative, precise language. Always attribute key claims to specific sources and calibrate confidence.',
    });

    return NextResponse.json(result.output);
  } catch (err) {
    console.error('Dossier generate route error:', err);
    return NextResponse.json({ error: 'Dossier generation failed' }, { status: 500 });
  }
}
