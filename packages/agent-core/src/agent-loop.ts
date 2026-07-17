// The BulleBrowser agent loop.
//
// This is a real Claude tool-use loop: the model is given the browser tool
// surface (navigate, read_page, click, type, …) and driven in a
// perceive → decide → act → observe cycle. Claude chooses which tools to call
// based on the running results, so the agent can actually browse — search,
// follow links, read multiple tabs — and synthesize a grounded answer, rather
// than executing a fixed, pre-baked plan.
//
// The desktop main process injects a ToolRuntime (via ToolContext) that maps
// each tool onto the active WebContentsView, and forwards every step to the
// renderer through `onStep`.

import Anthropic from '@anthropic-ai/sdk';
import { SessionMemoryStore } from './memory.js';
import { PrivacyPolicyEngine } from './policy.js';
import { retrieveContext } from './retrieval.js';
import { getTool, zodToJsonSchema } from './tools/index.js';
import {
  MAX_TOOL_CALLS_PER_TASK,
  type AgentInput,
  type AgentStepHandler,
  type ClaudeModelId,
  type PlanStep,
  type ToolContext,
  type ToolName,
} from './types.js';

export const DEFAULT_MODEL: ClaudeModelId = 'claude-opus-4-7';

// Max tokens for each model turn. Well under the SDK's non-streaming HTTP
// timeout while leaving room for a substantial final report.
const MAX_TOKENS_PER_TURN = 4096;

// The tools we expose to the model. This is a curated subset of the registry:
// the primary, well-described tools (using the same names referenced in the
// system prompt) rather than every legacy alias, so the model isn't offered
// three ways to do the same thing.
const AGENT_TOOL_NAMES: ToolName[] = [
  'navigate',
  'read_page',
  'getPageMetadata',
  'list_tabs',
  'new_tab',
  'switch_tab',
  'close_tab',
  'go_back',
  'go_forward',
  'reload',
  'click',
  'type',
  'press_key',
  'scroll',
  'wait_for',
  'extract',
  'listLinks',
  'getSelection',
  'screenshot',
];

// Tools that read or drive the live web. The first time the model reaches for
// one of these, the user is asked for access ("Allow Access") — browsing on
// someone's real, logged-in browser is a meaningful thing to consent to.
// Everything else (answering from knowledge, listing tabs) needs no gate.
const BROWSING_TOOL_NAMES = new Set<ToolName>([
  'navigate',
  'read_page',
  'getPageMetadata',
  'click',
  'type',
  'press_key',
  'scroll',
  'wait_for',
  'extract',
  'listLinks',
  'getSelection',
  'screenshot',
  'new_tab',
  'go_back',
  'go_forward',
  'reload',
]);

