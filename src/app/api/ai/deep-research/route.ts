import { streamText, stepCountIs } from 'ai';
import { google } from '@ai-sdk/google';
import { checkAndDeductCredits } from '@/lib/api/with-credits';

export const maxDuration = 120;

type ResearchMode = 'briefing' | 'background' | 'media-scan' | 'actor-profile';
type ResearchDepth = 'quick' | 'standard' | 'comprehensive';

const MODE_PROMPTS: Record<ResearchMode, string> = {
  briefing: `You are preparing a DIPLOMATIC BRIEFING for a senior official. Structure your research as:

## Executive Summary
One paragraph with the most critical developments.

## Key Developments (last 48-72 hours)
Numbered list of verified developments with source citations.

## Analysis
What these developments mean for the conflict trajectory.

## Action Items / Watch Points
What the official should monitor or act upon.

## Sources & Reliability
Assessment of source quality and any information gaps.`,

  background: `You are conducting BACKGROUND RESEARCH for an analyst preparing a comprehensive report. Structure:

## Historical Context
Key milestones and root causes.

## Current Situation
Latest verified developments from multiple sources.

## Key Actors & Positions
Major parties and their stated/unstated interests.

## Conflict Dynamics
Escalation/de-escalation patterns, triggers, and constraints.

## Regional & International Dimensions
External actors, mediators, and institutional frameworks.

## Sources & Reliability Assessment
Detailed source evaluation with cross-referencing notes.`,

  'media-scan': `You are conducting a MEDIA LANDSCAPE SCAN to understand how different outlets are covering a topic. Structure:

## Coverage Overview
How many sources are covering this topic and from what angles.

## Narrative Frames
Identify the 3-5 dominant narrative frames being used.

## Source-by-Source Assessment
For each major source found, note: outlet name, date, headline/angle, reliability assessment.

## Divergence Points
Where do sources disagree? What claims are contested?

## Information Gaps
What aspects of this topic are under-reported?

## Sentiment Analysis
Overall tone across sources — hawkish/dovish, alarmist/measured, etc.`,

  'actor-profile': `You are building a COMPREHENSIVE ACTOR PROFILE. Structure:

## Actor Overview
Name, type, leadership, and organizational structure.

## Stated Positions & Interests
Official positions as documented in public statements.

## Assessed Interests & Red Lines
Analytical assessment based on behavior patterns.

## Alliances & Relationships
Key partnerships, rivalries, and dependencies.

## Capabilities & Resources
Military, economic, diplomatic, and informational capabilities.

## Recent Actions & Statements
Chronological summary of recent significant actions.

## Sources
Cite all sources used with reliability assessment.`,
};

export async function POST(request: Request) {
  if (!process.env.GOOGLE_AI_API_KEY) {
    return new Response(JSON.stringify({ error: 'AI not configured. Set GOOGLE_AI_API_KEY.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const {
      query,
      mode = 'briefing',
      depth = 'standard',
      conflictContext,
    }: {
      query: string;
      mode?: ResearchMode;
      depth?: ResearchDepth;
      conflictContext?: string;
    } = body;

    const creditCheck = await checkAndDeductCredits('ai_deep_research', 'Deep research');
    if (!creditCheck.allowed) return creditCheck.response;

    const stepLimit = depth === 'quick' ? 3 : depth === 'comprehensive' ? 8 : 5;

    const modePrompt = MODE_PROMPTS[mode] || MODE_PROMPTS.briefing;

    const result = streamText({
      model: google('gemini-2.5-flash'),
      tools: {
        google_search: google.tools.googleSearch({}),
      },
      stopWhen: stepCountIs(stepLimit),
      system: `You are the PRAXIS Deep Research Engine, a conflict intelligence research system with access to Google Search for real-time information gathering.

## Research Mode: ${mode.toUpperCase()}
## Research Depth: ${depth.toUpperCase()} (${stepLimit} search passes maximum)

${modePrompt}

## Core Research Principles
1. ALWAYS search for the most recent information first
2. Cite EVERY claim with source name and date: "[Reuters, 2026-03-10]: ..."
3. Cross-reference claims across AT LEAST 2 independent sources before treating as confirmed
4. Distinguish clearly between: wire services (highest reliability), quality broadsheets, state media (note government alignment), and think tanks
5. Flag any single-source claims that could not be independently verified
6. Note time-sensitivity: is this information likely to change within hours/days?
7. Identify critical information gaps — what SHOULD be known but isn't?
8. When sources conflict, present both versions and assess which is more credible

${conflictContext ? `## Current Analytical Context\n${conflictContext}` : ''}

## Quality Standards
- Never present speculation as fact
- Distinguish between "confirmed by multiple sources", "reported by single credible source", and "alleged/unverified"
- Use diplomatic language — avoid editorializing
- Note the publication date of every source cited`,
      prompt: query,
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error('Deep research route error:', err);
    return new Response(JSON.stringify({ error: 'Research request failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
