import { streamText, stepCountIs } from 'ai';
import { getModel } from '@/lib/ai/providers';
import { isServerDemoMode } from '@/lib/compat/sample-mode';
import { withCalibration } from '@/lib/api/with-calibration';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { tacitusTools } from '@/lib/ai/tools';
import { scrapeUrl, scrapeMultiple, searchWeb, isGroundedSearchConfigured } from '@/lib/ai/grounded-research';
import { updateSituationAdmin, getSituationAdmin } from '@/lib/firebase/situations';
import { getAllDocumentText } from '@/lib/firebase/documents-service';
import { getSituationIntelligence } from '@/lib/data-feeds/feed-aggregator';
import { countryNameToIso3 } from '@/lib/data-feeds/hdx-client';
import { getEconomicSnapshot } from '@/lib/data-feeds/worldbank-client';
import { initializeSituationTools } from '@/lib/services/situation-initializer';
import { runCanonicalPreCheck, formatPreCheckContext } from '@/lib/services/canonical-precheck';
import { saveToolData } from '@/lib/firebase/tool-data-service';

// Source category search term definitions (mirrors UI in situations/new)
const CATEGORY_SEARCH_TERMS: Record<string, string> = {
  'conflict-security': 'armed conflict violence escalation ceasefire security forces',
  'humanitarian': 'humanitarian crisis displacement refugees civilians protection',
  'diplomatic-official': 'diplomatic negotiations peace talks UN senior diplomatic forum resolution',
  'news-media': 'latest news developments situation update today',
  'think-tanks': 'analysis policy brief expert assessment scenario outlook',
  'military-intelligence': 'military forces weapons capabilities troop movements armed groups',
  'economic-development': 'economic sanctions poverty development GDP trade',
};

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
export const POST = withCalibration('auto_structure', 'ai_analysis', {
  retrievalQuery: (_req, body) => {
    const name = typeof body.situationName === 'string' ? body.situationName : '';
    const region = typeof body.region === 'string' ? body.region : '';
    return [name, region].filter(Boolean).join(' — ') || undefined;
  },
})(async (req, user) => {
  if (user.isDemo || isServerDemoMode()) {
    return new Response(JSON.stringify({ error: 'Not available for this session' }), { status: 403 });
  }

  try {
    const {
      situationName, situationType, region, description, actors, userRole,
      situationId, urls, notes, selectedSources,
    } = await req.json();

    if (!situationName?.trim()) {
      return new Response(JSON.stringify({ error: 'Situation name required' }), { status: 400 });
    }

    // Credits + profile gate already handled by withCalibration above.

    const actorList = (actors || []).join(', ') || 'not yet identified';
    const searchQuery = `${situationName}${region ? ` ${region}` : ''}`;
    const groundedSearchAvailable = isGroundedSearchConfigured();

    // --- Gather supplementary context ---
    const contextSections: string[] = [];
    const gatherPromises: Promise<void>[] = [];

    // Phase 0: Canonical pre-check — validate current events via Google Search grounding
    // This prevents the system from generating analysis based on outdated info
    // (e.g., referring to leaders who have been deposed, ceasefires that collapsed)
    gatherPromises.push(
      runCanonicalPreCheck({
        situationName,
        region,
        actors: actors || [],
        description,
      }).then((preCheck) => {
        const preCheckContext = formatPreCheckContext(preCheck);
        // Prepend so ground truth appears first in context
        contextSections.unshift(preCheckContext);

        // Save pre-check results to Firestore for tool pages to reference
        if (situationId && user.uid) {
          saveToolData(user.uid, situationId, 'canonical-precheck', preCheck).catch(() => {});
        }

        // Update situation metadata with verified current info
        if (situationId && user.uid && (preCheck.currentLeadership || preCheck.currentStatus)) {
          updateSituationAdmin(user.uid, situationId, {
            canonicalPreCheck: {
              currentLeadership: preCheck.currentLeadership ?? undefined,
              currentStatus: preCheck.currentStatus ?? undefined,
              lastMajorEvent: preCheck.lastMajorEvent ?? undefined,
              correctionCount: preCheck.groundTruth.length,
              checkedAt: preCheck.checkedAt,
            },
          }).catch(() => {});
        }
      }).catch((err) => {
        console.warn('[auto-structure] Canonical pre-check failed, continuing without:', err);
      })
    );

    // Phase 1: Wikipedia always first — canonical background context
    gatherPromises.push(
      (async () => {
        const wikiSlug = encodeURIComponent(situationName.replace(/\s+/g, '_'));
        const wikiResult = await scrapeUrl(`https://en.wikipedia.org/wiki/${wikiSlug}`).catch(() => null);
        if (wikiResult?.success && wikiResult.content) {
          contextSections.push(`\n\nWIKIPEDIA (primary background):\n${wikiResult.content.slice(0, 6000)}`);
        } else if (region) {
          // Fallback: try the region article
          const regionSlug = encodeURIComponent(region.replace(/\s+/g, '_'));
          const regionResult = await scrapeUrl(`https://en.wikipedia.org/wiki/${regionSlug}`).catch(() => null);
          if (regionResult?.success && regionResult.content) {
            contextSections.push(`\n\nWIKIPEDIA (region background):\n${regionResult.content.slice(0, 4000)}`);
          }
        }
      })()
    );

    // Phase 2: Grounded Search searches per selected source category (cap total at ~12,000 chars)
    if (groundedSearchAvailable && Array.isArray(selectedSources) && selectedSources.length > 0) {
      const categoriesToSearch = selectedSources
        .filter((id: string) => id !== 'foundational' && CATEGORY_SEARCH_TERMS[id])
        .slice(0, 5); // max 5 categories to stay within limits

      for (const catId of categoriesToSearch) {
        const terms = CATEGORY_SEARCH_TERMS[catId];
        gatherPromises.push(
          searchWeb(`${searchQuery} ${terms}`, { numResults: 3 }).then((results) => {
            if (results.length > 0) {
              const formatted = results
                .map((r) => `- ${r.title}: ${r.description || r.content.slice(0, 200) || r.url}`)
                .join('\n');
              const label = catId.replace(/-/g, ' ').toUpperCase();
              contextSections.push(`\n\n${label} SOURCES:\n${formatted}`);
            }
          }).catch(() => {})
        );
      }
    }

    // Phase 3: Scrape user-provided URLs
    if (urls?.length) {
      gatherPromises.push(
        scrapeMultiple(urls).then((results) => {
          const successful = results.filter((r) => r.success && r.content);
          if (successful.length) {
            const formatted = successful
              .map((r) => `### ${r.title || r.url}\nURL: ${r.url}\n\n${r.content.slice(0, 4000)}`)
              .join('\n\n---\n\n');
            contextSections.push(`\n\nUSER-PROVIDED SOURCE MATERIAL:\n${formatted}`);
          }
        }).catch(() => {})
      );
    }

    // Phase 4: Uploaded document content
    if (situationId && user.uid) {
      gatherPromises.push(
        getAllDocumentText(user.uid, situationId, { maxChars: 8000 }).then((text) => {
          if (text.trim()) {
            contextSections.push(`\n\nUPLOADED DOCUMENTS:\n${text}`);
          }
        }).catch(() => {})
      );
    }

    // Phase 5: Live intelligence feeds + World Bank economic data
    const countryIso3 = countryNameToIso3(region || situationName);

    gatherPromises.push(
      getSituationIntelligence({ country: region || situationName, query: situationName, limit: 20 }).then((intel) => {
        if (intel.events.length > 0) {
          const feedItems = intel.events.slice(0, 12).map((e) =>
            `- [${e.source.toUpperCase()}] ${e.date || 'recent'}: ${e.title}${e.severity ? ` (severity: ${e.severity})` : ''}`
          ).join('\n');
          contextSections.push(`\n\nLIVE INTELLIGENCE FEED (${intel.events.length} items):\n${feedItems}`);
        }
        // Include humanitarian snapshot if available
        if (intel.humanitarian) {
          const hum = intel.humanitarian;
          const parts: string[] = [];
          if (hum.displacement?.idps || hum.displacement?.refugees) {
            parts.push(`IDPs: ${(hum.displacement.idps || 0).toLocaleString()}, Refugees: ${(hum.displacement.refugees || 0).toLocaleString()}`);
          }
          if (hum.foodSecurity?.length) {
            const worst = hum.foodSecurity.reduce((a, b) => (parseInt(a.phase) > parseInt(b.phase) ? a : b));
            parts.push(`Food security: ${worst.pct}% of population in Phase ${worst.phase}`);
          }
          if (hum.funding?.required) {
            parts.push(`Humanitarian funding: ${hum.funding.pct}% of $${(hum.funding.required / 1e6).toFixed(0)}M required funded`);
          }
          if (parts.length > 0) {
            contextSections.push(`\n\nHUMANITARIAN SNAPSHOT:\n${parts.join('\n')}`);
          }
        }
        if (intel.stability) {
          contextSections.push(`\n\nSTABILITY INDEX: Score ${intel.stability.score}/10 (trend: ${intel.stability.trend})`);
        }
      }).catch(() => {})
    );

    // Phase 5b: World Bank economic indicators (free)
    if (countryIso3) {
      gatherPromises.push(
        getEconomicSnapshot(countryIso3).then((econ) => {
          const parts: string[] = [];
          if (econ.gdp?.value) parts.push(`GDP: $${(econ.gdp.value / 1e9).toFixed(1)}B (${econ.gdp.year})`);
          if (econ.inflation?.value) parts.push(`Inflation: ${econ.inflation.value.toFixed(1)}% (${econ.inflation.year})`);
          if (econ.militarySpending?.value) parts.push(`Military spending: ${econ.militarySpending.value.toFixed(1)}% of GDP`);
          if (parts.length > 0) {
            contextSections.push(`\n\nECONOMIC INDICATORS (World Bank):\n${parts.join('\n')}`);
          }
        }).catch(() => {})
      );
    }

    await Promise.all(gatherPromises);

    // Cap total context at ~20,000 chars to stay within model limits
    const rawContext = contextSections.join('\n');
    const cappedContext = rawContext.slice(0, 20000);

    // Analyst notes appended last
    const notesSection = notes?.trim() ? `\n\nANALYST NOTES:\n${notes}` : '';

    // Calibrated analyst-profile + situation-frame + output-constraints
    const { systemPromptBlock, outputConstraints, provenance } = user.calibration;
    const langDirective = outputConstraints.language !== 'en'
      ? `\n\nRESPOND IN: ${outputConstraints.language.toUpperCase()}.`
      : '';
    const redLineDirective = outputConstraints.redLineClauses.length
      ? `\n\nRED LINES — DO NOT:\n${outputConstraints.redLineClauses.map(r => `  - ${r}`).join('\n')}`
      : '';

    const systemPrompt = `${systemPromptBlock}${langDirective}${redLineDirective}

You are TACITUS, an elite conflict intelligence system built on the ACO (Actor-Claim-Ontology) v2.0 framework. A user has just created a situation and you must produce a comprehensive initial intelligence briefing that will seed all conflict analysis tools.

SITUATION CONTEXT:
- Name: ${situationName}
- Type: ${situationType || 'conflict'}
- Region: ${region || 'not specified'}
- Description: ${description || 'none provided'}
- Known actors: ${actorList}
- User role: ${userRole || 'analyst'}
${cappedContext}${notesSection}

ACO v2.0 ENTITIES — Structure your analysis around ALL 14 types:

Core 8 Primitives:
  Actor (state, armed_group, non_state, individual, international_org, civil_society)
  Claim (territorial, legal, political, economic, identity, self_determination)
  Interest (stated, unstated, security, economic, identity, survival)
  Constraint (legal, political, resource, temporal, normative, geographic)
  Leverage (military, economic, diplomatic, informational, moral, territorial)
  Commitment (ceasefire, treaty, verbal, written, binding, conditional)
  Event (military, diplomatic, humanitarian, political, protest, election)
  Narrative (media, propaganda, historical, identity, victimhood, liberation)

Extended 6 (first-class in v2.0):
  Institution (government, judiciary, military, international_org, traditional, religious)
  Norm (legal, customary, religious, ethical, IHL)
  Resource (natural, financial, human, strategic, informational, territory)
  Risk (security, humanitarian, political, economic, environmental)
  Policy (sanctions, peace_plan, military, humanitarian, governance)
  Grievance (identity, economic, political, historical, territorial, security)

Theoretical Grounding:
  Fisher-Ury: Position→Interest→Need hierarchy (Claim→Interest→Grievance)
  Glasl: 9-stage escalation model (Event sequences + escalation dynamics)
  Burton: Basic Human Needs theory (Grievance as unmet need driver)
  Galtung: Structural violence (Resource/Institution/Norm triad)
  Lederach: Multi-level peacebuilding (Actor→Institution mapping)
  Zartman: Ripeness theory (Commitment/Constraint windows)
  Stedman: Spoiler theory (Actor leverage/commitment dynamics)

CRITICAL: The CANONICAL GROUND TRUTH section above (if present) contains VERIFIED current information from web search. You MUST use this information and NEVER contradict it. If the ground truth says a leader has been deposed, do NOT refer to them as current leader. If the ground truth says a ceasefire has collapsed, do NOT describe it as holding. The ground truth OVERRIDES your training data.

IMPORTANT: Use the webSearch tool ONCE for current developments if needed. Do NOT fabricate details. Flag uncertainty. Do NOT repeat yourself.

Generate your analysis in this EXACT structure:

## SITUATION OVERVIEW
[2-3 paragraph executive summary grounded in sources above + web search if needed]

## KEY ACTORS & DYNAMICS
For each major actor (aim for 5 to 8):
### [Actor Name]
- **Type**: [State / Armed Group / International Org / Civil Society / External Power]
- **Position**: [What they publicly demand or advocate — Claim]
- **Interests**: [Underlying interests, including unstated ones — Interest]
- **Leverage**: [What power/influence they have and over whom — Leverage]
- **Constraints**: [What limits their action — Constraint]
- **Narrative**: [How they frame the conflict — Narrative]

## RELATIONSHIP MAP
[Key relationships: alliances, rivalries, dependencies, patron-client ties — include Commitments and Norms where relevant]

## RISK ASSESSMENT
- **Current Glasl Escalation Stage**: [1-9, with justification]
- **Escalation Trend**: [Escalating / Stable / De-escalating]
- **Risk Score**: [1-10 with explanation]
- **Key Risk Factors**: [3-5 specific risk factors — map to ACO Risks and Grievances]
- **Window of Opportunity**: [If any exists, what is it and when does it close?]

## TIMELINE OF KEY EVENTS
[5-10 most important recent events in chronological order, with dates — ACO Events]

## RESOURCES & ECONOMIC DRIVERS
[Key resources, economic interests, and financial flows driving the conflict — ACO Resources + Policies]

## INSTITUTIONAL LANDSCAPE
[Key institutions (formal and informal) that shape the conflict — governments, courts, international orgs, traditional structures. Map their legitimacy, capacity, and relationships — ACO Institutions]

## NORMS & LEGAL FRAMEWORK
[Applicable international law, formal resolutions, customary norms, and contested rules of engagement — ACO Norms]

## GRIEVANCES & ROOT CAUSES
[Underlying grievances driving conflict motivation — unmet needs, historical injustices, identity threats, economic deprivation. Use Burton's Basic Human Needs framework — ACO Grievances]

## RECOMMENDED ANALYST ACTIONS
[5 specific next steps the ${userRole} should take]

## SOURCES
[List all sources consulted]

Ground every claim in the pre-scraped context above first, then use web search only for missing current details. Use professional diplomatic language standards.`;

    // Use Flash for the first-value situation build. This route is fired in the
    // background after creation, so reliability beats Pro-only depth here.
    const result = streamText({
      model: getModel(),
      system: systemPrompt,
      prompt: `Research and produce a complete initial intelligence briefing for: "${situationName}" in ${region || 'the relevant region'}. Use web search to find current, accurate information. Be thorough and cite your sources.`,
      tools: {
        webSearch: tacitusTools.webSearch,
      },
      stopWhen: stepCountIs(2),
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
            await updateSituationAdmin(user.uid, situationId, updates as Partial<import('@/types/situation').Situation>);
            console.log('[auto-structure] Updated situation metadata:', Object.keys(updates));
          }

          // Persist the raw briefing text with profile-version provenance
          await saveToolOutput({
            uid: user.uid,
            situationId,
            toolId: 'auto_structure',
            profileVersion: provenance.profileVersion,
            output: { briefing: text, updates },
          }).catch((err) => console.warn('[auto-structure] saveToolOutput failed:', err));

          // Seed all tool-data subcollections from the auto-structure output
          const updatedSituation = await getSituationAdmin(user.uid, situationId);
          if (updatedSituation) {
            initializeSituationTools(user.uid, situationId, updatedSituation, text)
              .then(({ seeded, failed }) => {
                console.log(`[auto-structure] Tool init complete: ${seeded.length} seeded, ${failed.length} failed`);
              })
              .catch((err) => console.error('[auto-structure] Tool init error:', err));
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
