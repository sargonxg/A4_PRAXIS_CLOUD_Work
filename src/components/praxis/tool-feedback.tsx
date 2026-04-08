'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Star, AlertTriangle, CheckCircle, MessageSquare, ThumbsUp,
  Clock, FileWarning, Users, CalendarX,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/auth/auth-context';
import type { FeedbackIssue, ConfidenceRating } from '@/lib/services/feedback-service';

interface ToolFeedbackProps {
  toolId: string;
  situationId: string;
  className?: string;
}

const ISSUE_OPTIONS: { value: FeedbackIssue; label: string; icon: React.ElementType }[] = [
  { value: 'outdated', label: 'Outdated info', icon: Clock },
  { value: 'incomplete', label: 'Incomplete', icon: FileWarning },
  { value: 'inaccurate', label: 'Inaccurate', icon: AlertTriangle },
  { value: 'irrelevant', label: 'Irrelevant', icon: MessageSquare },
  { value: 'biased', label: 'Biased', icon: AlertTriangle },
  { value: 'missing-sources', label: 'Missing sources', icon: FileWarning },
  { value: 'wrong-actors', label: 'Wrong actors', icon: Users },
  { value: 'wrong-timeline', label: 'Wrong timeline', icon: CalendarX },
];

export function ToolFeedback({ toolId, situationId, className }: ToolFeedbackProps) {
  const { user } = useAuth();
  const [confidence, setConfidence] = useState<ConfidenceRating | null>(null);
  const [selectedIssues, setSelectedIssues] = useState<FeedbackIssue[]>([]);
  const [suggestion, setSuggestion] = useState('');
  const [approved, setApproved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load existing feedback
  useEffect(() => {
    if (!user?.uid || !situationId || loaded) return;

    fetch(`/api/tool-feedback?toolId=${toolId}&situationId=${situationId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setConfidence(data.confidence);
          setSelectedIssues(data.issues || []);
          setSuggestion(data.suggestion || '');
          setApproved(data.approved || false);
          if (data.confidence) setSaved(true);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [user?.uid, situationId, toolId, loaded]);

  const saveFeedback = useCallback(async (conf: ConfidenceRating, isApproved: boolean = false) => {
    if (!user?.uid || saving) return;
    setSaving(true);
    try {
      await fetch('/api/tool-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId,
          situationId,
          confidence: conf,
          issues: selectedIssues,
          suggestion: suggestion.trim() || undefined,
          approved: isApproved,
        }),
      });
      setSaved(true);
    } catch {
      // Fail silently — feedback is non-critical
    } finally {
      setSaving(false);
    }
  }, [user?.uid, saving, toolId, situationId, selectedIssues, suggestion]);

  const handleStarClick = (rating: ConfidenceRating) => {
    setConfidence(rating);
    setSaved(false);
    if (rating <= 2) {
      setShowDetails(true);
    } else {
      saveFeedback(rating);
    }
  };

  const handleApprove = () => {
    setApproved(true);
    saveFeedback(confidence || 5, true);
  };

  const toggleIssue = (issue: FeedbackIssue) => {
    setSelectedIssues((prev) =>
      prev.includes(issue) ? prev.filter((i) => i !== issue) : [...prev, issue]
    );
    setSaved(false);
  };

  const handleSubmitFeedback = () => {
    if (confidence) saveFeedback(confidence);
  };

  if (!user?.uid) return null;

  return (
    <div className={cn('border-t border-navy-200 dark:border-navy-800 bg-navy-50/50 dark:bg-navy-900/30', className)}>
      <div className="px-4 py-3">
        {/* Main feedback row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium text-navy-500 dark:text-navy-400">
              How confident are you in this output?
            </span>

            {/* Star rating */}
            <div className="flex items-center gap-0.5">
              {([1, 2, 3, 4, 5] as ConfidenceRating[]).map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleStarClick(rating)}
                  className={cn(
                    'p-0.5 transition-colors',
                    confidence && rating <= confidence
                      ? 'text-gold-500'
                      : 'text-navy-400 hover:text-gold-400',
                  )}
                  title={
                    rating === 1 ? 'Not confident' :
                    rating === 2 ? 'Low confidence' :
                    rating === 3 ? 'Moderate' :
                    rating === 4 ? 'Confident' :
                    'Very confident'
                  }
                >
                  <Star
                    className="h-4 w-4"
                    fill={confidence && rating <= confidence ? 'currentColor' : 'none'}
                  />
                </button>
              ))}
            </div>

            {saved && (
              <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Saved
              </span>
            )}
          </div>

          {/* Approve button */}
          <button
            onClick={handleApprove}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-all',
              approved
                ? 'bg-emerald-600/20 text-emerald-400 ring-1 ring-emerald-600/30'
                : 'bg-navy-200 dark:bg-navy-800 text-navy-500 hover:bg-emerald-600/20 hover:text-emerald-400',
            )}
          >
            <ThumbsUp className="h-3 w-3" />
            {approved ? 'Approved' : 'Mark as ready'}
          </button>
        </div>

        {/* Expanded details for low confidence */}
        {showDetails && confidence && confidence <= 2 && (
          <div className="mt-3 space-y-3">
            {/* Issue tags */}
            <div>
              <span className="text-[10px] font-medium uppercase text-navy-400 mb-1.5 block">
                What's wrong?
              </span>
              <div className="flex flex-wrap gap-1.5">
                {ISSUE_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => toggleIssue(value)}
                    className={cn(
                      'flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium transition-all',
                      selectedIssues.includes(value)
                        ? 'bg-red-600/20 text-red-400 ring-1 ring-red-600/30'
                        : 'bg-navy-200 dark:bg-navy-800 text-navy-500 hover:bg-red-600/10',
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Suggestion text */}
            <div>
              <textarea
                value={suggestion}
                onChange={(e) => { setSuggestion(e.target.value); setSaved(false); }}
                placeholder="How can we improve this? (optional)"
                className="w-full rounded-lg border border-navy-300 dark:border-navy-700 bg-white dark:bg-navy-900 px-3 py-2 text-xs text-navy-900 dark:text-navy-100 placeholder:text-navy-400 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500/30"
                rows={2}
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmitFeedback}
              disabled={saving}
              className="rounded-lg bg-gold-600 px-4 py-1.5 text-[11px] font-medium text-white hover:bg-gold-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Submit feedback'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
