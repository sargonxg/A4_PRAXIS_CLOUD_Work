'use client';

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcutActions {
  openSearch?: () => void;
  newReport?: () => void;
  openAssistant?: () => void;
  openConflictGraph?: () => void;
  openDashboard?: () => void;
  closeModal?: () => void;
}

/**
 * Registers global keyboard shortcuts for power-user navigation.
 *
 * Shortcuts are suppressed when the user is typing in an input, textarea,
 * or contentEditable element — except for Escape, which always fires.
 */
export function useKeyboardShortcuts(actions: KeyboardShortcutActions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Escape always works, even when typing
      if (e.key === 'Escape') {
        actions.closeModal?.();
        return;
      }

      // Don't trigger shortcuts while the user is typing
      if (isTyping) return;

      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key === 'k') {
        e.preventDefault();
        actions.openSearch?.();
        return;
      }

      if (mod && e.key === 'n') {
        e.preventDefault();
        actions.newReport?.();
        return;
      }

      if (mod && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        actions.openAssistant?.();
        return;
      }

      if (mod && e.shiftKey && (e.key === 'G' || e.key === 'g')) {
        e.preventDefault();
        actions.openConflictGraph?.();
        return;
      }

      if (mod && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        actions.openDashboard?.();
        return;
      }
    },
    [actions],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
