import { FirestoreDialecticaAdapter } from './firestore-adapter';
import { HttpDialecticaAdapter } from './http-adapter';
import type { DialecticaAdapter } from './adapter';

let adapter: DialecticaAdapter | null = null;

export function getAdapter(): DialecticaAdapter {
  if (adapter) return adapter;
  adapter = process.env.DIALECTICA_ENABLED === 'true'
    ? new HttpDialecticaAdapter()
    : new FirestoreDialecticaAdapter();
  return adapter;
}

export type {
  AdapterCapabilities,
  ApprovalSet,
  ContextPackQuery,
  DialecticaAdapter,
  DialecticaContextPack,
  ExtractInput,
  GraphHealthReport,
  GraphProposal,
  MutationApplyResult,
  MutationProposalResult,
  OntologyVersion,
  SituationFrame,
} from './adapter';
