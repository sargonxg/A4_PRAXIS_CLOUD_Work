/**
 * Tool Feedback Service
 *
 * Stores user confidence ratings and improvement suggestions per tool output.
 * Feedback is stored in Firestore at:
 *   users/{uid}/situations/{sitId}/tool-feedback/{toolId}
 *
 * This data is used to:
 * 1. Show confidence indicators on tool outputs
 * 2. Inform AI regeneration prompts (low confidence = adjust approach)
 * 3. Aggregate patterns for tool improvement
 */

import { adminDb } from '@/lib/firebase/admin';
import {
  buildUserFeedbackLearningReviewCardInput,
  shouldProposeCapsuleLearningFromFeedback,
} from '@/lib/context/capsule-closed-loop-learning';
import {
  createCapsuleReviewCard,
  getCapsule,
  type CapsuleReviewCard,
  type CapsuleServiceDeps,
} from '@/lib/context/capsule-service';
import type { SourceabilityClaimVerdict } from '@/lib/agent-runtime/sourceability-ledger';

export type ConfidenceRating = 1 | 2 | 3 | 4 | 5;

export type FeedbackIssue =
  | 'outdated'
  | 'incomplete'
  | 'inaccurate'
  | 'irrelevant'
  | 'biased'
  | 'missing-sources'
  | 'wrong-actors'
  | 'wrong-timeline';

export interface ToolFeedback {
  confidence: ConfidenceRating;
  issues: FeedbackIssue[];
  suggestion?: string;
  approved: boolean; // user explicitly marked as "ready/approved"
  createdAt: string;
  updatedAt: string;
  toolId: string;
  situationId: string;
  capsuleId?: string | null;
  answerId?: string | null;
  correctionReviewCardId?: string | null;
}

export interface SaveToolFeedbackInput {
  confidence: ConfidenceRating;
  issues?: FeedbackIssue[];
  suggestion?: string;
  approved?: boolean;
  capsuleId?: string | null;
  answerId?: string | null;
  correctionReviewCardId?: string | null;
}

export interface SaveToolFeedbackLearningOptions {
  capsuleId?: string | null;
  answerId?: string | null;
  sourceabilityVerdicts?: SourceabilityClaimVerdict[];
  deps?: CapsuleServiceDeps;
}

export interface SaveToolFeedbackLearningResult {
  feedbackSaved: true;
  reviewCard: CapsuleReviewCard | null;
}

export async function saveToolFeedback(
  uid: string,
  situationId: string,
  toolId: string,
  feedback: SaveToolFeedbackInput,
  deps?: CapsuleServiceDeps,
): Promise<void> {
  const now = new Date().toISOString();

  const ref = dbOf(deps)
    .collection('users').doc(uid)
    .collection('situations').doc(situationId)
    .collection('tool-feedback').doc(toolId);

  const existing = await ref.get();

  await ref.set({
    confidence: feedback.confidence,
    issues: feedback.issues || [],
    suggestion: feedback.suggestion || null,
    approved: feedback.approved ?? false,
    capsuleId: feedback.capsuleId ?? null,
    answerId: feedback.answerId ?? null,
    correctionReviewCardId: feedback.correctionReviewCardId ?? null,
    toolId,
    situationId,
    createdAt: existing.exists ? existing.data()?.createdAt || now : now,
    updatedAt: now,
  });
}

export async function getToolFeedback(
  uid: string,
  situationId: string,
  toolId: string,
): Promise<ToolFeedback | null> {
  const doc = await dbOf()
    .collection('users').doc(uid)
    .collection('situations').doc(situationId)
    .collection('tool-feedback').doc(toolId)
    .get();

  return doc.exists ? (doc.data() as ToolFeedback) : null;
}

export async function getAllToolFeedback(
  uid: string,
  situationId: string,
): Promise<ToolFeedback[]> {
  const snap = await dbOf()
    .collection('users').doc(uid)
    .collection('situations').doc(situationId)
    .collection('tool-feedback')
    .get();

  return snap.docs.map((d) => d.data() as ToolFeedback);
}

export async function saveToolFeedbackAndProposeCapsuleReviewCard(
  uid: string,
  situationId: string,
  toolId: string,
  feedback: SaveToolFeedbackInput,
  options: SaveToolFeedbackLearningOptions = {},
): Promise<SaveToolFeedbackLearningResult> {
  const capsuleId = cleanText(options.capsuleId, 160);
  const answerId = cleanText(options.answerId, 160);

  await saveToolFeedback(uid, situationId, toolId, {
    ...feedback,
    capsuleId: capsuleId || null,
    answerId: answerId || null,
  }, options.deps);

  if (!capsuleId || !shouldProposeCapsuleLearningFromFeedback(feedback)) {
    return { feedbackSaved: true, reviewCard: null };
  }

  const capsule = await getCapsule(uid, capsuleId, options.deps);
  if (!capsule) {
    return { feedbackSaved: true, reviewCard: null };
  }

  const cardInput = buildUserFeedbackLearningReviewCardInput(capsule, {
    situationId,
    toolId,
    answerId,
    confidence: feedback.confidence,
    issues: feedback.issues ?? [],
    suggestion: feedback.suggestion,
    createdAt: options.deps?.now?.().toISOString() ?? new Date().toISOString(),
    sourceabilityVerdicts: options.sourceabilityVerdicts ?? [],
  });
  const reviewCard = await createCapsuleReviewCard(uid, capsuleId, cardInput, options.deps);

  await saveToolFeedback(uid, situationId, toolId, {
    ...feedback,
    capsuleId,
    answerId: answerId || null,
    correctionReviewCardId: reviewCard.reviewCardId,
  }, options.deps);

  return { feedbackSaved: true, reviewCard };
}

/**
 * Build a feedback context string for AI prompts.
 * When a user has rated a tool output with low confidence,
 * this context is included in the next regeneration prompt.
 */
export function buildFeedbackContext(feedback: ToolFeedback | null): string {
  if (!feedback || feedback.confidence >= 4) return '';

  const parts: string[] = [
    `\nUSER FEEDBACK ON PREVIOUS OUTPUT (confidence: ${feedback.confidence}/5):`,
  ];

  if (feedback.issues.length > 0) {
    parts.push(`Issues flagged: ${feedback.issues.join(', ')}`);
  }

  if (feedback.suggestion) {
    parts.push(`User suggestion: ${feedback.suggestion}`);
  }

  parts.push('Please address these concerns in your new output. Prioritize accuracy and recency.');

  return parts.join('\n');
}

function dbOf(deps?: CapsuleServiceDeps) {
  return deps?.db ?? adminDb;
}

function cleanText(value: unknown, maxLength = 500): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength) : '';
}
