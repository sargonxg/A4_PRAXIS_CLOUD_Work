/**
 * Prompts for report section generation, organized by template type.
 * Each template has specific structural and tonal requirements.
 */

// ============================================================================
// Base Report Generation Prompt
// ============================================================================

export const BASE_REPORT_PROMPT = `You are generating a section of a diplomatic report using the TACITUS system. Follow these guidelines:

1. **Accuracy**: Base all statements on provided context and conflict graph data. Do not fabricate facts.
2. **Attribution**: Clearly attribute claims and assessments. Use phrases like "according to," "reports indicate," "it is assessed that."
3. **Balance**: Present multiple perspectives where relevant. Avoid language that favors any party.
4. **Hedging**: Calibrate certainty language to evidence quality. Use "reportedly," "allegedly," "appears to" for unverified claims.
5. **Structure**: Follow the structural conventions of the specific template type.
6. **Citations**: Reference source documents, UN resolutions, and conflict graph data where applicable.`;

// ============================================================================
// Secretary-General's Report
// ============================================================================

export const SG_REPORT_PROMPTS: Record<string, string> = {
  introduction: `${BASE_REPORT_PROMPT}

Draft the Introduction section for a Secretary-General's Report. This section should:
- Reference the mandate (resolution number, General Assembly/Security Council request)
- State the reporting period
- Provide a one-paragraph overview of the situation during the reporting period
- Note the methodology and sources of information
- Maintain the authoritative but balanced voice of the Secretary-General's office

Format: 2-4 paragraphs. Formal UN report style. Third person ("The Secretary-General presents...").`,

  political_developments: `${BASE_REPORT_PROMPT}

Draft the Political Developments section for a Secretary-General's Report. This section should:
- Cover key political events during the reporting period in chronological order
- Address government actions, opposition activities, and political processes
- Include election developments, constitutional processes, or governance changes
- Note the positions and actions of key political actors
- Reference any political agreements, dialogues, or negotiations

Format: 4-8 paragraphs organized chronologically or thematically. Maintain factual, non-judgmental tone.`,

  security_situation: `${BASE_REPORT_PROMPT}

Draft the Security Situation section for a Secretary-General's Report. This section should:
- Assess the overall security environment and trends (improving/deteriorating/stable)
- Report on significant security incidents with appropriate specificity
- Address the activities of armed groups and security forces
- Cover ceasefire compliance where applicable
- Note threats to civilians and UN personnel

Format: 4-8 paragraphs. Use precise language for security events. Avoid inflammatory descriptions.`,

  humanitarian_situation: `${BASE_REPORT_PROMPT}

Draft the Humanitarian Situation section for a Secretary-General's Report. This section should:
- Present current humanitarian indicators (displacement, food security, health)
- Report on humanitarian access and constraints
- Cover the response of humanitarian actors
- Address protection of civilians concerns
- Note funding gaps and resource requirements

Format: 3-6 paragraphs. Cite humanitarian data sources (OCHA, UNHCR, WFP, etc.) where available.`,

  human_rights: `${BASE_REPORT_PROMPT}

Draft the Human Rights section for a Secretary-General's Report. This section should:
- Report on documented human rights violations and abuses
- Address accountability and transitional justice developments
- Cover the work of human rights monitoring bodies
- Note patterns and trends in human rights conditions
- Reference applicable international human rights and humanitarian law

Format: 3-6 paragraphs. Use precise legal terminology. Distinguish between violations (by state actors) and abuses (by non-state actors).`,

  observations_recommendations: `${BASE_REPORT_PROMPT}

Draft the Observations and Recommendations section for a Secretary-General's Report. This section should:
- Synthesize key trends and dynamics from the preceding sections
- Provide the Secretary-General's assessment of the situation
- Offer specific, actionable recommendations to the relevant UN body
- Address both immediate priorities and longer-term objectives
- Maintain a forward-looking, solution-oriented perspective

Format: 4-8 paragraphs. The tone shifts from purely descriptive to analytical and prescriptive. Recommendations should be numbered and specific.`,
};

// ============================================================================
// Security Council Briefing Note
// ============================================================================

