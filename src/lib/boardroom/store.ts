import { buildBoardroomDeliberation } from '@/lib/boardroom/deterministic-boardroom';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import {
  DeliberationArtifactSchema,
  type DeliberationArtifact,
  type DeliberationConfig,
  type DeliberationPhase,
} from '@/types/boardroom';

const MAX_LIST = 20;

function collection(uid: string, caseId: string) {
  return getAdminDbOrThrow()
    .collection('users')
    .doc(uid)
    .collection('situations')
    .doc(caseId)
    .collection('deliberations');
}

function parseArtifact(raw: unknown): DeliberationArtifact {
  return DeliberationArtifactSchema.parse(raw);
}

export function buildDemoDeliberation(input: {
  uid: string;
  caseId: string;
  id?: string;
  question?: string;
  now?: string;
}) {
  return buildBoardroomDeliberation({
    id: input.id ?? 'boardroom-demo',
    caseId: input.caseId,
    ownerUid: input.uid,
    now: input.now,
    config: {
      question: input.question ?? 'What is the defensible next move this week?',
      satIntegration: { redTeamRound: true, achScoring: true, kacAnnex: false, premortemRound: false },
    },
  });
}

export async function listDeliberations(uid: string, caseId: string, limit = MAX_LIST): Promise<DeliberationArtifact[]> {
  const snapshot = await collection(uid, caseId)
    .orderBy('updatedAt', 'desc')
    .limit(Math.min(Math.max(limit, 1), MAX_LIST))
    .get();
  return snapshot.docs.map((doc) => parseArtifact({ id: doc.id, ...doc.data() }));
}

export async function createDeliberation(input: {
  uid: string;
  caseId: string;
  config: Partial<DeliberationConfig> & { question: string };
}): Promise<DeliberationArtifact> {
  const docRef = collection(input.uid, input.caseId).doc();
  const artifact = buildBoardroomDeliberation({
    id: docRef.id,
    caseId: input.caseId,
    ownerUid: input.uid,
    config: input.config,
  });
  await docRef.set(artifact);
  return artifact;
}

export async function getDeliberation(uid: string, caseId: string, id: string): Promise<DeliberationArtifact | null> {
  const doc = await collection(uid, caseId).doc(id).get();
  if (!doc.exists) return null;
  return parseArtifact({ id: doc.id, ...doc.data(), caseId, ownerUid: uid });
}

export async function saveDeliberation(uid: string, caseId: string, artifact: DeliberationArtifact): Promise<DeliberationArtifact> {
  const sanitized = parseArtifact({
    ...artifact,
    caseId,
    ownerUid: uid,
    updatedAt: new Date().toISOString(),
  });
  await collection(uid, caseId).doc(sanitized.id).set(sanitized, { merge: true });
  return sanitized;
}

export async function transitionDeliberation(input: {
  uid: string;
  caseId: string;
  id: string;
  status: DeliberationArtifact['status'];
  phase: DeliberationPhase;
  demo?: boolean;
}): Promise<DeliberationArtifact | null> {
  const current = input.demo
    ? buildDemoDeliberation({ uid: input.uid, caseId: input.caseId, id: input.id })
    : await getDeliberation(input.uid, input.caseId, input.id);
  if (!current) return null;

  const next = parseArtifact({
    ...current,
    status: input.status,
    phase: input.phase,
    updatedAt: new Date().toISOString(),
  });

  if (!input.demo) {
    await collection(input.uid, input.caseId).doc(input.id).set(next, { merge: true });
  }

  return next;
}
