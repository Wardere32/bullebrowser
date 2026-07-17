import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { skills, ASSISTANTS, providerFor, type ModelId } from '@bullebrowser/agent-core';
import { useAgentStore } from '../state/agent-store.js';
import { AGENT_PROMPT_EVENT } from '../lib/url.js';
import { expandSlashCommand, SLASH_COMMANDS } from '../lib/slash-commands.js';
import { useInputActivity } from '../hooks/useInputActivity.js';
import type { AppSettings } from '../../shared/ipc.js';
import type { AgentStepEvent } from '../../shared/agent-events.js';

export const FOCUS_AI_PANEL_EVENT = 'bullebrowser:focus-ai-panel';

function browserBridge(): any {
  return (window as unknown as { bullebrowser: any }).bullebrowser;
}

const MODELS = ASSISTANTS;

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
  const [model, setModel] = useState<ModelId>('claude-opus-4-7');
  // null = not checked yet, so we render neither the chat nor the connect
  // form until we know, instead of flashing the wrong one.
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const runInProgress = status === 'running';
  const promptActivity = useInputActivity();

  useEffect(() => {
    void (async () => {
      const bridge = browserBridge();
      const settings: AppSettings = await bridge.settings.get();
      setModel(settings.defaultModel);
      setHasKey(await bridge.secrets.hasApiKey(providerFor(settings.defaultModel)));
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

  // Each assistant has its own credential, so switching engines has to
  // re-check — otherwise picking one whose key isn't saved would show a
  // working chat that fails auth on send.
  useEffect(() => {
    void browserBridge()
      .secrets.hasApiKey(providerFor(model))
      .then((present: boolean) => setHasKey(present));
  }, [model]);

  // The task the "Allow Access" prompt is asking about — always the message
  // that kicked off the current run.
  const lastUserMessage =
    [...(current?.messages ?? [])].reverse().find((m) => m.role === 'user')
      ?.content ?? '';

  // A key can be revoked or deleted while the app is open; when a run dies on
  // an auth error, drop back to the connect form rather than leaving the user
  // retrying a chat that cannot work.
  useEffect(() => {
    if (status !== 'error') return;
    if (!/api key|401|Settings and paste/i.test(currentStep)) return;
    void browserBridge()
      .secrets.hasApiKey(providerFor(model))
      .then((present: boolean) => setHasKey(present));
  }, [status, currentStep, model]);

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
          onChange={(e) => setModel(e.target.value as ModelId)}
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
        {hasKey === false && <ConnectKey model={model} onConnected={() => setHasKey(true)} />}
        {hasKey === true && current && current.messages.length === 0 && (
          <EmptyState />
        )}
        {hasKey === true &&
          current?.messages.map((m, i) => (
            <Bubble key={i} role={m.role} content={m.content} />
          ))}
        <AllowAccess task={lastUserMessage} />
        {hasKey === true && (status === 'running' || status === 'error') && (
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
        {hasKey === false ? (
          <div className="px-1 py-2 text-[11px] text-ink-secondary">
            Connect your key above to start chatting.
          </div>
        ) : (
          <>
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
          </>
        )}
      </footer>
    </aside>
  );
}

// Without a key the agent cannot answer at all, so this replaces the chat
// rather than sitting beside it — the previous behaviour surfaced the failure
// as one line of small red text in the step feed, which read as "the chat is
// just broken".
function ConnectKey({ model, onConnected }: { model: ModelId; onConnected: () => void }) {
  const assistant = ASSISTANTS.find((a) => a.id === model);
  const provider = providerFor(model);
  const hint = provider === 'openai' ? 'sk-…' : 'sk-ant-…';
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const connect = async () => {
    if (!key.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      await browserBridge().secrets.setApiKey(key.trim(), provider);
      setKey('');
      onConnected();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save that key.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 pt-2 text-sm">
      <p className="text-[15px] font-semibold tracking-tight text-ink-primary">
        Connect {assistant?.label ?? 'BulleBrowser AI'}
      </p>
      <p className="leading-relaxed text-ink-secondary">
        BulleBrowser needs your {assistant?.label ?? ''} key before it can browse
        or answer. It&apos;s encrypted and stored on this device only — no
        keychain prompt, and it never leaves your machine.
      </p>
      <input
        type="password"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void connect();
        }}
        placeholder={hint}
        autoComplete="off"
        spellCheck={false}
        className="w-full rounded-md border border-line px-3 py-2 font-mono text-xs focus:border-primary focus:outline-none"
      />
      {error && <div className="text-xs text-danger">{error}</div>}
      <button
        type="button"
        onClick={() => void connect()}
        disabled={!key.trim() || busy}
        className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover disabled:bg-line"
      >
        {busy ? 'Connecting…' : 'Connect'}
      </button>
    </div>
  );
}

// The once-per-task browsing consent, answered in the chat next to the task it
// belongs to rather than in a modal over the page.
function AllowAccess({ task }: { task: string }) {
  const pending = useAgentStore((s) => s.pendingConfirm);
  const setPending = useAgentStore((s) => s.setPendingConfirm);
  if (!pending || pending.kind !== 'browse_access') return null;

  const reply = (approved: boolean) => {
    void browserBridge().agent.replyConfirm(pending.runId, pending.id, approved);
    setPending(null);
  };

  return (
    <div className="mb-6 rounded-xl border border-line/60 bg-surface-muted/40 p-4">
      <div className="text-[13px] font-medium text-ink-primary">
        Allow Access
      </div>
      <p className="mt-1 text-xs leading-relaxed text-ink-secondary">
        BulleBrowser wants to browse the web in your tabs to do this:
        <span className="mt-1 block italic text-ink-primary">“{task}”</span>
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => reply(true)}
          className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover"
        >
          Allow Access
        </button>
        <button
          type="button"
          onClick={() => reply(false)}
          className="rounded border border-line px-3 py-1.5 text-xs text-ink-secondary hover:bg-surface-muted"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="space-y-6 pt-2 text-sm">
      <p className="text-[15px] font-semibold tracking-tight text-ink-primary">
        What can I help you browse?
      </p>
      <p className="leading-relaxed text-ink-secondary">
        Describe a task and I&apos;ll use your live tabs to browse, read, compare,
        and report back.
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
