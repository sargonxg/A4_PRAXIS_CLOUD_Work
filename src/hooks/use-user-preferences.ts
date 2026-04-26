'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_USER_PREFERENCES,
  type UserPreferences,
} from '@/types/preferences';

interface UseUserPreferencesOptions {
  enabled?: boolean;
}

export function useUserPreferences(options: UseUserPreferencesOptions = {}) {
  const enabled = options.enabled ?? true;
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setPreferences(DEFAULT_USER_PREFERENCES);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    fetch('/api/preferences')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled && data && !data.error) {
          setPreferences({ ...DEFAULT_USER_PREFERENCES, ...data });
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(String(err));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const save = useCallback(async (patch: Partial<UserPreferences>) => {
    if (!enabled) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error ?? `HTTP ${res.status}`);
      }
      const next = await res.json();
      if (next && !next.error) {
        setPreferences({ ...DEFAULT_USER_PREFERENCES, ...next });
        setSavedAt(new Date().toISOString());
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setIsSaving(false);
    }
  }, [enabled]);

  return { preferences, setPreferences, isLoading, isSaving, savedAt, error, save };
}

