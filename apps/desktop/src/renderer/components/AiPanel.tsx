import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { skills } from '@bullebrowser/agent-core';
import type { ClaudeModelId } from '@bullebrowser/agent-core';
import { useAgentStore } from '../state/agent-store.js';
import { useBrowserStore } from '../state/browser-store.js';
import { AGENT_PROMPT_EVENT } from '../lib/url.js';
import { expandSlashCommand, SLASH_COMMANDS } from '../lib/slash-commands.js';
import { useInputActivity } from '../hooks/useInputActivity.js';
import type { AppSettings } from '../../shared/ipc.js';
import type { AgentStepEvent } from '../../shared/agent-events.js';

export const FOCUS_AI_PANEL_EVENT = 'bullebrowser:focus-ai-panel';

function browserBridge(): any {
  return (window as unknown as { bullebrowser: any }).bullebrowser;
}

const MODELS: { id: ClaudeModelId; label: string }[] = [
  { id: 'claude-opus-4-7', label: 'BulleBrowser Pro (most capable)' },
  { id: 'claude-sonnet-4-6', label: 'BulleBrowser Balanced' },
  { id: 'claude-haiku-4-5-20251001', label: 'BulleBrowser Fastest' },
];

export function AiPanel() {
  const current = useAgentStore((s) => s.current);
  const setCurrent = useAgentStore((s) => s.setCurrent);
  const setConversations = useAgentStore((s) => s.setConversations);
  const startRun = useAgentStore((s) => s.startRun);
  const status = useAgentStore((s) => s.status);
  const steps = useAgentStore((s) => s.steps);
  const currentStep = useAgentStore((s) => s.currentStep);
  const runId = useAgentStore((s) => s.runId);
  const [draft, setDraft] = useState('');
  const [skillId, setSkillId] = useState<string>('');
  const [model, setModel] = useState<ClaudeModelId>('claude-opus-4-7');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const runInProgress = status === 'running';
  const promptActivity = useInputActivity();

  useEffect(() => {
    void (async () => {
      const bridge = browserBridge();
      const settings: AppSettings = await bridge.settings.get();
      setModel(settings.defaultModel);
      const list = await bridge.conversations.list();
      setConversations(list);
      if (list.length === 0) {
        const first = await bridge.conversations.create();
        setCurrent(first);
      } else if (list[0]) {
        const detail = await bridge.conversations.get(list[0].id);
        setCurrent(detail);
      }
    })();
  }, [setConversations, setCurrent]);

  const sendMessage = async (text: string) => {
    const raw = text.trim();
    if (!raw || !current) return;
    // Slash commands expand client-side into a fully formed agent prompt so
    // the model sees a plain task and the user sees what they typed.
    const expanded = expandSlashCommand(raw);
    if (expanded?.echo === 'help') {
      setCurrent({
        ...current,
        messages: [
          ...current.messages,
          { role: 'user', content: raw, timestamp: Date.now() },
          {
            role: 'assistant',
            content: slashHelpText(),
            timestamp: Date.now(),
          },
        ],
      });
      return;
    }
    const message = expanded?.prompt ?? raw;
    setCurrent({
      ...current,
      messages: [
        ...current.messages,
        { role: 'user', content: raw, timestamp: Date.now() },
      ],
    });
    const bridge = browserBridge();
    const skill = skillId || undefined;
    const { runId } = await bridge.agent.run({
      conversationId: current.id,
      userMessage: message,
      model,
      ...(skill ? { skillId: skill } : {}),
    });
    startRun(runId);
  };

  const send = async () => {
    if (runInProgress || !draft.trim()) return;
    const t = draft.trim();
    setDraft('');
    promptActivity.reset();
    await sendMessage(t);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (runInProgress) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  // Listen for address-bar agent prompts. The user typed a task into the
  // top-bar address field with the BulleBrowser search engine selected;
  // TopBar dispatched the event and we send it as the next agent message.
  // If we aren't hydrated yet (no current conversation), queue the prompt
  // and flush it once `current` is ready.
  const queuedPrompt = useRef<string | null>(null);
  useEffect(() => {
    const handler = (e: Event) => {
      const text = (e as CustomEvent<string>).detail;
      if (!text) return;
      if (current) void sendMessage(text);
      else queuedPrompt.current = text;
    };
    window.addEventListener(AGENT_PROMPT_EVENT, handler);
    return () => window.removeEventListener(AGENT_PROMPT_EVENT, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  // Cmd+/ focuses the AI panel input — Comet-style "summon the agent".
  useEffect(() => {
    const handler = () => textareaRef.current?.focus();
    window.addEventListener(FOCUS_AI_PANEL_EVENT, handler);
    return () => window.removeEventListener(FOCUS_AI_PANEL_EVENT, handler);
  }, []);

  // Flush any queued address-bar prompt once we're ready.
  useEffect(() => {
    if (current && queuedPrompt.current) {
      const text = queuedPrompt.current;
      queuedPrompt.current = null;
      void sendMessage(text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  useEffect(() => {
    if (!current || current.messages.length > 0 || status === 'running') return;
    textareaRef.current?.focus();
  }, [current, status]);

  const createConversation = async () => {
    const bridge = browserBridge();
    const c = await bridge.conversations.create();
    setCurrent(c);
    setConversations(await bridge.conversations.list());
  };

  return (
    <aside className="flex w-[440px] flex-col border-l border-line/25 bg-surface-light">
      <header className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="text-[13px] font-semibold tracking-tight text-ink-primary">
          BulleBrowser Agent
        </div>
        <button
          type="button"
          onClick={createConversation}
          className="rounded-md px-2 py-1 text-xs text-ink-secondary transition-colors hover:text-ink-primary"
        >
          New chat
        </button>
      </header>

      <div className="flex items-center gap-3 px-4 pb-2 text-xs">
        <select
          value={skillId}
          onChange={(e) => setSkillId(e.target.value)}
          className="flex-1 rounded-md bg-transparent py-1 text-ink-secondary transition-colors hover:text-ink-primary focus:outline-none"
        >
          <option value="">Skills: free chat</option>
          {skills.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value as ClaudeModelId)}
          className="rounded-md bg-transparent py-1 text-ink-secondary transition-colors hover:text-ink-primary focus:outline-none"
        >
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {current && current.messages.length === 0 && <EmptyState />}
        {current?.messages.map((m, i) => (
          <Bubble key={i} role={m.role} content={m.content} />
        ))}
        {(status === 'running' || status === 'error') && (
          <div
            className={`mb-5 space-y-1 text-[11px] ${
              status === 'error'
                ? 'rounded-md bg-danger/5 px-3 py-2 text-danger'
                : 'px-1 text-ink-secondary'
            }`}
          >
            {steps.slice(-6).map((s, i) => (
              <div key={i}>{stepLabel(s)}</div>
            ))}
            {status === 'error' && steps.length === 0 && (
              <div className="text-danger">{currentStep || 'Agent error.'}</div>
            )}
          </div>
        )}
      </div>

      <footer className="border-t border-line/25 p-3">
        {draft.startsWith('/') && !draft.includes(' ') && (
          <div className="mb-1 max-h-32 overflow-y-auto rounded border border-line bg-white text-[11px]">
            {SLASH_COMMANDS.filter((c) => c.name.startsWith(draft.toLowerCase())).map(
              (c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    setDraft(c.fillTemplate ?? `${c.name} `);
                    textareaRef.current?.focus();
                  }}
                  className="block w-full px-2 py-1 text-left hover:bg-surface-muted"
                >
                  <span className="font-mono text-ink-primary">{c.name}</span>
                  <span className="ml-2 text-ink-secondary">{c.description}</span>
                </button>
              ),
            )}
          </div>
        )}
        {skillId && (
          <div className="mb-1 px-1 text-[11px] text-ink-secondary">
            {skills.find((s) => s.id === skillId)?.inputPlaceholder}
          </div>
        )}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <div
              className={`prompt-input-shell prompt-input-shell--chat prompt-input-shell--${promptActivity.state}${
                runInProgress ? ' prompt-input-shell--working' : ''
              }`}
              data-activity-state={promptActivity.state}
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                  e.preventDefault();
                  textareaRef.current?.focus();
                }
              }}
            >
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  promptActivity.onInputActivity();
                }}
                onPaste={() => promptActivity.onInputActivity()}
                onFocus={promptActivity.onFocus}
                onBlur={promptActivity.onBlur}
                onKeyDown={onKeyDown}
                placeholder={
                  'Ask BulleBrowser to do something. It will browse, read, compare, and report back.'
                }
                rows={3}
                className="prompt-input-field"
                aria-busy={runInProgress}
                autoFocus={current?.messages.length === 0}
              />
            </div>
          </div>
          {status === 'running' ? (
            <button
              type="button"
              onClick={() => {
                if (runId) void window.bullebrowser.agent.cancel(runId);
              }}
              className="h-9 rounded border border-danger bg-white px-3 text-sm font-medium text-danger hover:bg-danger/10"
              title="Cancel the running agent"
            >
              Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void send()}
              disabled={!draft.trim()}
              className="h-9 rounded bg-primary px-3 text-sm font-medium text-white hover:bg-primary-hover disabled:bg-line"
            >
              Send
            </button>
          )}
        </div>
      </footer>
    </aside>
  );
}

