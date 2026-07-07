// Coordinates one user-initiated agent task: builds the system prompt
// (skill-aware), wires the ToolContext to the active tab, runs the loop,
// and forwards every step over IPC to the renderer.

import { randomUUID } from 'node:crypto';
import { type BrowserWindow } from 'electron';
import {
  DEFAULT_MODEL,
  findSkill,
  runAgent,
  type AgentStep,
  type ToolContext,
} from '@bullebrowser/agent-core';
import { IPC, type AgentRunRequest } from '../../shared/ipc.js';
import type { AgentStepEvent } from '../../shared/agent-events.js';
import { conversationStore } from '../storage/conversations.js';
import { tabManager } from '../tabs/manager.js';
import { getApiKey } from '../storage/secrets.js';
import { getSettings } from '../storage/settings.js';
import { DesktopToolRuntime } from './runtime.js';

interface ActiveRun {
  controller: AbortController;
  pendingConfirms: Map<string, (approved: boolean) => void>;
}

const runs = new Map<string, ActiveRun>();

const BASE_SYSTEM = [
  "You are the BulleBrowser agent — an autonomous web agent with direct control",
  "of the user's real desktop browser. You complete tasks by actually driving the",
  'browser (navigating, reading, clicking, typing), the way a person would, not by',
  'answering from memory.',
  '',
  'Tools: navigate, read_page (any tab via tabId), extract (structured data),',
  'listLinks, getSelection, getPageMetadata, click, type, press_key',
  '(Enter/Tab/Arrows), scroll, screenshot, wait_for, and tab management (new_tab,',
  'switch_tab, close_tab, go_back, go_forward, reload, list_tabs).',
  '',
  'Method — work in a perceive → plan → act → observe loop:',
  '1. Perceive: check where you are (the current tab is provided; use read_page or',
  '   list_tabs to orient). Do not assume page contents — read them.',
  '2. Plan the smallest sequence of real browser actions that satisfies the task.',
  '3. Act one step at a time, then observe the tool result before the next step.',
  '4. Adapt: if a page differs from what you expected, re-read and re-plan.',
  '',
  'Browsing effectively:',
  '- To find information you do not already have, search: navigate to',
  '  https://duckduckgo.com/?q=<query> (or google/bing), read_page the results,',
  '  then open the most relevant results and read those pages before answering.',
  '- After navigate or a click that loads new content, use wait_for',
  '  (selector or networkIdle) before read_page when the page renders',
  '  client-side, so you read the finished page rather than a loading state.',
  '- Prefer read_page/extract over screenshot; use screenshot only when the task',
  '  is genuinely visual (layout, charts, images).',
  '- To type into a field: type the text, then press_key Enter to submit search',
  '  boxes. Use extract for tables/lists/structured data.',
  '- To compare or summarize several sources, open them in tabs and read_page each',
  '  by tabId (no need to switch focus).',
  '',
  'Safety — these require the user to confirm first; do not do them unprompted:',
  'submitting forms that send the user\'s data, completing purchases or payments,',
  'deleting or sending anything, uploading files, or downloading files. If a step',
  'needs one of these, the browser will prompt the user; respect their decision.',
  '',
  'Answering:',
  '- Ground every factual claim in a page you actually read during this task. Do',
  '  not answer from prior knowledge when the answer depends on current, live, or',
  '  page-specific facts.',
  '- When you have enough to answer, stop browsing and give a clear, well-',
  '  structured reply in Markdown, citing the source URLs you used. Do not keep',
  '  browsing past what the task needs.',
  '- If you reach the 25 tool-call limit, summarize what you found so far and ask',
  '  the user how to proceed.',
].join('\n');

