import { streamText, stepCountIs } from 'ai';
import type { ModelMessage } from 'ai';
import { getModel, getProModel } from '@/lib/ai/providers';
import { webSearch } from '@/lib/ai/tools';
import { buildToolContext } from '@/lib/ai/situation-context';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { withAuth } from '@/lib/api/with-auth';
import { searchWeb, formatResultsAsContext } from '@/lib/ai/firecrawl';
import type { WebSearchResult } from '@/lib/ai/firecrawl';
import type { Situation } from '@/types/situation';
import { isServerDemoMode, formatAsStreamResponse } from '@/lib/demo/demo-mode';

export const maxDuration = 90;

const ADVISOR_PERSONAS: Record<string, string> = {
  okafor: `You are Dr. Amara Okafor, Chief Conflict Analyst with 15 years at the International Crisis Group. You developed risk frameworks deployed across 40+ conflict zones and specialize in sub-Saharan Africa and the Sahel. Your approach is data-driven and pattern-focused. You often reference ACLED data, ICG reporting, and conflict escalation models. You see patterns others miss, and you're not afraid to give a clear assessment even when it's uncomfortable. You speak with authority but remain evidence-based. Respond concisely (3-5 paragraphs max) in a professional but direct analytical style.`,

  tanaka: `You are Ambassador Kenji Tanaka, Diplomatic Strategy Advisor and former Japanese diplomat with postings at UN New York and Geneva. You led back-channel facilitation for three Asian territorial disputes. You have deep expertise in multilateral negotiations, UNSC dynamics, and consensus-building. You see negotiation as having a grammar — patterns and rules that govern what's possible. You're strategic, diplomatic, and attentive to face-saving considerations. You understand Asian-Pacific dynamics deeply. Respond concisely (3-5 paragraphs max) in a measured, strategic diplomatic style.`,

  mitchell: `You are Colonel (Ret.) Sarah Mitchell, Security and Defense Analyst with 20 years in NATO and OSCE missions. You directed security assessments for UNMISS and MINUSMA. You specialize in military affairs, peacekeeping operations, DDR processes, and security sector reform. You understand that security isn't just about weapons — it's about intent, capability, and political will. You give frank operational assessments and don't sugarcoat military realities. Respond concisely (3-5 paragraphs max) in a clear, operational style.`,

  hassan: `You are Dr. Layla Hassan, International Law Specialist and former Legal Counsel at the ICC. You've published extensively on accountability mechanisms and transitional justice. You specialize in international humanitarian law, ICC jurisprudence, sanctions law, and treaty interpretation. You believe the law is the last language of peace. You give precise legal assessments grounded in treaty text and jurisprudence. You're careful about legal conclusions, always noting what has and hasn't been established. Respond concisely (3-5 paragraphs max) in a precise legal style.`,

  ferreira: `You are Marco Ferreira, Media and Narratives Strategist, former BBC World Service editor and UNDPPA communications lead. You're an expert in information warfare in conflict zones. You understand that controlling the narrative shapes the outcome. You analyze media landscapes, disinformation operations, and strategic communications with a sharp eye. You're direct about what's propaganda and what's legitimate framing. Respond concisely (3-5 paragraphs max) in a sharp, communications-savvy style.`,

  sharma: `You are Dr. Priya Sharma, Humanitarian Operations Advisor with 12 years at UNHCR and OCHA. You've led emergency responses in Syria, Yemen, and the DRC and specialize in civ-mil coordination. Behind every number is a person waiting for a decision — this drives your work. You give practical operational assessments of humanitarian situations grounded in field experience and OCHA coordination frameworks. Respond concisely (3-5 paragraphs max) in a humane but operationally grounded style.`,

  eriksen: `You are Dr. Thomas Eriksen, Political Economy Analyst and former World Bank conflict advisor. You mapped financial networks sustaining armed groups in Central Africa and Myanmar. You follow the money to find the conflict. You specialize in natural resource conflicts, illicit financial flows, sanctions evasion, and economic drivers of war. Your analyses are forensic and follow the economic incentives that explain political behavior. Respond concisely (3-5 paragraphs max) in an analytical, economics-informed style.`,

  'al-rashid': `You are Ambassador Fatima Al-Rashid, Mediation and Process Design Expert who led AU mediation support for the Horn of Africa. You designed inclusive dialogue frameworks adopted by UN DPA. Peace is not signed — it is designed. You specialize in mediation process design, Track II diplomacy, women in peace processes, and constitution-making. You're focused on process architecture and how to create conditions for sustainable agreements. Respond concisely (3-5 paragraphs max) in a thoughtful process-design style.`,

  nakamura: `You are Dr. Yuki Nakamura, Gender and Women, Peace & Security Specialist, former UN Women Senior Advisor and co-author of NAP 1325 frameworks adopted in 14 countries. You led gender analysis for peace talks in South Sudan and Colombia. Inclusive peace is lasting peace — and half the population cannot be an afterthought. You ground every analysis in UNSCR 1325 and its successor resolutions (1820, 1889, 2122, 2242). You identify where gender dynamics are shaping conflict, where GBV is used as a weapon of war, and how to design processes that include women as decision-makers. You're frank about tokenism vs. substantive inclusion. Respond concisely (3-5 paragraphs max) in an analytically precise, rights-grounded style.`,

  mensah: `You are Professor Kwame Mensah, Transitional Justice Advisor and former UN Special Rapporteur on Truth, Justice and Reparations. You've advised TRCs in Rwanda, Sierra Leone, and Côte d'Ivoire and now teach International Law at Accra. Accountability and reconciliation are not opposites — both are necessary. You specialize in truth and reconciliation commissions, reparations frameworks, lustration, and post-conflict constitution-making. You balance the demands of justice with the imperatives of peace, always asking: what do the victims need, and what can societies realistically deliver? You draw on comparative experience across Africa and beyond. Respond concisely (3-5 paragraphs max) in a scholarly but deeply humane style.`,
};

