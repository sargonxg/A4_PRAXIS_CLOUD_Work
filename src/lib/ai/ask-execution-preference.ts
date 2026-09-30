/** Explicit turn instructions constrain automatic routing and actual execution.
 * Hard direct/no-agent instructions win over selected agents and Deep Research.
 * No-browse alone limits evidence; it still permits a local capsule agent.
 * Quoted examples and conceptual mentions are not execution instructions.
 */
export interface AskExecutionPreference {
  preferDirectAnswer: boolean;
  allowTools: boolean;
  allowExternalSources: boolean;
  suppliedContextOnly: boolean;
  allowWorkspaceRetrieval: boolean;
  routingPrompt: string;
}

/** Wrapper callbacks run before schema validation; retain only readable messages. */
export function readAskMessages(value: unknown): Array<{ role: string; content: unknown }> {
  return Array.isArray(value) ? value.filter((message): message is { role: string; content: unknown } =>
    typeof message === 'object' && message !== null && !Array.isArray(message) && typeof message.role === 'string') : [];
}

export function resolveAskExecutionPreference(prompt: string): AskExecutionPreference {
  const unquoted = prompt
    .replace(/```[\s\S]*?```/g, '')
    .replace(/"[^"\n]*"|“[^”\n]*”|‘[^’\n]*’|(?<!\w)'[^'\n]*'(?!\w)/g, '');
  let preferDirectAnswer = false;
  let allowTools = true;
  let allowExternalSources = true;
  let suppliedContextOnly = false;
  const routingClauses: string[] = [];
  for (const rawClause of unquoted.split(/[.!?;\n]+/)) {
    const clause = rawClause.trim().toLowerCase();
    if (!clause) continue;
    let routingClause = rawClause;
    const directive = clause.match(/^(?:please\s+)?(?:do not|don't|don’t|never)\s+(.+)$/);
    if (directive) {
      // A contrasting affirmative request remains routable, e.g. "Do not
      // browse, but research the attached documents."
      const [actions, ...affirmative] = directive[1].split(/\b(?:but|instead)\b/);
      const noAgents = /\b(?:dispatch|queue|start|run|launch|use|call)\s+(?:(?:any|an?|the|background|research|policy|external|separate)\s+)*(?:agents?|agent runs?|workers?)\b/.test(actions);
      // Match a prohibited invocation at the start of a listed action, not
      // conceptual mentions such as "Do not explain why teams run research."
      const researchRestrictions = actions.split(/\s*,\s*(?:(?:and|or)\s+)?|\s+(?:and|or)\s+/)
        .map((action) => action.trim().match(/^(?:run|do|perform|conduct)\s+((?:(?:any|new|additional|further|deep|background|external)\s+)*)research\b/))
        .filter((match) => match !== null);
      // External-only restrictions still permit expressly requested local research.
      const noResearch = researchRestrictions.some((match) => !/\bexternal\b/.test(match[1]));
      const noTools = /\b(?:use|call)\s+(?:any\s+|research\s+)?tools?\b/.test(actions);
      const noExternal = researchRestrictions.length > 0 || /\bbrowse\b|\b(?:search|fetch|use|access)\s+(?:(?:the|any|live|current)\s+)*(?:web|internet|external|online)\b/.test(actions);
      if (noAgents || noResearch || noTools || noExternal) {
        preferDirectAnswer ||= noAgents || noResearch || noTools;
        allowTools &&= !noTools;
        allowExternalSources &&= !noExternal && !noResearch && !noTools;
        routingClauses.push(...affirmative);
        continue;
      }
    }
    // Follow-up instructions often put the restriction after the requested
    // action: "Answer briefly, without browsing or agent runs."
    const without = clause.match(/^(?:please\s+)?(?:answer|respond|use|using|write|draft|summari[sz]e|restate|research|prepare|analy[sz]e|explain|find|review|compare)\s+(?!(?:how|why|whether|when|what)\b).*?\bwithout\s+(.+)$/);
    const standaloneNo = clause.match(/^no\s+(.+)$/);
    const exclusions = without?.[1] ?? standaloneNo?.[1];
    const exclusionItems = exclusions?.split(/\s*,\s*|\s+(?:or|and)\s+/);
    if (exclusions && exclusionItems?.every((item) => /^(?:(?:using|calling|dispatching|running|launching)\s+)?(?:brows(?:e|ing)|(?:(?:research|external|any)\s+)?tools?|agent runs?|agents?|workers?|(?:web|internet|online)(?:\s+(?:search(?:es)?|retrieval))?|external\s+(?:sources?|retrieval))$/.test(item.trim()))) {
      const noAgents = /\b(?:agents?|agent runs?|workers?)\b/.test(exclusions);
      const noTools = exclusionItems.some((item) => /^(?:(?:using|calling)\s+)?(?:(?:research|any)\s+)?tools?$/.test(item.trim()));
      const noExternal = /\bbrows(?:e|ing)\b|\b(?:web|internet|online)\b|\bexternal\s+(?:sources?|tools?|retrieval)\b/.test(exclusions);
      if (noAgents || noTools || noExternal) {
        preferDirectAnswer ||= noAgents || noTools;
        allowTools &&= !noTools;
        allowExternalSources &&= !noExternal && !noTools;
        if (standaloneNo) continue;
        routingClause = rawClause.replace(/,?\s*\bwithout\s+[\s\S]*$/i, '');
      }
    }
    if (/^(?:please\s+)?(?:(?:just\s+)?(?:answer|respond)\s+(?:directly|here|in (?:this|our|the) conversation)\b|(?:for|in) (?:this|our) direct conversation\b|(?:direct answer only|conversation[- ]only)\b)/.test(clause)) {
      preferDirectAnswer = true;
    }
    if (/^(?:supplied|provided|attached) (?:context|sources?|documents?|notes) only\b/.test(clause)
      || /^(?:please\s+)?(?:use|using|answer|write|draft|research|summari[sz]e|restate)\b.*\b(?:only (?:the )?(?:supplied|provided|attached|saved) (?:context|contextcapsule|capsule|sources?|documents?|notes)|(?:supplied|provided|attached|saved) (?:context|contextcapsule|capsule|sources?|documents?|notes) only|(?:this|the|our) capsule and (?:the )?(?:earlier|previous) exchange only)\b/.test(clause)) {
      suppliedContextOnly = true;
      allowExternalSources = false;
    }
    if (/^(?:please\s+)?(?:use|using|answer|respond)\b.*\b(?:only (?:this|the|our) (?:direct )?conversation|(?:this|the|our) (?:direct )?conversation only)\b/.test(clause)) {
      preferDirectAnswer = true;
      suppliedContextOnly = true;
      allowExternalSources = false;
    }
    routingClauses.push(routingClause);
  }
  return {
    preferDirectAnswer,
    allowTools,
    allowExternalSources,
    suppliedContextOnly,
    allowWorkspaceRetrieval: !suppliedContextOnly && !(preferDirectAnswer && !allowExternalSources),
    routingPrompt: routingClauses.join('. '),
  };
}

// With external retrieval disabled, expose only tools that consume supplied
// text or the already resolved local context. Do not expose research/dispatch.
const PROVIDED_CONTEXT_TOOL_IDS = new Set([
  'analyzeDocument', 'draftSection', 'editForDiplomaticTone',
  'checkUNTerminology', 'draftResolutionLanguage', 'generateTalkingPoints',
]);

export function filterAskToolsForExecution<TTools extends Record<string, unknown>>(
  tools: TTools,
  preference: AskExecutionPreference,
): TTools {
  if (!preference.allowTools || (preference.preferDirectAnswer && !preference.allowExternalSources)) return {} as TTools;
  if (preference.allowExternalSources) return preference.preferDirectAnswer
    ? Object.fromEntries(Object.entries(tools).filter(([id]) => !['runDeepResearch', 'writeToTool', 'proposeGraphDelta'].includes(id))) as TTools
    : tools;
  return Object.fromEntries(Object.entries(tools).filter(([id]) => PROVIDED_CONTEXT_TOOL_IDS.has(id))) as TTools;
}
