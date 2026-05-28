import type {
  AgentReasoningLoopResult,
  AgentReasoningPhase,
  AgentReasoningStep,
  AgentRun,
} from '@/lib/agent-runtime/types';
import { classifyAgentToolRisk, requiresAgentApproval } from '@/lib/agent-runtime/tool-risk';

type PlannedStep = {
  id: string;
  phase: AgentReasoningPhase;
  toolId: string | null;
  message: string;
  readOnly?: boolean;
};

const RESEARCH_MEMO_PLAN: PlannedStep[] = [
  {
    id: 'resolve-context',
    phase: 'plan',
    toolId: 'context-resolve',
    message: 'Resolve the active ContextCapsule and selected core pointers.',
    readOnly: true,
  },
  {
    id: 'build-evidence-pack',
    phase: 'act',
    toolId: 'capsule-evidence-pack',
    message: 'Build the capsule evidence pack from documents, chunks, receipts, outputs, and memories.',
    readOnly: true,
  },
  {
    id: 'draft-memo',
    phase: 'act',
    toolId: 'policy-memo',
    message: 'Create a Work draft with source and gap receipts.',
  },
  {
    id: 'reflect-gaps',
    phase: 'reflect',
    toolId: 'sourceability-reviewer',
    message: 'Reflect on source gaps, graph gaps, and export blockers.',
    readOnly: true,
  },
];

const OUTPUT_FORMATTER_PLAN: PlannedStep[] = [
  {
    id: 'resolve-context',
    phase: 'plan',
    toolId: 'context-resolve',
    message: 'Resolve the active ContextCapsule and output target before formatting.',
    readOnly: true,
  },
  {
    id: 'inspect-output-source',
    phase: 'act',
    toolId: 'document-retrieve',
    message: 'Inspect attached memo, answer, document, and source receipts before formatting.',
    readOnly: true,
  },
  {
    id: 'format-work-product',
    phase: 'act',
    toolId: 'memo-formatter',
    message: 'Create a structured Work draft that can export to Markdown, DOCX, PDF, or handover package.',
  },
  {
    id: 'preserve-citations',
    phase: 'reflect',
    toolId: 'sourceability-reviewer',
    message: 'Verify citation, gap, and sourceability markers survived formatting.',
    readOnly: true,
  },
];

export function buildResearchMemoReasoningLoop(run: AgentRun): AgentReasoningLoopResult {
  return runBoundedReasoningLoop(run, RESEARCH_MEMO_PLAN);
}

export function buildOutputFormatterReasoningLoop(run: AgentRun): AgentReasoningLoopResult {
  return runBoundedReasoningLoop(run, OUTPUT_FORMATTER_PLAN);
}

export function runBoundedReasoningLoop(
  run: AgentRun,
  plan: PlannedStep[],
): AgentReasoningLoopResult {
  const limit = Math.max(1, Math.min(run.maxStep, plan.length));
  const steps: AgentReasoningStep[] = [];

  for (const planned of plan.slice(0, limit)) {
    const risk = classifyAgentToolRisk({
      toolId: planned.toolId ?? planned.id,
      readOnly: planned.readOnly,
    });
    const requiresApproval = requiresAgentApproval(risk);
    steps.push({
      id: planned.id,
      phase: requiresApproval ? 'approval_gate' : planned.phase,
      toolId: planned.toolId,
      risk,
      message: planned.message,
      requiresApproval,
      receiptId: `${run.id}:${planned.id}`,
    });
    if (requiresApproval) {
      return {
        completed: false,
        stoppedForApproval: true,
        steps,
        nextApprovalReason: `${planned.toolId ?? planned.id} requires approval before execution.`,
      };
    }
  }

  steps.push({
    id: 'loop-complete',
    phase: 'complete',
    toolId: null,
    risk: 'low',
    message: 'Bounded reasoning loop completed inside the approved PRAXIS tool set.',
    requiresApproval: false,
    receiptId: `${run.id}:loop-complete`,
  });

  return {
    completed: true,
    stoppedForApproval: false,
    steps,
    nextApprovalReason: null,
  };
}
