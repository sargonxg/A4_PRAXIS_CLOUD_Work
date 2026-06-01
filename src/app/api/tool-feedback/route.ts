import { withAuth } from '@/lib/api/with-auth';
import {
  saveToolFeedback,
  getToolFeedback,
  saveToolFeedbackAndProposeCapsuleReviewCard,
} from '@/lib/services/feedback-service';
import type { ConfidenceRating, FeedbackIssue } from '@/lib/services/feedback-service';
import type { SourceabilityClaimVerdict } from '@/lib/agent-runtime/sourceability-ledger';

export const GET = withAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const toolId = searchParams.get('toolId');
  const situationId = searchParams.get('situationId');

  if (!toolId || !situationId) {
    return new Response(JSON.stringify({ error: 'toolId and situationId required' }), {
      status: 400,
    });
  }

  const feedback = await getToolFeedback(user.uid, situationId, toolId);
  if (!feedback) {
    return new Response(JSON.stringify(null), { status: 200 });
  }

  return Response.json(feedback);
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const { toolId, situationId, confidence, issues, suggestion, approved, capsuleId, answerId, sourceabilityVerdicts } = body;

  if (!toolId || !situationId || !confidence) {
    return new Response(JSON.stringify({ error: 'toolId, situationId, and confidence required' }), {
      status: 400,
    });
  }

  if (confidence < 1 || confidence > 5) {
    return new Response(JSON.stringify({ error: 'confidence must be 1-5' }), { status: 400 });
  }

  const feedback = {
    confidence: confidence as ConfidenceRating,
    issues: issues as FeedbackIssue[] | undefined,
    suggestion,
    approved,
  };

  if (typeof capsuleId === 'string' && capsuleId.trim()) {
    const result = await saveToolFeedbackAndProposeCapsuleReviewCard(user.uid, situationId, toolId, feedback, {
      capsuleId,
      answerId: typeof answerId === 'string' ? answerId : null,
      sourceabilityVerdicts: Array.isArray(sourceabilityVerdicts)
        ? sourceabilityVerdicts as SourceabilityClaimVerdict[]
        : [],
    });
    return Response.json({
      success: true,
      capsuleReviewCardId: result.reviewCard?.reviewCardId ?? null,
    });
  }

  await saveToolFeedback(user.uid, situationId, toolId, feedback);

  return Response.json({ success: true });
});