function EmptyState() {
  return (
    <div className="space-y-6 pt-2 text-sm">
      <p className="text-[15px] font-semibold tracking-tight text-ink-primary">
        What can I help you browse?
      </p>
      <p className="leading-relaxed text-ink-secondary">
        Describe a task and I'll use your live tabs to browse, read, compare, and
        report back.
      </p>
      <div className="space-y-3">
        {skills.map((s) => (
          <div key={s.id}>
            <div className="text-[13px] font-medium text-ink-primary">{s.label}</div>
            <div className="text-xs leading-relaxed text-ink-secondary">
              {s.shortDescription}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Bubble({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  if (role === 'user') {
    return (
      <div className="mb-6 flex justify-end">
        <div className="max-w-[85%] rounded-2xl bg-primary px-3.5 py-2 text-sm leading-relaxed text-white">
          {content}
        </div>
      </div>
    );
  }
  // Assistant replies read as plain prose — no card, no border — for a calm,
  // document-like feel.
  return (
    <div className="mb-6 md-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

function slashHelpText(): string {
  const rows = SLASH_COMMANDS.filter((c) => c.name !== '/help')
    .map((c) => `| \`${c.name}\` | ${c.description} |`)
    .join('\n');
  return [
    '**Slash commands**',
    '',
    '| Command | What it does |',
    '|---|---|',
    rows,
    '',
    'You can always type a task in plain English instead.',
  ].join('\n');
}

function stepLabel(step: AgentStepEvent): string {
  switch (step.kind) {
    case 'thinking':
      return '· Thinking…';
    case 'tool_call':
      return `→ ${step.detail}`;
    case 'tool_result':
      return `  ✓ ${step.toolName}`;
    case 'error':
      return `! ${step.message}`;
    case 'done':
      return '· Done';
    case 'text':
      return '';
  }
}