export const SC_BRIEFING_PROMPTS: Record<string, string> = {
  situation_overview: `${BASE_REPORT_PROMPT}

Draft the Situation Overview for a Security Council Briefing Note. This section should:
- Provide a concise, high-level summary of the current situation
- Highlight the most significant developments since the last briefing
- Identify the key issues requiring Council attention
- Set the context for the detailed analysis that follows

Format: 2-3 paragraphs. Concise, direct, and focused on what the Council needs to know.`,

  key_developments: `${BASE_REPORT_PROMPT}

Draft the Key Developments section for a Security Council Briefing Note. This section should:
- Present the 3-5 most significant developments
- Analyze their implications for peace, security, and stability
- Note the responses of relevant actors
- Flag any developments that may require Council action

Format: Organized by development, each with 1-2 paragraphs. Prioritize by significance.`,

  political_track: `${BASE_REPORT_PROMPT}

Draft the Political Track section for a Security Council Briefing Note. This section should:
- Update on peace process or political negotiations
- Report on mediation efforts and their outcomes
- Address implementation of any existing agreements
- Identify obstacles and opportunities in the political process

Format: 3-5 paragraphs. Focus on actionable political dynamics.`,

  risks_and_scenarios: `${BASE_REPORT_PROMPT}

Draft the Risks and Scenarios section for a Security Council Briefing Note. This section should:
- Identify the primary risks to peace and security
- Present 2-3 plausible scenarios for how the situation could evolve
- Assess the likelihood and implications of each scenario
- Note potential trigger events or tipping points

Format: Organized by risk or scenario. Use calibrated language for probability assessments.`,

  recommendations: `${BASE_REPORT_PROMPT}

Draft the Recommendations section for a Security Council Briefing Note. This section should:
- Present clear, actionable recommendations for the Council
- Prioritize recommendations by urgency and importance
- Link recommendations to specific risks or developments
- Note any resource or mandate implications

Format: Numbered list of 3-7 recommendations. Each should be specific and actionable.`,
};

// ============================================================================
// Political Analysis Cable
// ============================================================================

export const POLITICAL_CABLE_PROMPTS: Record<string, string> = {
  summary: `${BASE_REPORT_PROMPT}

Draft the Summary for a Political Analysis Cable. This section should:
- Provide a 2-3 sentence executive summary of the cable's content
- State the key analytical judgment or finding
- Indicate the significance and urgency

Format: 1 paragraph. Direct and concise. This is what senior officials will read first.`,

  analysis: `${BASE_REPORT_PROMPT}

Draft the Analysis section for a Political Analysis Cable. This section should:
- Present the detailed political analysis with supporting evidence
- Examine the motivations and calculations of key actors
- Assess the implications of recent developments
- Identify patterns and trends
- Note areas of uncertainty and competing interpretations

Format: 4-8 paragraphs. Analytical rather than descriptive. Include judgments with stated confidence levels.`,

  implications: `${BASE_REPORT_PROMPT}

Draft the Implications section for a Political Analysis Cable. This section should:
- Assess implications for the UN, regional stability, and key actors
- Identify potential second and third-order effects
- Note implications for ongoing peace processes or negotiations
- Address any implications for UN operations or personnel

Format: 3-5 paragraphs organized by stakeholder or dimension.`,

  action_required: `${BASE_REPORT_PROMPT}

Draft the Action Required section for a Political Analysis Cable. This section should:
- Specify what action, if any, is recommended
- Identify the decision-makers and timelines
- Note any preparatory steps needed
- Flag resource or authority requirements

Format: 1-3 paragraphs. Clear, specific, and action-oriented.`,
};

// ============================================================================
// Options Paper
// ============================================================================

export const OPTIONS_PAPER_PROMPTS: Record<string, string> = {
  background: `${BASE_REPORT_PROMPT}

Draft the Background section for an Options Paper. This section should:
- Provide the context necessary to understand the decision at hand
- Summarize the current situation and how it developed
- Identify the key stakeholders and their positions
- State the problem or decision that requires a response

Format: 3-5 paragraphs. Factual and objective. Set up the options analysis that follows.`,

  options_analysis: `${BASE_REPORT_PROMPT}

Draft the Options Analysis section for an Options Paper. This section should:
- Present 3-5 distinct policy options
- For each option, provide:
  - Description of the option
  - Advantages and opportunities
  - Risks and disadvantages
  - Resource and timeline implications
  - Likely reactions of key actors
- Ensure options represent a genuine range (status quo, moderate, ambitious)

Format: Structured by option. Use consistent formatting for comparison. Include a summary comparison table if helpful.`,

  recommendation: `${BASE_REPORT_PROMPT}

Draft the Recommendation section for an Options Paper. This section should:
- State the recommended course of action clearly
- Explain why it is preferred over the alternatives
- Identify the key risks and proposed mitigation measures
- Outline implementation steps and timeline
- Note any decisions required from leadership

Format: 2-4 paragraphs. Decisive but balanced. Acknowledge trade-offs.`,
};