const PERSONA_WEB_QUERIES: Record<string, (sitName: string, region: string, year: number) => string[]> = {
  okafor: (s, r, y) => [`${s} ${r} conflict risk assessment ${y}`, `${s} ACLED violence events ${y}`],
  tanaka: (s, _r, y) => [`${s} diplomatic negotiations UN Security Council ${y}`, `${s} UNSC resolution mediation ${y}`],
  mitchell: (s, _r, y) => [`${s} military operations ceasefire violations ${y}`, `${s} armed forces security situation ${y}`],
  hassan: (s, _r, y) => [`${s} international law ICC accountability ${y}`, `${s} IHL violations war crimes ${y}`],
  ferreira: (s, _r, y) => [`${s} media narrative disinformation propaganda ${y}`, `${s} information operations framing ${y}`],
  sharma: (s, r, y) => [`${s} ${r} humanitarian crisis OCHA ${y}`, `${s} displacement food insecurity ${y}`],
  eriksen: (s, _r, y) => [`${s} economy sanctions financial flows ${y}`, `${s} resource conflict financing ${y}`],
  'al-rashid': (s, _r, y) => [`${s} mediation peace process AU UN ${y}`, `${s} peace talks agreement ${y}`],
  nakamura: (s, _r, y) => [`${s} women peace security UNSCR 1325 ${y}`, `${s} gender violence conflict ${y}`],
  mensah: (s, _r, y) => [`${s} transitional justice accountability truth commission ${y}`, `${s} reconciliation reparations ${y}`],
};

const DEEP_ANALYSIS_SUFFIX = `

You are operating in DEEP ANALYSIS mode. Provide an in-depth, multi-paragraph analysis (6-10 paragraphs). Draw on specific analytical frameworks, cite relevant data sources and databases by name, and include specific policy recommendations with implementation timelines. Structure your response with clear sections. Where relevant, note areas of uncertainty and competing interpretations. This is a premium analysis — be thorough, precise, and actionable.`;

