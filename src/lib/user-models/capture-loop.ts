import type { UserModelFields } from './types';

export type CaptureSuggestionKind = 'standingAssumption' | 'methodologyPreference' | 'sourcePreference';

export interface CaptureSuggestion {
  kind: CaptureSuggestionKind;
  text: string;
  activeModelId: string;
}

export function buildCaptureSuggestion(answerText: string, activeModelId: string): CaptureSuggestion | null {
  const clean = answerText.trim();
  if (clean.length < 40) return null;
  return {
    kind: clean.toLowerCase().includes('source') ? 'sourcePreference' : 'standingAssumption',
    text: clean.slice(0, 280),
    activeModelId,
  };
}

export function applyCaptureSuggestionDraft(model: UserModelFields, suggestion: CaptureSuggestion): UserModelFields {
  if (suggestion.kind === 'sourcePreference') {
    return {
      ...model,
      sourcePreferences: {
        ...model.sourcePreferences,
        trusted: Array.from(new Set([...model.sourcePreferences.trusted, suggestion.text])),
      },
    };
  }
  if (suggestion.kind === 'methodologyPreference') {
    return { ...model, methodologyToolkit: Array.from(new Set([...model.methodologyToolkit, suggestion.text])) };
  }
  return { ...model, standingAssumptions: Array.from(new Set([...model.standingAssumptions, suggestion.text])) };
}
