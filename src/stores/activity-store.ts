import { create } from 'zustand';

export type OperationStatus = 'pending' | 'running' | 'completed' | 'failed';
export type OperationType = 'ai-generation' | 'data-fetch' | 'pipeline' | 'research' | 'export';

export interface ActiveOperation {
  id: string;
  type: OperationType;
  tool: string;
  label: string;
  status: OperationStatus;
  progress?: number; // 0-100
  startedAt: string;
  completedAt?: string;
  error?: string;
  situationId?: string;
}

interface ActivityStore {
  operations: ActiveOperation[];
  isOpen: boolean;

  startOperation: (op: Omit<ActiveOperation, 'status' | 'startedAt'>) => void;
  updateOperation: (id: string, updates: Partial<ActiveOperation>) => void;
  completeOperation: (id: string) => void;
  failOperation: (id: string, error: string) => void;
  clearCompleted: () => void;
  toggle: () => void;
}

const MAX_OPERATIONS = 100;

export const useActivityStore = create<ActivityStore>((set) => ({
  operations: [],
  isOpen: false,

  startOperation: (op) =>
    set((state) => ({
      operations: [
        { ...op, status: 'running' as const, startedAt: new Date().toISOString() },
        ...state.operations,
      ].slice(0, MAX_OPERATIONS),
    })),

  updateOperation: (id, updates) =>
    set((state) => ({
      operations: state.operations.map((op) =>
        op.id === id ? { ...op, ...updates } : op
      ),
    })),

  completeOperation: (id) =>
    set((state) => ({
      operations: state.operations.map((op) =>
        op.id === id
          ? { ...op, status: 'completed' as const, completedAt: new Date().toISOString() }
          : op
      ),
    })),

  failOperation: (id, error) =>
    set((state) => ({
      operations: state.operations.map((op) =>
        op.id === id
          ? { ...op, status: 'failed' as const, error, completedAt: new Date().toISOString() }
          : op
      ),
    })),

  clearCompleted: () =>
    set((state) => ({
      operations: state.operations.filter(
        (op) => op.status === 'running' || op.status === 'pending'
      ),
    })),

  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));
