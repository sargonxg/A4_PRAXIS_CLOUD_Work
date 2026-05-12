'use client';

import { useEffect, useRef, useState } from 'react';
import type { JSONContent } from '@tiptap/core';
import type { MemoBlock } from '@/types/memo';

const DB_NAME = 'praxis-writer';
const STORE_NAME = 'drafts';

type SaveState = 'idle' | 'saving' | 'saved' | 'local' | 'error';

function openWriterDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function putLocal(key: string, value: unknown) {
  const db = await openWriterDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getLocalWriterDraft<T>(key: string): Promise<T | null> {
  const db = await openWriterDb();
  const value = await new Promise<T | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return value;
}

export function useWriterAutosave(input: {
  key: string;
  title: string;
  caseId: string;
  docId: string;
  templateId: 'policy-memo' | 'sit-rep' | 'talking-points' | 'mandate-brief' | 'mediation-summary' | 'frame-analysis';
  json: JSONContent | null;
  html: string;
  markdown: string;
  blocks: MemoBlock[];
}) {
  const [state, setState] = useState<SaveState>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const localTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!input.json || input.blocks.length === 0) return;
    if (localTimer.current) clearTimeout(localTimer.current);
    if (remoteTimer.current) clearTimeout(remoteTimer.current);
    setState('saving');

    localTimer.current = setTimeout(() => {
      void putLocal(input.key, {
        docId: input.docId,
        title: input.title,
        json: input.json,
        html: input.html,
        markdown: input.markdown,
        updatedAt: new Date().toISOString(),
      })
        .then(() => setState('local'))
        .catch(() => setState('error'));
    }, 500);

    remoteTimer.current = setTimeout(async () => {
      try {
        const response = await fetch('/api/memos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            caseId: input.caseId,
            templateId: input.templateId,
            title: input.title,
            blocks: input.blocks,
            graphSnapshotId: `${input.caseId}:writer:${input.docId}`,
            status: 'draft',
            changeNote: 'Autosaved from PraxisWriter',
          }),
        });
        if (!response.ok) throw new Error('remote save failed');
        const body = await response.json().catch(() => ({}));
        setLastSavedAt(typeof body?.memo?.updatedAt === 'string' ? body.memo.updatedAt : new Date().toISOString());
        setState('saved');
      } catch {
        setState('local');
      }
    }, 3000);

    return () => {
      if (localTimer.current) clearTimeout(localTimer.current);
      if (remoteTimer.current) clearTimeout(remoteTimer.current);
    };
  }, [input.blocks, input.caseId, input.docId, input.html, input.json, input.key, input.markdown, input.templateId, input.title]);

  return { state, lastSavedAt };
}
