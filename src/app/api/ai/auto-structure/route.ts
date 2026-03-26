import { streamText, stepCountIs } from 'ai';
import { getProModel } from '@/lib/ai/providers';
import { withAuth } from '@/lib/api/with-auth';
import { tacitusTools } from '@/lib/ai/tools';
import { scrapeMultiple } from '@/lib/ai/firecrawl';
import { updateSituation } from '@/lib/firebase/situations-service';
import { getAllDocumentText } from '@/lib/firebase/documents-service';
import { getSituationIntelligence } from '@/lib/data-feeds/feed-aggregator';

export const maxDuration = 120;

/**
 * Auto-Structure Pipeline
 *
 * Called after situation creation to automatically research and build
 * the initial conflict intelligence for a new situation. This is the
 * "PRAXIS magic moment" — the user creates a situation and PRAXIS
 * immediately starts populating it with structured intelligence.
 *
 * Pipeline phases:
 * 1. Web research on the situation (actors, events, dynamics)
 * 2. Structured actor analysis (positions, interests, leverage)
 * 3. Risk assessment and Glasl escalation stage
 * 4. Initial conflict graph entities (ACO primitives)
 * 5. Recommended next steps for the analyst
 */
export const POST = withAuth(async (req, user) => {
  if (user.isDemo) {
    return new Response(JSON.stringify({ error: 'Not available in demo mode' }), { status: 403 });
  }

  try {
    const {
      situationName, situationType, region, description, actors, userRole,
      situationId, urls, notes, documentIds,
    } = await req.json();

    if (!situationName?.trim()) {
      return new Response(JSON.stringify({ error: 'Situation name required' }), { status: 400 });
    }

    const actorList = (actors || []).join(', ') || 'not yet identified';

    // --- Gather supplementary context in parallel ---
    const contextSections: string[] = [];

    const gatherPromises: Promise<void>[] = [];

    // Scrape user-provided URLs
    if (urls?.length) {
      gatherPromises.push(
        scrapeMultiple(urls).then((results) => {
          const successful = results.filter((r) => r.success && r.content);
          if (successful.length) {
            const formatted = successful
              .map((r) => `### ${r.title || r.url}\nURL: ${r.url}\n\n${r.content.slice(0, 8000)}`)
              .join('\n\n---\n\n');
            contextSections.push(`\n\nUSER-PROVIDED SOURCE MATERIAL:\n${formatted}`);
          }
        }).catch(() => {})
      );
    }

    // Fetch uploaded document content
    if (situationId && user.uid) {
      gatherPromises.push(
        getAllDocumentText(user.uid, situationId, { maxChars: 15000 }).then((text) => {
          if (text.trim()) {
            contextSections.push(`\n\nUPLOADED DOCUMENTS:\n${text}`);
          }
        }).catch(() => {})
      );
    }

    // Fetch live intelligence feeds
    gatherPromises.push(
      getSituationIntelligence({ country: region || situationName, query: situationName, limit: 20 }).then((intel) => {
        if (intel.events.length > 0) {
          const feedItems = intel.events.slice(0, 10).map((e) =>
            `- [${e.source.toUpperCase()}] ${e.date || 'recent'}: ${e.title}${e.severity ? ` (severity: ${e.severity})` : ''}`
          ).join('\n');
          contextSections.push(`\n\nLIVE INTELLIGENCE FEED (${intel.events.length} items):\n${feedItems}`);
        }
      }).catch(() => {})
    );

    await Promise.all(gatherPromises);

    // User-provided analyst notes
    if (notes?.trim()) {
      contextSections.push(`\n\nANALYST NOTES PROVIDED BY USER:\n${notes}`);
    }

    const systemPrompt = `You are TACITUS, an elite conflict intelligence system. A user has just created a new situation and you must produce a comprehensive initial intelligence briefing.

Your task: research and structure "${situationName}" into actionable intelligence.

SITUATION CONTEXT:
- Name: ${situationName}
- Type: ${situationType || 'conflict'}
- Region: ${region || 'not specified'}
- Description: ${description || 'none provided'}
- Known actors: ${actorList}
- User role: ${userRole || 'analyst'}
${contextSections.join('\n')}

IMPORTANT: Use the webSearch tool to find current, real information about this situation. Do NOT fabricate or hallucinate details. If you cannot find information, say so clearly.

Generate your analysis in this EXACT structure:

## SITUATION OVERVIEW
[2-3 paragraph executive summary of the current state of this conflict/situation, grounded in real sources]

## KEY ACTORS & DYNAMICS
For each major actor (aim for 5-8):
### [Actor Name]
- **Type**: [State / Armed Group / International Org / Civil Society / External Power]
- **Position**: [What they publicly demand or advocate]
- **Interests**: [Underlying interests, including unstated ones]
- **Leverage**: [What power/influence they have and over whom]
- **Constraints**: [What limits their action]

## RELATIONSHIP MAP
[Describe the key relationships: alliances, rivalries, dependencies, patron-client ties]

## RISK ASSESSMENT
- **Current Glasl Escalation Stage**: [1-9, with justification]
- **Escalation Trend**: [Escalating / Stable / De-escalating]
- **Risk Score**: [1-10 with explanation]
- **Key Risk Factors**: [3-5 specific risk factors]
- **Window of Opportunity**: [If any exists, what is it and when does it close?]

## TIMELINE OF KEY EVENTS
[5-10 most important recent events in chronological order, with dates]

## RECOMMENDED ANALYST ACTIONS
[5 specific next steps the ${userRole} should take to deepen their understanding]

## SOURCES
[List all sources consulted, with dates]

Ground every claim in evidence. Flag uncertainty. Use UN diplomatic language standards.`;

    const result = streamText({
      model: getProModel(),
      system: systemPrompt,
      prompt: `Research and produce a complete initial intelligence briefing for: "${situationName}" in ${region || 'the relevant region'}. Use web search to find current, accurate information. Be thorough and cite your sources.`,
      tools: {
        webSearch: tacitusTools.webSearch,
      },
      stopWhen: stepCountIs(8),
      onFinish: async ({ text }) => {
        // Background: update situation metadata from the generated analysis
        if (!situationId || !user.uid) return;
        try {
          const updates: Record<string, unknown> = {};

          // Extract Glasl stage
          const glaslMatch = text.match(/Glasl Escalation Stage\**:\s*(\d)/i);
          if (glaslMatch) updates.glaslStage = parseInt(glaslMatch[1], 10);

          // Extract risk score
          const riskMatch = text.match(/Risk Score\**:\s*(\d+)/i);
          if (riskMatch) updates.riskScore = Math.min(10, parseInt(riskMatch[1], 10));

          // Extract escalation trend
          const trendMatch = text.match(/Escalation Trend\**:\s*(Escalating|Stable|De-escalating|Volatile)/i);
          if (trendMatch) {
            const raw = trendMatch[1].toLowerCase();
            updates.escalationTrend = raw === 'de-escalating' ? 'de-escalating' : raw;
          }

          // Count actors mentioned (### headings under KEY ACTORS)
          const actorSection = text.match(/## KEY ACTORS[\s\S]*?(?=\n## (?!#))/);
          if (actorSection) {
            const actorHeadings = actorSection[0].match(/### /g);
            if (actorHeadings) updates.actorCount = actorHeadings.length;
          }

          // Save the overview back to the situation description if it's richer
          const overviewMatch = text.match(/## SITUATION OVERVIEW\n+([\s\S]*?)(?=\n## )/);
          if (overviewMatch && overviewMatch[1].trim().length > (description?.length || 0)) {
            updates.description = overviewMatch[1].trim().slice(0, 5000);
          }

          if (Object.keys(updates).length > 0) {
            await updateSituation(user.uid, situationId, updates as Partial<import('@/types/situation').Situation>);
            console.log('[auto-structure] Updated situation metadata:', Object.keys(updates));
          }
        } catch (err) {
          console.error('[auto-structure] Failed to update situation metadata:', err);
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error('[auto-structure] Error:', err);
    return new Response(JSON.stringify({ error: 'Auto-structure failed' }), { status: 500 });
  }
});
