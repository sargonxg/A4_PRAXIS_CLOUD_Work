import { buildTrustGraphCapsuleSyncRequest } from '@/lib/knowledge/trustgraph-capsule-sync';
import {
  GraphLiteCapsuleSyncRequestSchema,
  type GraphLiteCapsuleSyncRequest,
} from '@/lib/knowledge/graphlite-contract';

export function buildGraphLiteCapsuleSyncRequest(input: {
  uid: string;
  capsule: unknown;
  workspaceMode?: string;
  collectionPrefix?: string;
}): GraphLiteCapsuleSyncRequest {
  const substrateNeutralPayload = buildTrustGraphCapsuleSyncRequest(input);
  return GraphLiteCapsuleSyncRequestSchema.parse(substrateNeutralPayload);
}