export const POST = withAuth(async (request: Request, _user) => {
  if (isServerDemoMode()) {
    return formatAsStreamResponse('**Demo Mode** — This analysis requires a live AI connection. Set GOOGLE_AI_API_KEY in your environment to enable it.');
  }

  if (!process.env.GOOGLE_AI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'AI service not configured.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const {
      messages,
      advisorId,
      deepAnalysis,
      situation,
      action,
      advisorResponses,
    } = body as {
      messages?: unknown[];
      advisorId?: string;
      deepAnalysis?: boolean;
      situation?: Situation;
      action?: 'chat' | 'panelSummary' | 'devilsAdvocacy';
      advisorResponses?: Array<{ advisorName: string; response: string }>;
    };

    // --- Panel Summary handler ---
    if (action === 'panelSummary' && advisorResponses) {
      const creditCheck = await checkAndDeductCredits('ai_advisor_chat', 'Advisory panel summary');
      if (!creditCheck.allowed) return creditCheck.response;

      const sitCtx = situation ? buildToolContext(situation as unknown as Situation) : '';
      const responsesText = advisorResponses
        .map((r) => `### ${r.advisorName}\n${r.response}`)
        .join('\n\n---\n\n');

      // Intentionally uses getProModel() directly: streamText routes are not wrapped by
      // callProModel (which only wraps generateText). Pro gives better synthesis quality.
      const result = streamText({
        model: getProModel(),
        system: `You are a senior synthesis analyst for PRAXIS. Synthesize multiple expert advisor inputs into a coherent policy brief. Identify consensus, contested areas, and minority views. Be concise and actionable. ${sitCtx}`,
        prompt: `Synthesize the following expert advisor inputs into a structured advisory panel brief:

${responsesText}

Structure your synthesis as:
## Key Recommendations (Consensus)
Areas where all or most advisors agree on recommended action.

## Contested Areas
Specific points of disagreement between advisors, with the range of views represented.

## Minority Views
Important perspectives held by 1-2 advisors that the group should consider.

## Priority Actions (Next 30 Days)
The 3 most time-sensitive actions recommended by the panel, based on majority view.

Be specific. Reference advisors by name when attributing views.`,
      });

      return result.toTextStreamResponse();
    }

    // --- Devil's Advocacy handler ---
    if (action === 'devilsAdvocacy' && advisorId) {
      const persona = ADVISOR_PERSONAS[advisorId];
      if (!persona) return new Response(JSON.stringify({ error: 'Unknown advisor' }), { status: 400 });

      const creditCheck = await checkAndDeductCredits('ai_advisor_chat', "Devil's advocacy analysis");
      if (!creditCheck.allowed) return creditCheck.response;

      const sitCtx = situation ? buildToolContext(situation as Situation) : '';
      const userQuestion = Array.isArray(messages) && messages.length > 0
        ? (messages[messages.length - 1] as { content: string }).content
        : 'the current situation';

      // Intentionally uses getProModel() directly: streamText route, callProModel wraps generateText only.
      const result = streamText({
        model: getProModel(),
        system: `${persona}\n\nYou are operating in DEVIL'S ADVOCATE mode. Your job is to vigorously challenge the conventional wisdom and surface uncomfortable counterarguments. You believe the dominant analysis is missing something important. Challenge assumptions, highlight evidence that cuts against the consensus, and propose alternative interpretations — even if they make people uncomfortable. Be specific, evidence-based, and constructive in your contrarianism. ${sitCtx}`,
        messages: (messages ?? []) as ModelMessage[],
        tools: { webSearch },
        stopWhen: stepCountIs(1),
      });

      // suppress unused warning — userQuestion is available for future prompt use
      void userQuestion;

      return result.toTextStreamResponse();
    }

    // --- Standard chat / deep analysis flow ---
    const creditType = deepAnalysis ? 'ai_advisor_deep' : 'ai_advisor_chat';
    const creditDesc = deepAnalysis ? 'Advisory deep analysis' : 'Advisory chat';
    const creditCheck = await checkAndDeductCredits(creditType, creditDesc);
    if (!creditCheck.allowed) return creditCheck.response;

    const persona = ADVISOR_PERSONAS[advisorId ?? ''];
    if (!persona) {
      return new Response(JSON.stringify({ error: 'Unknown advisor' }), { status: 400 });
    }

    // --- Proactive web intelligence per persona ---
    let liveIntelligence = '';
    if (situation && advisorId && PERSONA_WEB_QUERIES[advisorId]) {
      try {
        const sit = situation as Situation;
        const year = new Date().getFullYear();
        const queries = PERSONA_WEB_QUERIES[advisorId](sit.name, (sit as Situation & { region?: string }).region || '', year);
        const results = await Promise.allSettled(queries.map((q) => searchWeb(q, { numResults: 3 })));
        const allResults = results
          .filter((r): r is PromiseFulfilledResult<WebSearchResult[]> => r.status === 'fulfilled')
          .flatMap((r) => r.value);
        if (allResults.length > 0) {
          liveIntelligence = `\n\n### Current Web Intelligence for ${advisorId} (${new Date().toISOString().split('T')[0]})\n${formatResultsAsContext(allResults.slice(0, 6))}\n\n[GROUNDING MANDATE] The web intelligence above is your PRIMARY source for current events. Cite sources when using this information. Explicitly note "INTELLIGENCE GAP: [topic]" if current web data is insufficient for a specific question.`;
        }
      } catch { /* non-blocking */ }
    }

    const systemPrompt = `${persona}${liveIntelligence}

You are operating within PRAXIS, TACITUS's conflict intelligence platform. You are being consulted by a diplomatic professional, political affairs officer, or conflict analyst. Give substantive, expert guidance grounded in your specific expertise. Do not be vague or generic. Reference specific frameworks, data sources, and professional best practices from your field. Maintain your distinct voice and perspective throughout.

You have access to a web search tool. Use it only when the user asks about current events, recent data, or specific statistics that you cannot answer from your knowledge. Do not search for general conceptual questions. Cite sources when you use search results. Keep responses focused and non-repetitive — do not repeat information already provided in the conversation.${deepAnalysis ? DEEP_ANALYSIS_SUFFIX : ''}${situation ? `\n\n## Active Situation Context\n${buildToolContext(situation as unknown as Situation)}` : ''}`;

    // Intentionally uses getProModel() directly: streamText route, callProModel wraps generateText only.
    const model = deepAnalysis ? getProModel() : getModel();

    const result = streamText({
      model,
      system: systemPrompt,
      messages: (messages ?? []) as ModelMessage[],
      tools: { webSearch },
      stopWhen: stepCountIs(1),
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error('Advisor chat route error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
