export type ResponseActionKind =
  | 'save_to_write'
  | 'cite_as_gap'
  | 'attach_to_core'
  | 'add_next_move'
  | 'run_deep_research'
  | 'open_context'
  | 'propose_graph_edit';

export function inferResponseActionKinds(text: string): ResponseActionKind[] {
  const normalized = text.toLowerCase();
  const actions = new Set<ResponseActionKind>(['open_context']);

  if (hasCitationSignal(normalized)) actions.add('save_to_write');
  if (/\b(gap|missing|unknown|unverified|unclear|insufficient|need(?:s)? evidence)\b/.test(normalized)) {
    actions.add('cite_as_gap');
  }
  if (/\b(deep(?:er)? research|research further|needs research|investigate|verify with sources)\b/.test(normalized)) {
    actions.add('run_deep_research');
  }
  if (/\b(next step|next move|follow(?:-| )?up|recommend(?:ed|ation|ations)?|action item|should)\b/.test(normalized)) {
    actions.add('add_next_move');
  }
  if (/\b(actor|claim|event|relationship|edge|node|graph|commitment)\b/.test(normalized)) {
    actions.add('attach_to_core');
  }
  if (/\b(add|update|correct|revise|remove|merge|propose).{0,80}\b(actor|claim|event|relationship|edge|node|graph)\b/.test(normalized)) {
    actions.add('propose_graph_edit');
  }

  return Array.from(actions);
}

function hasCitationSignal(text: string): boolean {
  return (
    /\[(google search|grounded search|wikipedia|web|ai analysis|receipt|source)\]/i.test(text) ||
    /\b(source|citation|receipt|provenance|according to|evidence)\b/.test(text)
  );
}
