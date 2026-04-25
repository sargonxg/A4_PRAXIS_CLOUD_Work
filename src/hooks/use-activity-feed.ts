'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export type Semaphore = 'grey' | 'blue' | 'purple' | 'yellow' | 'green' | 'red';

export interface ToolRunRow {
  toolRunId: string;
  uid: string;
  situationId: string | null;
  toolId: string;
  variant: 'oneshot' | 'streaming' | 'agent';
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  semaphore: Semaphore;
  startedAt: Timestamp;
  completedAt: Timestamp | null;
  durationMs: number | null;
  model: string | null;
  creditsDeducted: number;
  outputDocPath: string | null;
  error: { code: string; message: string } | null;
}

export interface BackgroundJobRow {
  jobId: string;
  uid: string | null;
  kind: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'dead_letter';
  semaphore: Semaphore;
  progress: { percent: number; message: string } | null;
  attempt: number;
  maxAttempts: number;
  error: { code: string; message: string } | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface NotificationRow {
  notificationId: string;
  kind: string;
  semaphore: Semaphore;
  title: string;
  body: string;
  situationId: string | null;
  toolRunId: string | null;
  jobId: string | null;
  actionUrl: string | null;
  read: boolean;
  archived: boolean;
  createdAt: Timestamp;
}

/**
 * Subscribes to the most recent tool_runs for a given user (and optionally
 * a single situation). Returns a live array sorted newest first.
 */
export function useToolRuns(uid: string | null, situationId?: string, max = 50): ToolRunRow[] {
  const [rows, setRows] = useState<ToolRunRow[]>([]);
  useEffect(() => {
    if (!uid) return;
    const constraints = situationId
      ? [where('situationId', '==', situationId)]
      : [where('uid', '==', uid)];
    const q = query(
      collection(db, 'tool_runs'),
      ...constraints,
      orderBy('startedAt', 'desc'),
      limit(max),
    );
    return onSnapshot(q, (snap) => {
      setRows(snap.docs.map((d) => d.data() as ToolRunRow));
    });
  }, [uid, situationId, max]);
  return rows;
}

export function useBackgroundJobs(uid: string | null, max = 50): BackgroundJobRow[] {
  const [rows, setRows] = useState<BackgroundJobRow[]>([]);
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, 'background_jobs'),
      where('uid', '==', uid),
      orderBy('updatedAt', 'desc'),
      limit(max),
    );
    return onSnapshot(q, (snap) => {
      setRows(snap.docs.map((d) => d.data() as BackgroundJobRow));
    });
  }, [uid, max]);
  return rows;
}

export function useNotifications(uid: string | null, max = 50): NotificationRow[] {
  const [rows, setRows] = useState<NotificationRow[]>([]);
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, 'users', uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(max),
    );
    return onSnapshot(q, (snap) => {
      setRows(snap.docs.map((d) => d.data() as NotificationRow));
    });
  }, [uid, max]);
  return rows;
}
