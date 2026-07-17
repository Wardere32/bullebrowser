import type { z } from 'zod';

export type ProviderId = 'anthropic' | 'openai';

export type ClaudeModelId =
  | 'claude-opus-4-7'
  | 'claude-sonnet-4-6'
  | 'claude-haiku-4-5-20251001';

export type OpenAiModelId = 'gpt-4o' | 'gpt-4o-mini';

export type ModelId = ClaudeModelId | OpenAiModelId;

export function providerFor(model: ModelId): ProviderId {
  return model.startsWith('claude') ? 'anthropic' : 'openai';
}

// What the user picks between. The labels are deliberately white-labelled —
// no vendor names anywhere client-facing — so the underlying model can be
// swapped or upgraded without the product's surface changing. The `provider`
// field is what actually routes the call; `label` is the only part a user sees.
// Note: the OpenAI provider stays implemented and tested (openai-loop.ts), it
// is simply not offered here. Adding an entry with provider 'openai' is all it
// takes to surface it again.
export const ASSISTANTS: { id: ModelId; label: string; provider: ProviderId }[] = [
  { id: 'claude-opus-4-7', label: 'BulleBrowser Pro', provider: 'anthropic' },
  { id: 'claude-sonnet-4-6', label: 'BulleBrowser Balanced', provider: 'anthropic' },
  { id: 'claude-haiku-4-5-20251001', label: 'BulleBrowser Fastest', provider: 'anthropic' },
];

// Client-facing name for a provider's credential. Used in "connect your key"
// copy, which must not name the vendor either.
export function assistantLabelFor(model: ModelId): string {
  return ASSISTANTS.find((a) => a.id === model)?.label ?? 'BulleBrowser AI';
}

export type ToolName =
  | 'getActiveTab'
  | 'listTabs'
  | 'getPageText'
  | 'getPageMetadata'
  | 'getSelection'
  | 'listLinks'
  | 'queryDom'
  | 'summarizePage'
  | 'extractStructuredData'
  | 'navigate'
  | 'clickElement'
  | 'typeIntoField'
  | 'read_page'
  | 'click'
  | 'type'
  | 'extract'
  | 'screenshot'
  | 'new_tab'
  | 'switch_tab'
  | 'list_tabs'
  | 'close_tab'
  | 'go_back'
  | 'go_forward'
  | 'reload'
  | 'scroll'
  | 'press_key'
  | 'wait_for';

export interface ToolDefinition<TInput, TOutput> {
  name: ToolName;
  description: string;
  inputSchema: z.ZodType<TInput>;
  outputSchema: z.ZodType<TOutput>;
  destructive?: boolean;
}

export interface TabSummary {
  id: string;
  title: string;
  url: string;
  active: boolean;
}

export interface ToolContext {
  activeTabId: string;
  signal: AbortSignal;
  runtime: ToolRuntime;
}

export interface ToolRuntime {
  navigate(tabId: string, url: string): Promise<{ url: string; title: string }>;
  readPage(tabId: string): Promise<{ title: string; url: string; text: string }>;
  click(tabId: string, target: string): Promise<{ matched: string }>;
  type(tabId: string, target: string, text: string): Promise<{ matched: string }>;
  extract(
    tabId: string,
    schema: Record<string, unknown>,
  ): Promise<{ data: unknown }>;
  screenshot(tabId: string): Promise<{ pngBase64: string }>;
  newTab(url?: string): Promise<TabSummary>;
  switchTab(tabId: string): Promise<TabSummary>;
  listTabs(): Promise<TabSummary[]>;
  closeTab(tabId: string): Promise<{ closed: boolean }>;
  goBack(tabId: string): Promise<{ url: string }>;
  goForward(tabId: string): Promise<{ url: string }>;
  reload(tabId: string): Promise<{ url: string }>;
  scroll(
    tabId: string,
    options: { direction: 'up' | 'down' | 'top' | 'bottom'; amount?: number },
  ): Promise<{ scrolledTo: number }>;
  pressKey(
    tabId: string,
    key: 'Enter' | 'Tab' | 'Escape' | 'ArrowDown' | 'ArrowUp' | 'PageDown' | 'PageUp',
  ): Promise<{ pressed: string }>;
  waitFor(
    tabId: string,
    condition: { selector?: string; networkIdle?: boolean; timeoutMs?: number },
  ): Promise<{ matched: boolean }>;
  confirmDestructive(message: string): Promise<boolean>;

  // Optional richer browser adapters for future native wiring.
  getSelection?(tabId: string): Promise<{ text: string }>;
  listLinks?(tabId: string): Promise<{ text: string; href: string }[]>;
  queryDom?(tabId: string, selector: string): Promise<{ matches: number }>;
}

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AgentStep {
  type: 'thinking' | 'tool_call' | 'tool_result' | 'text' | 'error' | 'done';
  toolName?: ToolName;
  detail?: string;
  data?: unknown;
}

export type AgentStepHandler = (step: AgentStep) => void;

export interface AgentInput {
  apiKey?: string;
  model: ModelId;
  systemPrompt: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  userMessage: string;
  context: ToolContext;
  onStep: AgentStepHandler;
  // Asked once per run, immediately before the first tool that would touch
  // the web. Returning false doesn't fail the run — the agent simply answers
  // from its own knowledge instead of browsing. Omit to allow browsing
  // without asking (headless / test callers).
  requestBrowseAccess?: () => Promise<boolean>;
}

export interface PlanStep {
  id: string;
  toolName: ToolName;
  input: Record<string, unknown>;
  expected: string;
}

export interface ExecutionPlan {
  goal: string;
  rationale: string;
  steps: PlanStep[];
}

export interface VerificationResult {
  ok: boolean;
  reason?: string;
}

export interface PolicyDecision {
  allowed: boolean;
  reason?: string;
  requiresConfirmation: boolean;
}

export const MAX_TOOL_CALLS_PER_TASK = 25;
