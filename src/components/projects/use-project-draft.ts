'use client';

import { useEffect, useRef, useState } from 'react';
import type { ZodType } from 'zod';

/** Temporary recovery only. Authenticated saved records remain server-owned. */
export function useProjectDraft<T>(key: string, initial: T, revision: number, schema: ZodType<T>, onDirty: (dirty: boolean) => void) {
  const [value, setValue] = useState(initial);
  const [recovered, setRecovered] = useState(false);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const recoveredRevision = useRef<number | undefined>(undefined);
  const storageKey = `praxis-unsaved-project:${key}`;
  useEffect(() => {
    let live = true;
    queueMicrotask(() => {
      if (!live) return;
      try {
        const raw = sessionStorage.getItem(storageKey);
        if (!raw) return;
        const record = JSON.parse(raw) as { value: unknown; revision?: unknown };
        const parsed = schema.safeParse(record.value);
        if (!parsed.success || !Number.isSafeInteger(record.revision)) { sessionStorage.removeItem(storageKey); return; }
        if (JSON.stringify(parsed.data) !== JSON.stringify(initial)) {
          setValue(parsed.data); recoveredRevision.current = record.revision as number; setRecovered(true); onDirty(true);
        } else sessionStorage.removeItem(storageKey);
      } catch { setStorageUnavailable(true); }
    });
    return () => { live = false; };
    // Recovery occurs once per mounted editor; new saved props must never overwrite unsaved edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);
  function update(next: T) {
    setValue(next);
    const dirty = JSON.stringify(next) !== JSON.stringify(initial);
    onDirty(dirty);
    try {
      if (dirty) sessionStorage.setItem(storageKey, JSON.stringify({ value: next, revision: recoveredRevision.current ?? revision }));
      else sessionStorage.removeItem(storageKey);
    } catch { setStorageUnavailable(true); }
  }
  function clear() {
    try { sessionStorage.removeItem(storageKey); } catch { setStorageUnavailable(true); }
    recoveredRevision.current = undefined; setRecovered(false);
  }
  return { value, update, clear, recovered, storageUnavailable, expectedRevision: recoveredRevision.current };
}
