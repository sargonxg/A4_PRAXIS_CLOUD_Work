import type { CoreKind } from '@/lib/tools/contract';
import { getOutputCapsuleTemplate } from './templates';
import type { OutputCapsulePlan, OutputCapsulePlanStep } from './types';

export interface PlanOutputCapsuleRunInput {
  targetTemplateId: string;
  availableCores: CoreKind[];
  availableToolIds: string[];
  objective?: string;
}

export function planOutputCapsuleRun(input: PlanOutputCapsuleRunInput): OutputCapsulePlan {
  const targetTemplate = getOutputCapsuleTemplate(input.targetTemplateId);
  if (!targetTemplate) {
    throw new Error(`Unknown OutputCapsule template: ${input.targetTemplateId}`);
  }

  const availableCores = new Set(input.availableCores);
  const availableTools = new Set(input.availableToolIds);
  const missingRequiredCores = targetTemplate.requiredCores.filter((core) => !availableCores.has(core));
  const suggestedSteps = targetTemplate.producibleBy
    .filter((producer) => producer.kind !== 'compose')
    .map<OutputCapsulePlanStep>((producer, index) => ({
      id: `${producer.kind}-${producer.id}-${index + 1}`,
      kind: producer.kind,
      label: producer.kind === 'tool' ? `Run ${producer.id}` : `Queue ${producer.id}`,
      toolId: producer.kind === 'tool' ? producer.id : undefined,
      agentId: producer.kind === 'agent' ? producer.id : undefined,
      outputTemplateId: targetTemplate.id,
    }))
    .filter((step) => !step.toolId || availableTools.has(step.toolId));

  const composeSteps = targetTemplate.family === 'composite'
    ? targetTemplate.composableWith.map<OutputCapsulePlanStep>((templateId, index) => ({
      id: `compose-${templateId}-${index + 1}`,
      kind: 'compose',
      label: `Attach ${templateId}`,
      inputTemplateIds: [templateId],
      outputTemplateId: targetTemplate.id,
    }))
    : [];

  const approvalGates = [
    'sourceability-review',
    'human-review-before-shipping',
    ...(targetTemplate.requiredCores.includes('graph') ? ['graph-mutation-review'] : []),
  ];

  const canRun = missingRequiredCores.length === 0 && (suggestedSteps.length > 0 || composeSteps.length > 0);

  return {
    targetTemplate,
    missingRequiredCores,
    suggestedSteps,
    composeSteps,
    approvalGates,
    destination: destinationForTemplate(targetTemplate.id),
    canRun,
    explanation: canRun
      ? `PRAXIS can produce ${targetTemplate.label} from the active capsule.`
      : `PRAXIS needs ${missingRequiredCores.map(labelCore).join(', ') || 'an available producer'} before producing ${targetTemplate.label}.`,
  };
}

function destinationForTemplate(templateId: string): OutputCapsulePlan['destination'] {
  if (templateId.includes('memo') || templateId.includes('cable') || templateId.includes('talking')) return 'memo-studio';
  if (templateId.includes('pack') || templateId.includes('brief')) return 'library';
  if (templateId.includes('risk') || templateId.includes('monitor')) return 'canvas';
  return 'ask';
}

function labelCore(core: CoreKind) {
  return `${core} core`;
}
