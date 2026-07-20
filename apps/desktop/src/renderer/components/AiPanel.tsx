import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { product } from '@bullebrowser/brand-tokens';
import { skills, ASSISTANTS, providerFor, type ModelId } from '@bullebrowser/agent-core';
import { useAgentStore } from '../state/agent-store.js';
import { AGENT_PROMPT_EVENT } from '../lib/url.js';
import { expandSlashCommand, SLASH_COMMANDS } from '../lib/slash-commands.js';
import { useInputActivity } from '../hooks/useInputActivity.js';
import { VoiceOverlay } from './VoiceOverlay.js';
import { AttachMenu, type UiAttachment } from './AttachMenu.js';
import type {
  AppSettings,
  ConversationSummary,
  RunAttachment,
} from '../../shared/ipc.js';
import type { AgentStepEvent } from '../../shared/agent-events.js';

// A task waiting behind the running one, carrying whatever was attached when it
// was queued so its context isn't lost by the time it runs.
interface QueuedTask {
  text: string;
  attachments: UiAttachment[];
}

// UI attachment references → the wire shape the agent run accepts.
function toRunAttachments(list: UiAttachment[]): RunAttachment[] {
  return list.map((a) =>
    a.kind === 'file'
      ? { kind: 'file', fileId: a.fileId, name: a.name }
      : a.kind === 'project'
        ? { kind: 'project', projectId: a.projectId, name: a.name }
        : { kind: 'screenshot', url: a.url },
  );
}

export const FOCUS_AI_PANEL_EVENT = 'bullebrowser:focus-ai-panel';

function browserBridge(): any {
  return (window as unknown as { bullebrowser: any }).bullebrowser;
}

const MODELS = ASSISTANTS;

