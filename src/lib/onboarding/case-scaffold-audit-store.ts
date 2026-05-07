import { randomUUID } from 'node:crypto';
import { adminDb } from '@/lib/firebase/admin';
import type { CaseScaffoldProposal } from '@/lib/onboarding/case-scaffold';

function collectionRef(uid: string) {
  return adminDb.collection('users').doc(uid).collection('case-scaffold-audits');
}

export async function persistCaseScaffoldAudit(input: {
  uid: string;
  proposal: CaseScaffoldProposal;
  objective?: string;
}) {
  const id = randomUUID();
  const now = new Date().toISOString();
  const acceptedActors = input.proposal.initialActors.filter((actor) => actor.accepted);
  const rejectedActors = input.proposal.initialActors.filter((actor) => !actor.accepted);
  const acceptedClaims = input.proposal.initialClaims.filter((claim) => claim.accepted);
  const rejectedClaims = input.proposal.initialClaims.filter((claim) => !claim.accepted);
  const record = {
    id,
    createdAt: now,
    ownerUid: input.uid,
    objective: input.objective ?? input.proposal.suggestedDescription,
    generatedBy: input.proposal.generatedBy,
    suggestedCaseName: input.proposal.suggestedCaseName,
    primaryOntologyId: input.proposal.primaryOntologyId,
    secondaryOntologyIds: input.proposal.secondaryOntologyIds,
    suggestedSourceIds: input.proposal.suggestedSourceIds,
    acceptedCounts: {
      actors: acceptedActors.length,
      claims: acceptedClaims.length,
      sources: input.proposal.suggestedSourceIds.length,
    },
    rejectedCounts: {
      actors: rejectedActors.length,
      claims: rejectedClaims.length,
    },
    discardedCandidates: {
      actors: rejectedActors.map((actor) => ({ id: actor.id, name: actor.name })),
      claims: rejectedClaims.map((claim) => ({ id: claim.id, actorName: claim.actorName, text: claim.text })),
    },
    firewall: {
      status: 'user-reviewed',
      note: 'Accepted scaffold items are user-reviewed creation inputs; normal situation persistence and downstream graph review still apply.',
    },
  };
  await collectionRef(input.uid).doc(id).set(record);
  return record;
}