export async function startAgentRun(
  win: BrowserWindow,
  req: AgentRunRequest,
): Promise<{ runId: string }> {
  const apiKey = getApiKey();
  const conversation = conversationStore.get(req.conversationId);
  if (!conversation) throw new Error('Conversation not found');

  const userMsg = {
    role: 'user' as const,
    content: req.userMessage,
    timestamp: Date.now(),
  };
  conversationStore.appendMessage(req.conversationId, userMsg);

  const runId = randomUUID();
  const controller = new AbortController();
  const pendingConfirms = new Map<string, (approved: boolean) => void>();
  runs.set(runId, { controller, pendingConfirms });

  let activeTabId = tabManager.getActiveId();
  if (!activeTabId) {
    const created = await tabManager.create();
    activeTabId = created.id;
  }

  const runtime = new DesktopToolRuntime({
    request: (message: string) =>
      new Promise<boolean>((resolve) => {
        const id = randomUUID();
        pendingConfirms.set(id, resolve);
        win.webContents.send(IPC.AGENT_CONFIRM_REQUEST, { runId, id, message });
      }),
  });

  const skill = req.skillId ? findSkill(req.skillId) : undefined;
  const userChecklist =
    skill?.id === 'compliance_review' ? getSettings().complianceChecklist : [];
  const checklistAppendix =
    userChecklist.length > 0
      ? '\n\nUser-provided checklist items (run these in addition to the defaults above, using the same Status legend):\n' +
        userChecklist.map((i) => `- ${i}`).join('\n')
      : '';
  const systemPrompt = skill
    ? `${BASE_SYSTEM}\n\n${skill.systemPrompt}${checklistAppendix}`
    : BASE_SYSTEM;

  const ctx: ToolContext = {
    activeTabId,
    signal: controller.signal,
    runtime,
  };

  // Fire and forget — we don't await; results stream over IPC.
  void (async () => {
    let assistantText = '';
    try {
      assistantText = await runAgent({
        apiKey: apiKey ?? undefined,
        // Honor the user's persisted default if the renderer didn't pass
        // one (race before Settings loads), only falling back to the
        // hardcoded constant when neither is available.
        model: req.model ?? getSettings().defaultModel ?? DEFAULT_MODEL,
        systemPrompt,
        history: conversation.messages
          .filter((m) => m !== userMsg)
          .map((m) => ({ role: m.role, content: m.content })),
        userMessage: req.userMessage,
        context: ctx,
        onStep: (step) => {
          win.webContents.send(IPC.AGENT_STEP, {
            runId,
            step: stepToEvent(step),
          });
        },
      });
    } catch (err) {
      win.webContents.send(IPC.AGENT_STEP, {
        runId,
        step: { kind: 'error', message: describeAgentError(err), ts: Date.now() } satisfies AgentStepEvent,
      });
    } finally {
      if (assistantText) {
        conversationStore.appendMessage(req.conversationId, {
          role: 'assistant',
          content: assistantText,
          timestamp: Date.now(),
        });
      }
      runs.delete(runId);
    }
  })();

  return { runId };
}

export function cancelAgentRun(runId: string) {
  const run = runs.get(runId);
  if (!run) return;
  run.controller.abort();
  runs.delete(runId);
}

export function replyAgentConfirm(runId: string, id: string, approved: boolean) {
  const run = runs.get(runId);
  const resolver = run?.pendingConfirms.get(id);
  if (resolver) {
    resolver(approved);
    run?.pendingConfirms.delete(id);
  }
}

// Turn a thrown agent error into a clear, actionable message for the chat UI,
// so failures (bad key, rate limit, no network) are surfaced instead of silent.
function describeAgentError(err: unknown): string {
  const status = (err as { status?: number })?.status;
  const raw = err instanceof Error ? err.message : '';
  if (status === 401) return 'Anthropic rejected your API key (401). Check it in Settings.';
  if (status === 403) return 'Your Anthropic API key lacks access to this model (403).';
  if (status === 429) return 'Anthropic rate limit reached (429). Wait a moment and try again.';
  if (status && status >= 500) return `Anthropic service error (${status}). Please retry shortly.`;
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|EAI_AGAIN|network|timed out/i.test(raw)) {
    return 'Could not reach Anthropic. Check your internet connection and try again.';
  }
  return raw || 'The agent run failed unexpectedly.';
}

function stepToEvent(step: AgentStep): AgentStepEvent {
  const ts = Date.now();
  switch (step.type) {
    case 'thinking':
      return { kind: 'thinking', detail: step.detail, ts };
    case 'tool_call':
      return {
        kind: 'tool_call',
        toolName: step.toolName ?? 'unknown',
        detail: step.detail ?? '',
        input: step.data,
        ts,
      };
    case 'tool_result':
      return {
        kind: 'tool_result',
        toolName: step.toolName ?? 'unknown',
        output: step.data,
        ts,
      };
    case 'text':
      return { kind: 'text', text: step.detail ?? '', ts };
    case 'error':
      return { kind: 'error', toolName: step.toolName, message: step.detail ?? '', ts };
    case 'done':
      return { kind: 'done', ts };
  }
}
