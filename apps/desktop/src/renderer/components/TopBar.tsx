import { useEffect, useRef, useState } from 'react';
import { useBrowserStore, activeTabSelector } from '../state/browser-store.js';
import { useAgentStore } from '../state/agent-store.js';
import { AGENT_PROMPT_EVENT, parseAddressBarInput } from '../lib/url.js';
import { useInputActivity } from '../hooks/useInputActivity.js';
import logo from '@bullebrowser/brand-tokens/logo.svg';

export function TopBar() {
  const active = useBrowserStore(activeTabSelector);
  const aiPanelOpen = useBrowserStore((s) => s.aiPanelOpen);
  const toggleAi = useBrowserStore((s) => s.toggleAiPanel);
  const setAiPanelOpen = useBrowserStore((s) => s.setAiPanelOpen);
  const openSettings = useBrowserStore((s) => s.openSettings);
  const openAbout = useBrowserStore((s) => s.openAbout);
  const currentStep = useAgentStore((s) => s.currentStep);
  const status = useAgentStore((s) => s.status);
  const runId = useAgentStore((s) => s.runId);
  const searchProvider = useBrowserStore((s) => s.searchProvider);
  const [draftUrl, setDraftUrl] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const addressActivity = useInputActivity();

  useEffect(() => {
    setDraftUrl(active?.url === 'about:blank' ? '' : (active?.url ?? ''));
  }, [active?.url]);

  useEffect(() => {
    const handler = () => inputRef.current?.select();
    window.addEventListener('bullebrowser:focus-address', handler);
    return () => window.removeEventListener('bullebrowser:focus-address', handler);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!active) return;
    const action = parseAddressBarInput(draftUrl, searchProvider);
    if (action.type === 'agent') {
      // BulleBrowser address bar → AI agent. Open the panel and hand
      // the prompt off via a custom event so AiPanel can send it.
      setAiPanelOpen(true);
      window.dispatchEvent(
        new CustomEvent<string>(AGENT_PROMPT_EVENT, { detail: action.prompt }),
      );
      setDraftUrl('');
      return;
    }
    void window.bullebrowser.tabs.navigate(active.id, action.url);
  };

  return (
    <header className="drag-region flex h-11 items-center gap-2 border-b border-line/30 bg-surface-dark px-3 text-ink-inverse">
      <img src={logo} alt="" width={20} height={20} className="no-drag opacity-95" />
      <div className="no-drag flex items-center gap-1">
        <NavBtn
          label="Back"
          disabled={!active?.canGoBack}
          onClick={() => active && window.bullebrowser.tabs.back(active.id)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </NavBtn>
        <NavBtn
          label="Forward"
          disabled={!active?.canGoForward}
          onClick={() => active && window.bullebrowser.tabs.forward(active.id)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </NavBtn>
        <NavBtn
          label="Reload"
          onClick={() => active && window.bullebrowser.tabs.reload(active.id)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-3-6.7" />
            <path d="M21 4v5h-5" />
          </svg>
        </NavBtn>
      </div>

      <form onSubmit={submit} className="no-drag flex-1">
        <div
          className={`h-7 prompt-input-shell prompt-input-shell--dark prompt-input-shell--${addressActivity.state}`}
          data-activity-state={addressActivity.state}
        >
          <input
            ref={inputRef}
            type="text"
            value={draftUrl}
            onChange={(e) => {
              setDraftUrl(e.target.value);
              addressActivity.onInputActivity();
            }}
            onPaste={() => addressActivity.onInputActivity()}
            onFocus={addressActivity.onFocus}
            onBlur={addressActivity.onBlur}
            placeholder="Ask BulleBrowser or enter address"
            aria-label="Address bar"
            className="prompt-input-field prompt-input-field--singleline prompt-input-field--dark"
          />
        </div>
      </form>

      {status === 'running' && (
        <div className="no-drag flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs text-accent">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
          <span className="max-w-[280px] truncate">{currentStep || 'Agent is working…'}</span>
          <button
            type="button"
            className="rounded bg-white/10 px-2 py-0.5 text-[11px] hover:bg-white/20"
            onClick={() => runId && window.bullebrowser.agent.cancel(runId)}
          >
            Stop
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={toggleAi}
        className={`no-drag rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
          aiPanelOpen
            ? 'bg-primary text-white'
            : 'bg-white/10 text-ink-inverse hover:bg-white/20'
        }`}
        aria-pressed={aiPanelOpen}
      >
        Agent
      </button>

      <div className="no-drag relative">
        <button
          type="button"
          onClick={() => setProfileOpen((v) => !v)}
          className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-xs font-semibold text-ink-inverse hover:bg-white/20"
          aria-label="Profile menu"
        >
          B
        </button>
        {profileOpen && (
          <div className="absolute right-0 top-9 z-50 w-48 overflow-hidden rounded-md border border-line bg-surface-light text-ink-primary shadow-lg">
            <MenuItem
              onClick={() => {
                openSettings();
                setProfileOpen(false);
              }}
            >
              Settings
            </MenuItem>
            <MenuItem
              onClick={() => {
                openAbout();
                setProfileOpen(false);
              }}
            >
              About BulleBrowser
            </MenuItem>
            <MenuItem
              onClick={() => {
                setProfileOpen(false);
                void window.bullebrowser.app.quit();
              }}
            >
              Quit
            </MenuItem>
          </div>
        )}
      </div>
    </header>
  );
}

function NavBtn({
  children,
  label,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded-md text-ink-inverse transition-colors hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

function MenuItem({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-muted"
    >
      {children}
    </button>
  );
}
