/**
 * Prompts for media analysis tasks in TACITUS.
 * Used for source assessment, coverage comparison, and narrative analysis.
 */

// ============================================================================
// Media Source Analysis Prompt
// ============================================================================

export const MEDIA_SOURCE_ANALYSIS_PROMPT = `You are conducting a media source analysis for the TACITUS system. Your task is to assess the positioning, reliability, and editorial characteristics of a given media source.

## Assessment Framework

Evaluate the source across these dimensions:

### 1. Ownership and Funding
- Who owns or funds this outlet?
- Is it state-funded, privately owned, publicly funded, or independent?
- Does the funding model create potential conflicts of interest?

### 2. Political Positioning
- Where does this source sit on the political spectrum?
- Does it have a consistent editorial line?
- Is it associated with any political movement, party, or ideology?

### 3. Reliability
- What is the source's track record for factual accuracy?
- Does it correct errors promptly?
- Does it distinguish clearly between news and opinion?
- Does it use named sources and verifiable information?

### 4. Editorial Independence
- How independent is the editorial team from ownership/state influence?
- Are there documented instances of editorial interference?
- Does the source publish content critical of its own government/owners?

### 5. Known Biases
- What systematic biases have been identified?
- How does geographic location affect coverage?
- Are certain topics or regions covered disproportionately?

### 6. Coverage Strengths
- What topics or regions does this source cover particularly well?
- Does it have unique access or expertise in certain areas?
- What is its investigative capacity?

## Output Format
Provide a structured assessment with:
- Overall reliability rating (0-1 scale)
- Political orientation (-1 left to +1 right)
- Editorial independence rating (0-1 scale)
- Summary narrative assessment
- Specific recommendations for how analysts should contextually read this source`;

// ============================================================================
// Media Coverage Comparison Prompt
// ============================================================================

export const MEDIA_COVERAGE_COMPARISON_PROMPT = `You are conducting a comparative media analysis for the TACITUS system. Your task is to compare how multiple media sources cover the same topic or event, identifying patterns of convergence, divergence, and omission.

## Comparison Framework

For each source, analyze:

### 1. Framing
- How does the source frame the issue? (security, humanitarian, political, economic)
- What metaphors and language choices shape the narrative?
- Who is portrayed as the protagonist/antagonist?

### 2. Source Attribution
- What sources does the article cite?
- Are government sources balanced with opposition/civil society voices?
- Are affected populations given voice?

### 3. Context
- What historical context is provided or omitted?
- How does the article situate the event within broader dynamics?
- Are root causes addressed or is the focus on immediate events?

### 4. Tone
- Is the tone neutral, sympathetic, critical, alarmist, or dismissive?
- Does the tone differ in headlines versus body text?
- Is emotional language used?

### 5. Omissions
- What significant facts or perspectives are missing?
- Are certain actors or viewpoints excluded?
- Are humanitarian dimensions adequately covered?

## Cross-Source Analysis
After analyzing each source individually, provide:
- **Convergence points**: Facts and assessments consistent across sources
- **Divergence points**: Where sources disagree or present different narratives
- **Notable omissions**: Important aspects missed by most or all sources
- **Recommended reading strategy**: How to combine sources for a comprehensive picture
- **Bias alerts**: Where known source biases are most likely affecting coverage`;

// ============================================================================
// Narrative Analysis Prompt
// ============================================================================

export const NARRATIVE_ANALYSIS_PROMPT = `You are conducting a narrative analysis for the TACITUS system. Your task is to identify and deconstruct the dominant narratives being deployed by actors in a conflict.

## Narrative Deconstruction Framework

For each narrative identified, analyze:

### 1. Core Message
- What is the central claim or storyline?
- What emotions does it seek to evoke?
- What action or response does it seek to generate?

### 2. Narrator and Audience
- Who is promoting this narrative?
- Who is the target audience (domestic, international, specific actor)?
- Through what channels is it being disseminated?

### 3. Evidence and Logic
- What evidence supports the narrative?
- What logical structure underlies it?
- What facts are selectively emphasized or omitted?

### 4. Historical and Cultural Context
- What historical references or cultural symbols does it invoke?
- How does it connect to existing identity narratives?
- Does it draw on precedent or established frameworks?

### 5. Counter-Narratives
- What narratives compete with or contradict this one?
- How effective are counter-narratives?
- Where are the points of narrative contestation?

### 6. Impact Assessment
- How widely is this narrative accepted?
- Is it influencing policy decisions or public opinion?
- Is it escalatory or de-escalatory in effect?

## Output Format
Present findings as a structured narrative map showing:
- Key narratives and their proponents
- Relationships between narratives (supporting, competing, undermining)
- Assessment of narrative effectiveness and trajectory
- Implications for mediation and conflict resolution efforts`;

// ============================================================================
// Media Bias Detection Prompt
// ============================================================================

export const MEDIA_BIAS_DETECTION_PROMPT = `Analyze the following text for indicators of media bias. Examine:

1. **Selection bias**: What events, facts, or perspectives are included or excluded?
2. **Framing bias**: How is the issue framed? What assumptions underlie the framing?
3. **Language bias**: Are loaded words, euphemisms, or dysphemisms used?
4. **Source bias**: Whose voices are amplified? Whose are marginalized?
5. **Placement bias**: What is emphasized through headlines, lead paragraphs, and visual elements?
6. **Commission/omission**: What facts are presented? What significant facts are missing?

Rate each bias indicator on a scale of 0 (no bias detected) to 1 (strong bias detected).
Provide specific examples from the text for each finding.
Offer an overall bias assessment and contextual reading recommendation.`;
