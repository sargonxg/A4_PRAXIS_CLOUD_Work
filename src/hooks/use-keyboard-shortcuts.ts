'use client';

import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcutActions {
  openSearch?: () => void;
  openAsk?: () => void;
  openHelp?: () => void;
  goHome?: () => void;
  goCores?: () => void;
  goLibrary?: () => void;
  goCanvas?: () => void;
  goWrite?: () => void;
  goTools?: () => void;
  goSettings?: () => void;
  closeModal?: () => void;
}

type GoSequenceAction =
  | 'goHome'
  | 'goCores'
  | 'goLibrary'
  | 'goWrite'
  | 'goCanvas'
  | 'goTools'
  | 'goSettings';

export function actionForGoSequenceKey(key: string): GoSequenceAction | null {
  switch (key.toLowerCase()) {
    case 'h':
      return 'goHome';
    case 'c':
      return 'goCores';
    case 'l':
      return 'goLibrary';
    case 'w':
    case 'm':
      return 'goWrite';
    case 'v':
      return 'goCanvas';
    case 't':
    case 'a':
      return 'goTools';
    case 's':
      return 'goSettings';
    default:
      return null;
  }
}

/**
 * Registers global keyboard shortcuts for power-user navigation.
 *
 * Shortcuts are suppressed when the user is typing in an input, textarea,
 * or contentEditable element, except Escape and the command palette shortcut.
 */
export function useKeyboardShortcuts(actions: KeyboardShortcutActions) {
  const sequenceRef = useRef<string | null>(null);
  const sequenceTimerRef = useRef<number | null>(null);

  const clearSequence = useCallback(() => {
    sequenceRef.current = null;
    if (sequenceTimerRef.current !== null) {
      window.clearTimeout(sequenceTimerRef.current);
      sequenceTimerRef.current = null;
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Escape always works, even when typing
      if (e.key === 'Escape') {
        clearSequence();
        actions.closeModal?.();
        return;
      }

      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      if (mod && key === 'k') {
        e.preventDefault();
        clearSequence();
        actions.openSearch?.();
        return;
      }

      // Don't trigger shortcuts while the user is typing
      if (isTyping) return;

      if (e.key === '/') {
        e.preventDefault();
        actions.openAsk?.();
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        actions.openHelp?.();
        return;
      }

      if (sequenceRef.current === 'g') {
        e.preventDefault();
        clearSequence();
        const action = actionForGoSequenceKey(key);
        if (action) actions[action]?.();
        return;
      }

      if (key === 'g') {
        e.preventDefault();
        sequenceRef.current = 'g';
        sequenceTimerRef.current = window.setTimeout(clearSequence, 1200);
        return;
      }
    },
    [actions, clearSequence],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
