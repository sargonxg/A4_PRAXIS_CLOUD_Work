import { newId, SignalError } from './domain';
import { FeedbackInputSchema, type SignalDesk, type SignalFeedback } from './schema';

export const MAX_SIGNAL_FEEDBACK = 30;

/** Private product feedback is an append-only note, never a knowledge/review decision. */
export function appendSignalFeedback(desk: SignalDesk, actorUid: string, raw: unknown, createdAt: string): SignalFeedback {
  if (desk.ownerUid !== actorUid) throw new SignalError(404, 'Desk unavailable.');
  if (desk.deletionRequestedAt) throw new SignalError(409, 'Desk deletion is in progress. Retry deletion.');
  const input = FeedbackInputSchema.parse(raw);
  if ((desk.feedback?.length ?? 0) >= MAX_SIGNAL_FEEDBACK) throw new SignalError(429, 'This desk has reached its 30 feedback-note allowance. Existing feedback is retained.');
  const feedback: SignalFeedback = { ...input, id: newId(), actorUid, createdAt, deskVersion: desk.version };
  desk.feedback ??= [];
  desk.feedback.push(feedback);
  return feedback;
}
