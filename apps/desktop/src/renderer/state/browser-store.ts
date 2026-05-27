// Renderer-side state. The main process is the source of truth for
// tabs/history/etc; we mirror it here for fast UI rendering and update
// on TAB_UPDATED broadcasts.

import { create } from 'zustand';
import type { AppSettings, TabState } from '../../shared/ipc.js';

interface BrowserStoreState {
  tabs: TabState[];
  aiPanelOpen: boolean;
  searchProvider: AppSettings['searchProvider'];
  showSettings: boolean;
  showAbout: boolean;
  setTabs: (tabs: TabState[]) => void;
  toggleAiPanel: () => void;
  setAiPanelOpen: (open: boolean) => void;
  setSearchProvider: (searchProvider: AppSettings['searchProvider']) => void;
  openSettings: () => void;
  closeSettings: () => void;
  openAbout: () => void;
  closeAbout: () => void;
}

export const useBrowserStore = create<BrowserStoreState>((set) => ({
  tabs: [],
  aiPanelOpen: false,
  searchProvider: 'bullebrowser',
  showSettings: false,
  showAbout: false,
  setTabs: (tabs) => set({ tabs }),
  toggleAiPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),
  setAiPanelOpen: (open) => set({ aiPanelOpen: open }),
  setSearchProvider: (searchProvider) => set({ searchProvider }),
  openSettings: () => set({ showSettings: true }),
  closeSettings: () => set({ showSettings: false }),
  openAbout: () => set({ showAbout: true }),
  closeAbout: () => set({ showAbout: false }),
}));

export const activeTabSelector = (s: BrowserStoreState): TabState | undefined =>
  s.tabs.find((t) => t.active);
