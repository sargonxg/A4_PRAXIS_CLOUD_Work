import type { Editor } from '@tiptap/react';

export type PraxisSlashCommandId =
  | 'ask'
  | 'cite'
  | 'tighten'
  | 'soften'
  | 'steelman'
  | 'gap'
  | 'bluf'
  | 'actor'
  | 'claim'
  | 'timeline'
  | 'redact'
  | 'handover';

export interface PraxisSlashCommand {
  id: PraxisSlashCommandId;
  label: string;
  hint: string;
  run: (editor: Editor) => void | boolean | Promise<void | boolean>;
}

export function buildPraxisSlashCommands(actions: {
  ask: () => Promise<void>;
  cite: () => void;
  rewrite: (mode: 'tighten' | 'soften' | 'steelman') => Promise<void>;
}): PraxisSlashCommand[] {
  return [
    { id: 'ask', label: '/ask', hint: 'Ask PRAXIS with the active Situation Core', run: actions.ask },
    { id: 'cite', label: '/cite', hint: 'Insert a citation from attached sources', run: actions.cite },
    { id: 'tighten', label: '/tighten', hint: 'Rewrite selected text in fewer words', run: () => actions.rewrite('tighten') },
    { id: 'soften', label: '/soften', hint: 'Shift selected text into a diplomatic register', run: () => actions.rewrite('soften') },
    { id: 'steelman', label: '/steelman', hint: 'Draft the strongest opposing view', run: () => actions.rewrite('steelman') },
    {
      id: 'gap',
      label: '/gap',
      hint: 'Insert an evidence gap block',
      run: (editor) =>
        editor
          .chain()
          .focus()
          .insertContent('<p data-provenance-tool="gap" data-confidence="open">Evidence gap: specify the claim PRAXIS must verify before export.</p>')
          .run(),
    },
    {
      id: 'bluf',
      label: '/bluf',
      hint: 'Insert a Bottom Line Up Front block',
      run: (editor) => editor.chain().focus().insertContent('<h2>Bottom line up front</h2><p>State the decision-ready judgment here.</p>').run(),
    },
    {
      id: 'actor',
      label: '/actor',
      hint: 'Mention an actor from the Situation Core graph',
      run: (editor) => editor.chain().focus().insertContent('<p data-provenance-core="situation-core">@actor: add actor, role, interest, and leverage.</p>').run(),
    },
    {
      id: 'claim',
      label: '/claim',
      hint: 'Insert a sourced claim block',
      run: (editor) => editor.chain().focus().insertContent('<p data-provenance-core="source-graph" data-confidence="medium">Claim: write the claim, attach source, set confidence.</p>').run(),
    },
    {
      id: 'timeline',
      label: '/timeline',
      hint: 'Insert chronology scaffold',
      run: (editor) => editor.chain().focus().insertContent('<h2>Chronology</h2><ul><li>Date: event, actor, source, implication.</li></ul>').run(),
    },
    {
      id: 'redact',
      label: '/redact',
      hint: 'Mark content as audience-restricted',
      run: (editor) => editor.chain().focus().insertContent('<p data-provenance-tool="redaction" data-confidence="restricted">Redaction note: audience restriction level and rationale.</p>').run(),
    },
    {
      id: 'handover',
      label: '/handover',
      hint: 'Insert successor handover summary',
      run: (editor) => editor.chain().focus().insertContent('<h2>Handover</h2><p>Current judgment, open gaps, decisions pending, next owner.</p>').run(),
    },
  ];
}
