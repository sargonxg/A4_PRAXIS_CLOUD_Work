import { NextResponse } from 'next/server';
import { Output } from 'ai';
import { z } from 'zod';
import { callProModel } from '@/lib/ai/providers';
import { buildToolContext } from '@/lib/ai/situation-context';
import { buildGraphContext, writeToolDataServer } from '@/lib/ai/context-builder-server';
import { withAuth } from '@/lib/api/with-auth';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { handleRouteError } from '@/lib/api/standard-error';
import { searchWeb, formatResultsAsContext } from '@/lib/ai/firecrawl';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

const SanctionsScanSchema = z.object({
  updates: z.array(
    z.object({
      entity: z.string().describe('Name of the sanctioned or potentially sanctioned entity'),
      changeType: z.enum(['new_designation', 'delisting', 'modification', 'investigation', 'evasion_detected', 'no_change']).describe('Type of sanctions change'),
      source: z.string().describe('Source of this information (e.g., UNSC Committee, OFAC, EU Council)'),
      date: z.string().describe('Date of the sanctions update or report'),
      details: z.string().describe('Detailed description of the sanctions change and its implications'),
    })
  ).describe('Sanctions updates for the monitored entities'),
  analysis: z.string().describe('Cross-cutting analysis of sanctions trends, enforcement patterns, and strategic implications'),
  riskAssessment: z.string().describe('Risk assessment for sanctions evasion, compliance gaps, and recommendations for monitoring'),
});

// Static demo response
const DEMO_RESPONSE = {
  updates: [
    {
      entity: 'Government of Nordalia',
      changeType: 'modification' as const,
      source: 'UNSC Sanctions Committee, Panel of Experts interim report S/2025/892',
      date: 'February 2026',
      details: 'Panel of Experts documented continued arms flows to the AFN in probable violation of the UNSC arms embargo. Evidence includes satellite imagery of Karovian military transport aircraft at Nordalia City International Airport and end-user certificate discrepancies. Committee considering expanded asset freeze for three senior AFN procurement officials.',
    },
    {
      entity: 'Karovia Defence Industries (KDI)',
      changeType: 'investigation' as const,
      source: 'UNSC Panel of Experts; Conflict Armament Research field report',
      date: 'January 2026',
      details: 'Under investigation for circumventing the arms embargo through third-country transfer routing. Documented evidence of KDI-manufactured ammunition recovered in the Kessara corridor in December 2025, serial number analysis confirming post-embargo production.',
    },
    {
      entity: 'President Amara Osei',
      changeType: 'no_change' as const,
      source: 'Westmark unilateral sanctions list',
      date: 'March 2026',
      details: 'Remains on Westmark\'s targeted sanctions list (travel ban + asset freeze) since October 2024. No additional UNSC designation. AU has resisted calls for multilateral sanctions on the head of state, citing sovereignty concerns.',
    },
    {
      entity: 'DRM Financial Network',
      changeType: 'evasion_detected' as const,
      source: 'Financial Action Task Force (FATF) typology report',
      date: 'February 2026',
      details: 'FATF identified suspicious financial flows through Westmark-based diaspora organizations linked to DRM procurement. Three wire transfer patterns flagged as potential sanctions evasion. Westmark financial intelligence unit conducting parallel investigation.',
    },
  ],
  analysis: 'The Nordalia sanctions regime is under significant stress from multiple directions. The arms embargo is being systematically circumvented by Karovia through direct military transfers and third-country routing. Westmark\'s unilateral sanctions create a fragmented enforcement landscape — targeted individuals can still operate through non-sanctioning jurisdictions. The DRM\'s financial network exploitation of diaspora channels represents an emerging compliance gap. The P5 split on Nordalia makes UNSC Committee action slow and politically constrained. Overall, the sanctions architecture is sound in design but deteriorating in implementation.',
  riskAssessment: 'HIGH RISK: Arms embargo enforcement is the critical weakness. Without improved monitoring of Karovian logistics flights and third-country transfer routes, military capability accumulation will continue to lower the escalation threshold. MEDIUM RISK: Financial sanctions evasion through informal value transfer systems and diaspora networks requires enhanced financial intelligence cooperation between Westmark and regional financial centres. RECOMMENDATION: Priority should be on enforcement of existing measures rather than expansion — particularly strengthening the Panel of Experts\' investigation capacity and implementing the maritime and aviation monitoring recommendations from the interim report.',
};

export const POST = withAuth(async (request, _user) => {
  try {
    const { entities, conflictContext, situation } = await request.json() as {
      entities: string[];
      conflictContext?: string;
      situation?: Situation;
    };
    const sitContext = situation ? buildToolContext(situation) : '';

    // --- Demo mode ---
    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_RESPONSE);
    }

    // --- Credit check ---
    const creditCheck = await checkAndDeductCredits('ai_sanctions_scan', 'Sanctions scan');
    if (!creditCheck.allowed) return creditCheck.response;

    // --- Web search ---
    const searchResults = await searchWeb(
      `sanctions ${entities.join(' ')} latest`,
      { numResults: 5 }
    );
    const webContext = formatResultsAsContext(searchResults);

    // --- AI analysis ---
    const result = await callProModel({
      output: Output.object({ schema: SanctionsScanSchema }),
      prompt: `${sitContext ? `${sitContext}\n\n` : ''}You are a senior sanctions compliance analyst. Monitor and analyze the latest sanctions developments for the following entities.

ENTITIES: ${entities.join(', ')}
${conflictContext ? `CONFLICT CONTEXT: ${conflictContext}` : ''}

LATEST INTELLIGENCE:
${webContext || 'No web results available. Base analysis on your training data and the conflict context provided.'}

For each entity, assess:
1. Any recent sanctions changes (new designations, delistings, modifications)
2. Investigations underway or sanctions evasion detected
3. Source attribution and dates

Then provide:
- A cross-cutting analysis of sanctions trends and enforcement patterns
- A risk assessment covering evasion risks, compliance gaps, and monitoring recommendations

Cover UNSC, US (OFAC), EU, and any relevant regional sanctions regimes.`,
      system: 'You are a senior sanctions compliance analyst specializing in conflict-related sanctions regimes. Provide rigorous analysis for diplomatic and legal professionals. Always cite specific sanctions instruments, committee decisions, and enforcement actions.',
    });

    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'sanctions-scan');
  }
});