export function AiPanel() {
  const current = useAgentStore((s) => s.current);
  const setCurrent = useAgentStore((s) => s.setCurrent);
  // The history list renders from this; without the selector the identifier is
  // simply undefined and opening History throws.
  const conversations = useAgentStore((s) => s.conversations);
  const setConversations = useAgentStore((s) => s.setConversations);
  const startRun = useAgentStore((s) => s.startRun);
  const status = useAgentStore((s) => s.status);
  const steps = useAgentStore((s) => s.steps);
  const currentStep = useAgentStore((s) => s.currentStep);
  const runId = useAgentStore((s) => s.runId);
  const [draft, setDraft] = useState('');
  // Tasks the user submitted while a run was already going. They run one after
  // another as each finishes, so the user can queue up work instead of waiting.
  const [queued, setQueued] = useState<QueuedTask[]>([]);
  // Context attached to the NEXT message via the "+" menu (files, a project, a
  // screenshot). Cleared when that message is sent or queued.
  const [attachments, setAttachments] = useState<UiAttachment[]>([]);
  // Voice input overlay: null when off, otherwise the active mode.
  const [voiceMode, setVoiceMode] = useState<'once' | 'continuous' | null>(null);
  const [skillId, setSkillId] = useState<string>('');
  const [model, setModel] = useState<ModelId>('claude-opus-4-7');
  // null = not checked yet, so we render neither the chat nor the connect
  // form until we know, instead of flashing the wrong one.
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const runInProgress = status === 'running';
  const promptActivity = useInputActivity();

  // Conversation scroll: keep the newest message in view as the agent streams,
  // unless the user has scrolled up to read — then a pointer button appears to
  // jump back down.
  const messagesRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  // Held while a queued task is being dispatched, so the drain effect starts
  // exactly one run at a time (see the drain effect below).
  const drainingRef = useRef(false);
  const onMessagesScroll = () => {
    const el = messagesRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 32);
  };
  const jumpToLatest = () => {
    const el = messagesRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };

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

  const sendMessage = async (text: string, atts: UiAttachment[] = []) => {
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
    const runAttachments = atts.length > 0 ? toRunAttachments(atts) : undefined;
    const { runId } = await bridge.agent.run({
      conversationId: current.id,
      userMessage: message,
      model,
      ...(skill ? { skillId: skill } : {}),
      ...(runAttachments ? { attachments: runAttachments } : {}),
    });
    startRun(runId);
  };

  const send = async () => {
    const t = draft.trim();
    if (!t) return;
    const atts = attachments;
    setDraft('');
    setAttachments([]);
    promptActivity.reset();
    // Busy? Queue it (with its attachments). It'll run when the current task
    // (and anything ahead of it) finishes. Otherwise start it now.
    if (runInProgress || queued.length > 0) {
      setQueued((q) => [...q, { text: t, attachments: atts }]);
      return;
    }
    await sendMessage(t, atts);
  };

  // Drain the queue: whenever the agent goes idle and something is waiting,
  // start the next task. sendMessage flips status back to running, so this
  // won't double-fire until the next task finishes.
  useEffect(() => {
    // `status` only flips to 'running' once agent.run() resolves. Without a
    // synchronous guard this effect re-fires the moment setQueued changes the
    // list — status is still 'idle' — and dispatches the whole queue at once
    // instead of one task after another.
    if (status !== 'idle' || queued.length === 0 || !current || drainingRef.current) return;
    const [next, ...rest] = queued;
    if (!next) return;
    drainingRef.current = true;
    setQueued(rest);
    void sendMessage(next.text, next.attachments).finally(() => {
      drainingRef.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, queued, current]);

  // A transcript from the voice overlay arrives as a finished prompt: fill the
  // composer and send it straight away (one-shot closes the overlay; continuous
  // stays listening for the next command).
  const onVoiceTranscript = (text: string) => {
    const t = text.trim();
    if (!t) return;
    void sendMessage(t, attachments);
    setAttachments([]);
    setDraft('');
  };

  // "Control Browser": give the agent a live tab to drive if there isn't one,
  // and focus the composer so the user can say what to do.
  const controlBrowser = async () => {
    const bridge = browserBridge();
    const tabs = await bridge.tabs.list();
    if (!tabs || tabs.length === 0) await bridge.tabs.create();
    textareaRef.current?.focus();
  };

  // Open bullebrowser.com in a new tab — the brand-mark "home" affordance.
  const openHome = () => {
    void browserBridge().tabs.create(`https://${product.domain}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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

  // Follow the conversation as it grows / streams, but only when already
  // pinned to the bottom, so scrolling up to re-read isn't yanked back down.
  useEffect(() => {
    const el = messagesRef.current;
    if (el && atBottom) el.scrollTop = el.scrollHeight;
  }, [current?.messages, steps, status, atBottom]);

  const createConversation = async () => {
    const bridge = browserBridge();
    const c = await bridge.conversations.create();
    setCurrent(c);
    setShowHistory(false);
    setConversations(await bridge.conversations.list());
  };

  const openConversation = async (id: string) => {
    const detail = await browserBridge().conversations.get(id);
    if (detail) setCurrent(detail);
    setShowHistory(false);
  };

  const deleteConversation = async (id: string) => {
    const bridge = browserBridge();
    await bridge.conversations.delete(id);
    const list = await bridge.conversations.list();
    setConversations(list);
    // If the open chat was the one deleted, fall back to the newest remaining
    // chat, or a fresh one if none are left, so the panel is never left empty.
    if (current?.id === id) {
      if (list[0]) await openConversation(list[0].id);
      else await createConversation();
    }
  };

  return (
    <aside className="relative flex w-[440px] flex-col border-l border-line/25 bg-surface-light">
      {voiceMode && (
        <VoiceOverlay
          mode={voiceMode}
          onTranscript={onVoiceTranscript}
          onClose={() => setVoiceMode(null)}
        />
      )}
      <header className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="text-[13px] font-semibold tracking-tight text-ink-primary">
          BulleBrowser Agent
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={async () => {
              setConversations(await browserBridge().conversations.list());
              setShowHistory((v) => !v);
            }}
            className={`rounded-md px-2 py-1 text-xs transition-colors ${
              showHistory ? 'text-ink-primary' : 'text-ink-secondary hover:text-ink-primary'
            }`}
          >
            History
          </button>
          <button
            type="button"
            onClick={createConversation}
            className="rounded-md px-2 py-1 text-xs text-ink-secondary transition-colors hover:text-ink-primary"
          >
            New chat
          </button>
        </div>
      </header>

      {showHistory && (
        <HistoryList
          conversations={conversations}
          currentId={current?.id}
          onOpen={openConversation}
          onDelete={deleteConversation}
          onClose={() => setShowHistory(false)}
        />
      )}

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

      <div className="relative flex flex-1 flex-col overflow-hidden">
      <div
        ref={messagesRef}
        onScroll={onMessagesScroll}
        className="flex-1 overflow-y-auto px-5 py-5"
      >
        {hasKey === false && <ConnectKey model={model} onConnected={() => setHasKey(true)} />}
        {hasKey === true && current && current.messages.length === 0 && (
          <EmptyState />
        )}
        {hasKey === true &&
          current?.messages.map((m, i) => (
            <Bubble key={i} role={m.role} content={m.content} />
          ))}
        {hasKey === true && (status === 'running' || status === 'error') && (
          <ActivityFeed steps={steps} status={status} currentStep={currentStep} />
        )}
      </div>

        {/* Pointer arrow → jump to the latest message. Shown only when the
            user has scrolled up, so it never covers the newest reply. */}
        {!atBottom && (
          <button
            type="button"
            onClick={jumpToLatest}
            aria-label="Jump to latest message"
            className="absolute bottom-3 right-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-ink-primary shadow-md transition-transform hover:scale-105"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M6 13l6 6 6-6" />
            </svg>
          </button>
        )}
      </div>

      {/* Outside the scroll area on purpose: a consent prompt the user has to
          go looking for is a consent prompt they will click through blind. It
          sits directly above the composer, always in view. */}
      <AllowAccess task={lastUserMessage} />

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
        {queued.length > 0 && (
          <div className="mb-1.5 space-y-1">
            <div className="px-1 text-[10px] font-medium uppercase tracking-wide text-ink-secondary">
              Queued · runs next
            </div>
            {queued.map((q, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-md bg-surface-muted/60 px-2 py-1 text-[11px] text-ink-secondary"
              >
                <span className="flex-1 truncate">{q.text}</span>
                {q.attachments.length > 0 && (
                  <span className="shrink-0 text-[10px] text-ink-secondary">
                    +{q.attachments.length}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setQueued((list) => list.filter((_, j) => j !== i))}
                  className="shrink-0 text-ink-secondary hover:text-danger"
                  title="Remove from queue"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        {attachments.length > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            {attachments.map((a, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-muted/60 py-1 pl-1.5 pr-1 text-[11px] text-ink-primary"
              >
                {a.kind === 'screenshot' ? (
                  <img src={a.thumb} alt="" className="h-4 w-6 rounded object-cover" />
                ) : (
                  <span className="text-primary">{a.kind === 'project' ? '▣' : '📄'}</span>
                )}
                <span className="max-w-[150px] truncate">
                  {a.kind === 'project' ? `Project: ${a.name}` : a.kind === 'screenshot' ? 'Screenshot' : a.name}
                </span>
                <button
                  type="button"
                  onClick={() => setAttachments((list) => list.filter((_, j) => j !== i))}
                  className="ml-0.5 rounded px-1 text-ink-secondary hover:text-danger"
                  title="Remove attachment"
                >
                  ✕
                </button>
              </span>
            ))}
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
                  runInProgress
                    ? 'Add another task — it will run after this one.'
                    : 'Ask BulleBrowser to do something. It will browse, read, compare, and report back.'
                }
                rows={3}
                className="prompt-input-field"
                autoFocus={current?.messages.length === 0}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            {/* Stop is always available while running, so a task can be halted.
                Send/queue stays usable too, so the user can line up more work
                instead of waiting. */}
            {status === 'running' && (
              <button
                type="button"
                onClick={() => {
                  if (runId) void window.bullebrowser.agent.cancel(runId);
                }}
                className="h-9 rounded border border-danger bg-white px-3 text-sm font-medium text-danger hover:bg-danger/10"
                title="Stop the running task"
              >
                Stop
              </button>
            )}
            <button
              type="button"
              onClick={() => void send()}
              disabled={!draft.trim()}
              className="h-9 rounded bg-primary px-3 text-sm font-medium text-white hover:bg-primary-hover disabled:bg-line"
              title={runInProgress ? 'Queue this task' : 'Send'}
            >
              {runInProgress ? 'Queue' : 'Send'}
            </button>
          </div>
        </div>

        {/* Control row: "+" attachment menu, brand-mark home, one-shot mic,
            and the continuous Voice Mode toggle. */}
        <div className="mt-2 flex items-center gap-1">
          <AttachMenu
            onAttach={(a) => setAttachments((list) => [...list, a])}
            onControlBrowser={() => void controlBrowser()}
          />

          <button
            type="button"
            onClick={openHome}
            aria-label="Open bullebrowser.com"
            title="bullebrowser.com"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-muted"
          >
            <svg viewBox="0 0 64 64" className="h-5 w-5" aria-hidden>
              <rect x="4" y="4" width="56" height="56" rx="16" fill="#20BAD1" />
              <circle cx="26" cy="30" r="12" fill="none" stroke="#fff" strokeWidth="5" />
              <circle cx="42" cy="40" r="6" fill="#fff" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setVoiceMode('once')}
            aria-label="Voice input"
            title="Speak a prompt"
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
              voiceMode === 'once' ? 'bg-primary/10 text-primary' : 'text-ink-secondary hover:bg-surface-muted hover:text-ink-primary'
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setVoiceMode((v) => (v === 'continuous' ? null : 'continuous'))}
            aria-label="Voice Mode"
            aria-pressed={voiceMode === 'continuous'}
            title="Continuous Voice Mode"
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
              voiceMode === 'continuous' ? 'bg-primary/10 text-primary' : 'text-ink-secondary hover:bg-surface-muted hover:text-ink-primary'
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
              <path d="M4 11v2M8 8v8M12 5v14M16 8v8M20 11v2" />
            </svg>
          </button>
        </div>
          </>
        )}
      </footer>
    </aside>
  );
}

// Past conversations, newest first, with open-on-click and per-row delete.
// Drops in below the header as a scrollable list rather than a modal, so it
// feels like part of the panel.
function HistoryList({
  conversations,
  currentId,
  onOpen,
  onDelete,
  onClose,
}: {
  conversations: ConversationSummary[];
  currentId?: string;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
  return (
    <div className="border-y border-line/25 bg-surface-muted/30">
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-[10px] font-medium uppercase tracking-wide text-ink-secondary">
          Chat history
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-ink-secondary hover:text-ink-primary"
        >
          Close
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto px-2 pb-2">
        {sorted.length === 0 ? (
          <div className="px-2 py-3 text-[11px] text-ink-secondary">No chats yet.</div>
        ) : (
          sorted.map((c) => (
            <div
              key={c.id}
              className={`group flex items-center gap-2 rounded-md px-2 py-1.5 ${
                c.id === currentId ? 'bg-primary/10' : 'hover:bg-surface-muted'
              }`}
            >
              <button
                type="button"
                onClick={() => onOpen(c.id)}
                className="flex-1 truncate text-left text-[12px] text-ink-primary"
                title={c.title}
              >
                {c.title || 'Untitled chat'}
                <span className="ml-2 text-[10px] text-ink-secondary">
                  {new Date(c.updatedAt).toLocaleDateString()}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Delete this chat? This cannot be undone.')) onDelete(c.id);
                }}
                className="shrink-0 text-ink-secondary opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                title="Delete chat"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
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

// What the agent is doing, as one quiet line you can open. The raw tool calls
// are still there — they're just not the default view, because a wall of
// navigate({"url":…}) is noise to everyone except the person debugging it.
function ActivityFeed({
  steps,
  status,
  currentStep,
}: {
  steps: AgentStepEvent[];
  status: 'idle' | 'running' | 'error';
  currentStep: string;
}) {
  const [open, setOpen] = useState(false);
  const actions = steps.filter((s) => s.kind === 'tool_call');
  const failed = status === 'error';
  const summary = failed
    ? currentStep || 'The task stopped.'
    : (humanStep(steps[steps.length - 1]) ?? 'Working…');

  return (
    <div
      className={`mb-5 overflow-hidden rounded-lg border text-[12px] ${
        failed ? 'border-danger/30 bg-danger/5' : 'border-line/50 bg-surface-muted/30'
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
        aria-expanded={open}
      >
        {!failed && status === 'running' && (
          <span className="activity-pulse h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
        )}
        <span className={`flex-1 truncate ${failed ? 'text-danger' : 'text-ink-primary'}`}>
          {summary}
        </span>
        {actions.length > 0 && (
          <span className="shrink-0 text-[11px] text-ink-secondary">
            {actions.length} {actions.length === 1 ? 'step' : 'steps'}
          </span>
        )}
        <span className={`shrink-0 text-ink-secondary transition-transform ${open ? 'rotate-90' : ''}`}>
          ›
        </span>
      </button>

      {open && (
        <div className="max-h-56 overflow-y-auto border-t border-line/40 px-3 py-2">
          {steps.length === 0 ? (
            <div className="text-ink-secondary">Nothing recorded yet.</div>
          ) : (
            <ol className="space-y-1.5">
              {steps.map((s, i) => {
                const line = humanStep(s);
                if (!line) return null;
                return (
                  <li key={i} className={s.kind === 'error' ? 'text-danger' : 'text-ink-secondary'}>
                    <div>{line}</div>
                    {s.kind === 'tool_call' && s.detail && (
                      <div className="mt-0.5 truncate font-mono text-[10.5px] text-ink-secondary/70">
                        {s.detail}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
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
    <div className="mx-3 mb-2 rounded-xl border border-primary/30 bg-primary/[0.04] p-4 shadow-sm">
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

// Plain-English name for each browser action. The tool name and its raw
// arguments are still shown underneath when the feed is expanded; this is the
// line a person reads.
const ACTION_VERB: Record<string, string> = {
  navigate: 'Opening',
  read_page: 'Reading the page',
  getPageMetadata: 'Checking the page',
  extract: 'Pulling data off the page',
  listLinks: 'Looking at the links',
  getSelection: 'Reading the selection',
  click: 'Clicking',
  type: 'Typing',
  press_key: 'Pressing a key',
  scroll: 'Scrolling',
  wait_for: 'Waiting for the page',
  screenshot: 'Taking a screenshot',
  new_tab: 'Opening a new tab',
  switch_tab: 'Switching tabs',
  close_tab: 'Closing a tab',
  list_tabs: 'Checking open tabs',
  go_back: 'Going back',
  go_forward: 'Going forward',
  reload: 'Reloading',
};

// Pull the interesting argument out of the raw call so the summary can name
// what it acted on ("Opening example.com") instead of just the verb.
function describeTarget(step: AgentStepEvent): string {
  if (step.kind !== 'tool_call') return '';
  const input = step.input as Record<string, unknown> | undefined;
  const url = typeof input?.url === 'string' ? input.url : '';
  if (url) {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }
  const target = typeof input?.target === 'string' ? input.target : '';
  return target ? `“${target}”` : '';
}

function humanStep(step: AgentStepEvent | undefined): string | null {
  if (!step) return null;
  switch (step.kind) {
    case 'thinking':
      return 'Thinking…';
    case 'tool_call': {
      const verb = ACTION_VERB[step.toolName] ?? step.toolName;
      const target = describeTarget(step);
      return target ? `${verb} ${target}` : verb;
    }
    // Results and the final text are not their own line: the action already
    // said what was happening, and the answer renders as a message.
    case 'tool_result':
    case 'text':
      return null;
    case 'error':
      return step.message;
    case 'done':
      return 'Done';
  }
}
