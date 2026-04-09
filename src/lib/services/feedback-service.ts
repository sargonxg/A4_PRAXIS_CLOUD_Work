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
}

export async function saveToolFeedback(
  uid: string,
  situationId: string,
  toolId: string,
  feedback: {
    confidence: ConfidenceRating;
    issues?: FeedbackIssue[];
    suggestion?: string;
    approved?: boolean;
  },
): Promise<void> {
  const now = new Date().toISOString();

  const ref = adminDb
    .collection('users').doc(uid)
    .collection('situations').doc(situationId)
    .collection('tool-feedback').doc(toolId);

  const existing = await ref.get();

  await ref.set({
    confidence: feedback.confidence,
    issues: feedback.issues || [],
    suggestion: feedback.suggestion || null,
    approved: feedback.approved ?? false,
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
  const doc = await adminDb
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
  const snap = await adminDb
    .collection('users').doc(uid)
    .collection('situations').doc(situationId)
    .collection('tool-feedback')
    .get();

  return snap.docs.map((d) => d.data() as ToolFeedback);
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
