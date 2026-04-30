'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ClipboardCheck, Database, HelpCircle, PencilLine, Target, Workflow } from 'lucide-react';
import { getToolOperatingContract } from '@/lib/tools/tool-operating-contracts';
import { getToolContextBlueprint } from '@/lib/tools/tool-context-blueprints';
import { getToolPathMembership } from '@/lib/tools/tool-path-taxonomy';
import { cn } from '@/lib/utils/cn';

interface ToolOperatingContractPanelProps {
  toolId: string;
  defaultOpen?: boolean;
  className?: string;
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[var(--color-app-border)] bg-white px-2 py-0.5 text-[10px] font-medium text-navy-600">
      {children}
    </span>
  );
}

export function ToolOperatingContractPanel({ toolId, defaultOpen = false, className }: ToolOperatingContractPanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contract = getToolOperatingContract(toolId);
  const blueprint = getToolContextBlueprint(toolId);
  const pathMembership = getToolPathMembership(toolId);

  return (
    <div className={cn('rounded-xl border border-[var(--color-app-border)] bg-white overflow-hidden', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-navy-50/60 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <Target className="h-3.5 w-3.5 text-diplomatic-blue" />
          <span className="text-xs font-medium text-navy-600">
            Operating contract
            <span className="ml-1.5 font-normal text-navy-400">purpose, inputs, outputs, and Ask PRAXIS edits</span>
          </span>
        </div>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-navy-400" /> : <ChevronDown className="h-3.5 w-3.5 text-navy-400" />}
      </button>

      {open && (
        <div className="border-t border-[var(--color-app-border)] px-5 py-4 space-y-5">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h4 className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-navy-400">
                <Target className="h-3 w-3" />
                Objective
              </h4>
              <p className="text-xs leading-relaxed text-navy-700">{contract.objective}</p>
              <p className="mt-2 text-xs leading-relaxed text-navy-500">{contract.userValue}</p>
            </div>

            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-navy-400">
                <Workflow className="h-3 w-3" />
                Product mode
              </h4>
              <div className="flex flex-wrap gap-1.5">
                <Pill>{contract.applicability}</Pill>
                {contract.interactivity.map((mode) => <Pill key={mode}>{mode}</Pill>)}
                {contract.persistence.editableByAskPraxis ? <Pill>Ask PRAXIS editable</Pill> : null}
                {contract.persistence.versioned ? <Pill>versioned</Pill> : null}
              </div>
              {pathMembership.length ? (
                <div className="mt-3">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-navy-400">Workflow paths</p>
                  <div className="flex flex-wrap gap-1.5">
                    {pathMembership.map((membership) => (
                      <Pill key={`${membership.pathId}-${membership.tier}`}>
                        {membership.label} · {membership.tier}
                      </Pill>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-navy-400">
                <HelpCircle className="h-3 w-3" />
                Required questions
              </h4>
              <div className="space-y-2">
                {contract.requiredQuestions.map((question) => (
                  <div key={question.id} className="rounded-lg bg-navy-50/70 p-2">
                    <p className="text-xs font-medium text-navy-800">
                      {question.label}
                      {question.required ? <span className="ml-1 text-red-500">*</span> : null}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-navy-500">{question.why}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-navy-400">
                <ClipboardCheck className="h-3 w-3" />
                Outputs
              </h4>
              <div className="space-y-2">
                {contract.expectedOutputs.map((output) => (
                  <div key={`${output.kind}-${output.label}`} className="rounded-lg bg-navy-50/70 p-2">
                    <p className="text-xs font-medium text-navy-800">{output.label}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-navy-500">{output.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-navy-400">
                <PencilLine className="h-3 w-3" />
                Ask PRAXIS can
              </h4>
              <ul className="space-y-1.5">
                {contract.askPraxisActions.map((action) => (
                  <li key={action} className="text-xs leading-relaxed text-navy-600">
                    - {action}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid gap-4 border-t border-[var(--color-app-border)] pt-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-navy-400">Situation inputs</p>
              <div className="flex flex-wrap gap-1.5">
                {contract.situationInputs.length ? contract.situationInputs.map((input) => <Pill key={input}>{input}</Pill>) : <Pill>none declared</Pill>}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-navy-400">Quality bar</p>
              <div className="flex flex-wrap gap-1.5">
                {contract.qualityBar.map((item) => <Pill key={item}>{item}</Pill>)}
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-t border-[var(--color-app-border)] pt-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-navy-400">
                <Database className="h-3 w-3" />
                Context blueprint
              </p>
              <div className="flex flex-wrap gap-1.5">
                {blueprint.requiredLayers.map((layer) => <Pill key={layer}>{layer}</Pill>)}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-navy-500">
                Graph mode: {blueprint.graphBackbone.currentMode}. {blueprint.graphBackbone.futureDialecticaRole}
              </p>
            </div>
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-navy-400">Data paths</p>
              <div className="space-y-1.5 text-[11px] leading-relaxed text-navy-500">
                <p><span className="font-medium text-navy-700">Canonical:</span> {blueprint.database.canonicalOutputPath}</p>
                <p><span className="font-medium text-navy-700">Versions:</span> {blueprint.database.versionHistoryPath}</p>
                {blueprint.documentProduction.supportsLibreOfficeExport ? (
                  <p><span className="font-medium text-navy-700">Document output:</span> {blueprint.documentProduction.artifactTypes.join(', ')}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