// ============================================================================
// Conflict Assessment
// ============================================================================

export const CONFLICT_ASSESSMENT_PROMPTS: Record<string, string> = {
  conflict_profile: `${BASE_REPORT_PROMPT}

Draft the Conflict Profile section for a Conflict Assessment. This section should:
- Provide a comprehensive overview of the conflict
- Identify all significant actors and their roles
- Map the key relationships (alliances, rivalries, dependencies)
- Describe the geographic scope and affected populations
- Note the conflict's history and current phase

Format: 4-8 paragraphs. Structured analytically. Use Conflict Grammar categories.`,

  root_causes: `${BASE_REPORT_PROMPT}

Draft the Root Causes section for a Conflict Assessment. This section should:
- Identify structural, proximate, and triggering causes
- Distinguish between grievances and mobilization factors
- Assess the role of identity, resources, governance, and external actors
- Note how causes interact and reinforce each other
- Identify which causes are most amenable to intervention

Format: 4-6 paragraphs organized by cause category. Analytical and evidence-based.`,

  dynamics: `${BASE_REPORT_PROMPT}

Draft the Conflict Dynamics section for a Conflict Assessment. This section should:
- Analyze current conflict dynamics and escalatory/de-escalatory trends
- Map the leverage relationships between actors
- Identify spoilers and peace champions
- Assess the role of external actors and regional dynamics
- Evaluate the effectiveness of existing peace architecture

Format: 4-8 paragraphs. Focus on dynamic interactions rather than static descriptions.`,

  scenarios: `${BASE_REPORT_PROMPT}

Draft the Scenarios section for a Conflict Assessment. This section should:
- Present 3-4 plausible scenarios for the conflict's evolution
- Identify the key variables and drivers for each scenario
- Assess the likelihood and timeline for each scenario
- Note the indicators and warning signs to monitor
- Discuss the implications of each scenario for affected populations and the international community

Format: Organized by scenario. Each should include name, description, likelihood assessment, key drivers, and implications.`,

  entry_points: `${BASE_REPORT_PROMPT}

Draft the Entry Points for Engagement section for a Conflict Assessment. This section should:
- Identify opportunities for preventive action or peacebuilding
- Assess the comparative advantage of different actors (UN, regional, bilateral)
- Recommend specific areas for engagement
- Note enabling conditions and potential obstacles
- Prioritize recommendations by feasibility and impact

Format: 4-6 paragraphs with numbered recommendations. Practical and action-oriented.`,
};

// ============================================================================
// Prompt Selector
// ============================================================================

export type TemplateType =
  | 'sg_report'
  | 'sc_briefing'
  | 'political_cable'
  | 'options_paper'
  | 'conflict_assessment'
  | 'custom';

export function getReportPrompt(
  templateType: TemplateType,
  sectionId: string
): string {
  switch (templateType) {
    case 'sg_report':
      return SG_REPORT_PROMPTS[sectionId] || BASE_REPORT_PROMPT;
    case 'sc_briefing':
      return SC_BRIEFING_PROMPTS[sectionId] || BASE_REPORT_PROMPT;
    case 'political_cable':
      return POLITICAL_CABLE_PROMPTS[sectionId] || BASE_REPORT_PROMPT;
    case 'options_paper':
      return OPTIONS_PAPER_PROMPTS[sectionId] || BASE_REPORT_PROMPT;
    case 'conflict_assessment':
      return CONFLICT_ASSESSMENT_PROMPTS[sectionId] || BASE_REPORT_PROMPT;
    case 'custom':
      return BASE_REPORT_PROMPT;
    default:
      return BASE_REPORT_PROMPT;
  }
}