function buildToolDefs(): Anthropic.Tool[] {
  const defs: Anthropic.Tool[] = [];
  for (const name of AGENT_TOOL_NAMES) {
    const tool = getTool(name);
    if (!tool) continue;
    defs.push({
      name: tool.name,
      description: tool.description,
      input_schema: zodToJsonSchema(tool.inputSchema) as Anthropic.Tool.InputSchema,
    });
  }
  return defs;
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}… [truncated]` : value;
}

// Compact, IPC-safe preview of a tool's output for the step stream. Keeps large
// blobs (screenshot base64, full page text) out of the renderer feed.
function previewOutput(output: unknown): unknown {
  if (output && typeof output === 'object') {
    const rec = output as Record<string, unknown>;
    if (typeof rec.pngBase64 === 'string') {
      return { pngBase64: `<png ${rec.pngBase64.length} bytes>` };
    }
    if (typeof rec.text === 'string') {
      return { ...rec, text: truncate(rec.text, 400) };
    }
  }
  if (typeof output === 'string') return truncate(output, 400);
  return output;
}

async function runToolCall(
  toolUse: Anthropic.ToolUseBlock,
  context: ToolContext,
  policy: PrivacyPolicyEngine,
  onStep: AgentStepHandler,
  gate: BrowseGate,
): Promise<Anthropic.ToolResultBlockParam> {
  const name = toolUse.name as ToolName;
  const input = (toolUse.input ?? {}) as Record<string, unknown>;
  const fail = (detail: string): Anthropic.ToolResultBlockParam => {
    onStep({ type: 'error', toolName: name, detail });
    return { type: 'tool_result', tool_use_id: toolUse.id, content: detail, is_error: true };
  };

  onStep({
    type: 'tool_call',
    toolName: name,
    detail: `${name}(${truncate(JSON.stringify(input), 200)})`,
    data: policy.redact(input),
  });

  const tool = getTool(name);
  if (!tool) return fail(`Unknown tool: ${name}`);

  // Browsing consent, asked once per run on the first web-touching tool.
  if (BROWSING_TOOL_NAMES.has(name) && !(await gate.allowed())) {
    return fail(
      'The user declined browser access for this task. Do not call any ' +
        'browsing tool again. Answer from your own knowledge instead, and say ' +
        'plainly that you could not check the live page.',
    );
  }

  // Privacy / safety policy: block sensitive actions outright, and require an
  // explicit user confirmation for destructive ones (submit, purchase, delete…).
  const step: PlanStep = { id: toolUse.id, toolName: name, input, expected: '' };
  const decision = policy.evaluateToolStep(step);
  if (!decision.allowed) return fail(decision.reason ?? 'Blocked by policy.');
  if (decision.requiresConfirmation) {
    const approved = await context.runtime.confirmDestructive(
      `Confirm action: ${name} ${JSON.stringify(input)}`,
    );
    if (!approved) return fail(`User declined confirmation for ${name}.`);
  }

  try {
    const parsed = tool.inputSchema.parse(input);
    const output = await tool.execute(parsed, context);
    onStep({ type: 'tool_result', toolName: name, data: policy.redact(previewOutput(output)) });

    // Return the screenshot as an image block so the model can actually see the
    // page, rather than dumping a giant base64 string into a text result.
    if (
      name === 'screenshot' &&
      output &&
      typeof output === 'object' &&
      'pngBase64' in output
    ) {
      return {
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: (output as { pngBase64: string }).pngBase64,
            },
          },
        ],
      };
    }

    // The Anthropic Messages API requires tool_result.content to be a string or
    // an array of content blocks — never a raw object. Stringify.
    const text = typeof output === 'string' ? output : JSON.stringify(output);
    return { type: 'tool_result', tool_use_id: toolUse.id, content: truncate(text, 100_000) };
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Tool execution failed.');
  }
}

// Asks for browsing access at most once per run and remembers the answer, so
// a task that visits ten pages prompts the user once rather than ten times.
// Concurrent tool calls in the same turn share the single in-flight request.
interface BrowseGate {
  allowed(): Promise<boolean>;
}

function createBrowseGate(request?: () => Promise<boolean>): BrowseGate {
  if (!request) return { allowed: async () => true };
  let pending: Promise<boolean> | null = null;
  return {
    allowed: () => {
      pending ??= request();
      return pending;
    },
  };
}

export async function runAgent(input: AgentInput): Promise<string> {
  const { context, onStep } = input;

  if (context.signal.aborted) {
    onStep({ type: 'error', detail: 'Cancelled by user.' });
    throw new Error('cancelled');
  }

  if (!input.apiKey) {
    // Throw rather than return a canned string — otherwise the "answer" renders
    // as a normal assistant message and the failure is invisible. Throwing routes
    // it through the run's error channel so the chat shows a real error.
    throw new Error(
      'No Anthropic API key is configured. Open Settings and paste your key ' +
        '(it is stored encrypted in your OS keychain) to enable the agent.',
    );
  }

  const policy = new PrivacyPolicyEngine();
  const memory = new SessionMemoryStore();
  const gate = createBrowseGate(input.requestBrowseAccess);

  // Context from the page the user is already looking at is not gated: it's
  // the tab in front of them, and the panel is expected to know it. The
  // consent gate covers the agent going *off* and driving the browser itself.
  onStep({ type: 'thinking', detail: 'Reading the current page…' });
  const perceived = await retrieveContext(context, memory);

  const contextNote = perceived.url
    ? `\n\nCurrent browser context:\n- Active tab: ${perceived.title ?? 'Untitled'} — ${perceived.url}`
    : '\n\nCurrent browser context: no page is loaded yet. Use `navigate` (for ' +
      'example to a search engine) to begin.';
  const system = `${input.systemPrompt}${contextNote}`;

  const client = new Anthropic({ apiKey: input.apiKey });
  const toolDefs = buildToolDefs();

  // Adaptive thinking lets the model reason between tool calls, which markedly
  // improves multi-step browsing. Supported on the Opus/Sonnet tiers but not on
  // Haiku, so gate on the model. When on, give max_tokens extra headroom since
  // thinking tokens count against it.
  const supportsThinking = !input.model.startsWith('claude-haiku');
  const maxTokens = supportsThinking ? 8192 : MAX_TOKENS_PER_TURN;
  const thinking: Anthropic.ThinkingConfigParam | undefined = supportsThinking
    ? { type: 'adaptive' }
    : undefined;

  const messages: Anthropic.MessageParam[] = [
    ...input.history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: input.userMessage },
  ];

  let finalText = '';
  let toolCalls = 0;

  // Each iteration is one model turn. The loop bound is a hard safety backstop;
  // the real limit is MAX_TOOL_CALLS_PER_TASK, enforced per tool call below.
  for (let turn = 0; turn < MAX_TOOL_CALLS_PER_TASK + 5; turn++) {
    if (context.signal.aborted) throw new Error('cancelled');

    onStep({ type: 'thinking', detail: 'Thinking…' });

    const response = await client.messages.create({
      model: input.model,
      max_tokens: maxTokens,
      ...(thinking ? { thinking } : {}),
      system,
      tools: toolDefs,
      messages,
    });

    const turnText = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n\n')
      .trim();
    if (turnText) onStep({ type: 'text', detail: turnText });

    // The model hit the per-turn token cap mid-answer. Preserve what it wrote,
    // ask it to continue, and accumulate — otherwise the reply is silently
    // truncated. (Bounded by the outer turn limit.)
    if (response.stop_reason === 'max_tokens') {
      finalText = finalText ? `${finalText} ${turnText}`.trim() : turnText;
      messages.push({ role: 'assistant', content: response.content });
      messages.push({
        role: 'user',
        content:
          'Your previous message was cut off at the length limit. Continue from exactly ' +
          'where you stopped — do not repeat text you already wrote.',
      });
      continue;
    }

    if (response.stop_reason !== 'tool_use') {
      // Terminal turn (end_turn / stop_sequence): this is the final answer.
      finalText = finalText ? `${finalText} ${turnText}`.trim() : turnText;
      break;
    }

    // Preserve the full assistant turn (text + tool_use blocks) so the next
    // request carries the model's own reasoning and tool calls.
    messages.push({ role: 'assistant', content: response.content });

    const toolUses = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    );
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const toolUse of toolUses) {
      if (context.signal.aborted) throw new Error('cancelled');
      if (toolCalls >= MAX_TOOL_CALLS_PER_TASK) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: `Tool-call limit (${MAX_TOOL_CALLS_PER_TASK}) reached. Summarize what you have and stop.`,
          is_error: true,
        });
        continue;
      }
      toolCalls += 1;
      toolResults.push(await runToolCall(toolUse, context, policy, onStep, gate));
    }

    messages.push({ role: 'user', content: toolResults });
  }

  onStep({ type: 'done' });
  return (
    finalText ||
    'I was unable to produce a final answer within the tool-call limit. ' +
      'Please refine the task or ask me to continue.'
  );
}
