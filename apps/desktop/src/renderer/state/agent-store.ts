import { create } from 'zustand';
import type { AgentStepEvent } from '../../shared/agent-events.js';
import type {
  ConversationDetail,
  ConversationSummary,
} from '../../shared/ipc.js';

interface AgentStoreState {
  conversations: ConversationSummary[];
  current: ConversationDetail | null;
  runId: string | null;
  steps: AgentStepEvent[];
  status: 'idle' | 'running' | 'error';
  currentStep: string;
  pendingConfirm: { id: string; runId: string; message: string } | null;
  setConversations: (c: ConversationSummary[]) => void;
  setCurrent: (c: ConversationDetail | null) => void;
  startRun: (runId: string) => void;
  appendStep: (s: AgentStepEvent) => void;
  finishRun: () => void;
  setError: (msg: string) => void;
  setPendingConfirm: (
    p: { id: string; runId: string; message: string } | null,
  ) => void;
}

export const useAgentStore = create<AgentStoreState>((set) => ({
  conversations: [],
  current: null,
  runId: null,
  steps: [],
  status: 'idle',
  currentStep: '',
  pendingConfirm: null,
  setConversations: (conversations) => set({ conversations }),
  setCurrent: (current) => set({ current, steps: [], status: 'idle' }),
  startRun: (runId) =>
    set({ runId, steps: [], status: 'running', currentStep: 'Thinking…' }),
  appendStep: (s) =>
    set((state) => {
      const next = [...state.steps, s];
      let currentStep = state.currentStep;
      if (s.kind === 'thinking') currentStep = 'Thinking…';
      if (s.kind === 'tool_call') currentStep = s.detail;
      if (s.kind === 'done') currentStep = '';
      return { steps: next, currentStep };
    }),
  finishRun: () => set({ status: 'idle', runId: null, currentStep: '' }),
  // An error means the run is over too — clear runId so the chrome
  // doesn't keep a stale handle on the failed run.
  setError: (msg) => set({ status: 'error', currentStep: msg, runId: null }),
  setPendingConfirm: (pendingConfirm) => set({ pendingConfirm }),
}));
