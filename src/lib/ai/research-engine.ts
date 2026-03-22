/**
 * PRAXIS Research Engine
 *
 * Replaces Google Search grounding with Firecrawl-powered web intelligence.
 * Searches the web, scrapes full page content, and feeds it as context
 * to the AI model for synthesis and analysis.
 */

import { streamText, type LanguageModel } from 'ai';
import { searchWeb, scrapeMultiple, formatResultsAsContext, isFirecrawlConfigured, type WebSearchResult } from './firecrawl';
import { getModel, getProModel } from './providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ResearchMode = 'briefing' | 'background' | 'media-scan' | 'actor-profile';
export type ResearchDepth = 'quick' | 'standard' | 'comprehensive';

export interface ResearchParams {
  query: string;
  mode: ResearchMode;
  depth: ResearchDepth;
  conflictContext?: string;
  sources?: string[];       // Specific URLs to scrape
  model?: LanguageModel;    // Override model
}

// ---------------------------------------------------------------------------
// Mode-specific system prompts (reused from deep-research route)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Core Research Function
// ---------------------------------------------------------------------------

/**
 * Conducts web research using Firecrawl and returns a streaming AI response.
 *
 * Flow:
 * 1. Search the web (or scrape provided URLs)
 * 2. Collect full-page markdown content
 * 3. Feed content as context to AI model
 * 4. Return streaming analysis
 */
export async function conductResearch(params: ResearchParams) {
  const {
    query,
    mode,
    depth,
    conflictContext,
    sources,
    model,
  } = params;

  const numResults = depth === 'quick' ? 3 : depth === 'comprehensive' ? 8 : 5;

  // Step 1: Gather web content
  let webContent: WebSearchResult[] = [];

  if (sources && sources.length > 0) {
    // Scrape specific URLs the user provided
    const scraped = await scrapeMultiple(sources);
    webContent = scraped
      .filter((r) => r.success)
      .map((r) => ({
        title: r.title || r.url,
        url: r.url,
        content: r.content,
        description: r.description,
      }));
  }

  if (isFirecrawlConfigured()) {
    // Search the web for additional sources
    const searchResults = await searchWeb(query, { numResults });
    webContent = [...webContent, ...searchResults];
  }

  // Step 2: Format web content as context
  const webContext = formatResultsAsContext(webContent);
  const sourceSummary = webContent.length > 0
    ? `\n\nI found ${webContent.length} web sources. Here is the content from these sources:\n\n${webContext}`
    : '\n\nNo web sources were available for this query. Analyze based on your training knowledge and note that sources could not be independently verified.';

  // Step 3: Build the prompt
  const modePrompt = MODE_PROMPTS[mode] || MODE_PROMPTS.briefing;
  const selectedModel = model || (depth === 'comprehensive' ? getProModel() : getModel());

  const systemPrompt = `You are the PRAXIS Research Engine, a conflict intelligence research system.

## Research Mode: ${mode.toUpperCase()}
## Research Depth: ${depth.toUpperCase()}

${modePrompt}

## Core Research Principles
1. Cite EVERY claim with source name and date: "[Reuters, 2026-03-10]: ..."
2. Cross-reference claims across sources before treating as confirmed
3. Distinguish between: wire services (highest reliability), quality broadsheets, state media (note government alignment), and think tanks
4. Flag any single-source claims that could not be independently verified
5. Note time-sensitivity: is this information likely to change within hours/days?
6. Identify critical information gaps — what SHOULD be known but isn't?
7. When sources conflict, present both versions and assess which is more credible

${conflictContext ? `## Current Analytical Context\n${conflictContext}` : ''}

## Web Sources Available
${sourceSummary}

## Quality Standards
- Never present speculation as fact
- Distinguish between "confirmed by multiple sources", "reported by single credible source", and "alleged/unverified"
- Use diplomatic language — avoid editorializing
- Note the publication date of every source cited`;

  // Step 4: Stream the analysis
  const result = streamText({
    model: selectedModel,
    system: systemPrompt,
    prompt: query,
  });

  return result;
}

/**
 * Quick search: returns raw web results without AI analysis.
 * Useful for getting URLs and content for other tools.
 */
export async function quickSearch(query: string, numResults = 5): Promise<WebSearchResult[]> {
  if (!isFirecrawlConfigured()) return [];
  return searchWeb(query, { numResults });
}
