// The agent loop. Receives messages, calls Anthropic with tool-use,
// dispatches tool calls into the desktop runtime via ToolContext, and
// streams steps back to the renderer through onStep.

import Anthropic from '@anthropic-ai/sdk';
import {
  MAX_TOOL_CALLS_PER_TASK,
  type AgentStepHandler,
  type ToolContext,
} from './types.js';
import { getTool, toAnthropicTools } from './tools/index.js';

export type ClaudeModelId =
  | 'claude-opus-4-7'
  | 'claude-sonnet-4-6'
  | 'claude-haiku-4-5-20251001';

export const DEFAULT_MODEL: ClaudeModelId = 'claude-opus-4-7';

export interface AgentInput {
  apiKey: string;
  model: ClaudeModelId;
  systemPrompt: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  userMessage: string;
  context: ToolContext;
  onStep: AgentStepHandler;
}

type MessageParam = Anthropic.MessageParam;
type ContentBlockParam = Anthropic.ContentBlockParam;
type ToolUseBlock = Anthropic.ToolUseBlock;

export async function runAgent(input: AgentInput): Promise<string> {
  const client = new Anthropic({ apiKey: input.apiKey });
  // The converter always emits {type: 'object', properties, required}, which
  // matches Anthropic.Tool['input_schema'], but TS can't narrow Record<string,
  // unknown> to that — so we cross the boundary with a single cast here.
  const tools = toAnthropicTools() as unknown as Anthropic.Tool[];

  const messages: MessageParam[] = [
    ...input.history.map(
      (m): MessageParam => ({ role: m.role, content: m.content }),
    ),
    { role: 'user', content: input.userMessage },
  ];

  let toolCallCount = 0;
  let finalText = '';

  while (toolCallCount <= MAX_TOOL_CALLS_PER_TASK) {
    if (input.context.signal.aborted) {
      input.onStep({ type: 'error', detail: 'Cancelled by user.' });
      throw new Error('cancelled');
    }

    input.onStep({ type: 'thinking', detail: 'Thinking…' });

    const response = await client.messages.create(
      {
        model: input.model,
        max_tokens: 4096,
        system: input.systemPrompt,
        tools: tools as unknown as Anthropic.Messages.ToolUnion[],
        messages: messages as unknown as Anthropic.Messages.MessageParam[],
      },
      { signal: input.context.signal },
    );

    const toolUses = response.content.filter(
      (b): b is ToolUseBlock => b.type === 'tool_use',
    );
    const textBlocks = response.content.filter(
      (b): b is Anthropic.TextBlock => b.type === 'text',
    );

    for (const t of textBlocks) {
      if (t.text) {
        finalText += (finalText ? '\n\n' : '') + t.text;
        input.onStep({ type: 'text', detail: t.text });
      }
    }

    if (response.stop_reason !== 'tool_use' || toolUses.length === 0) {
      input.onStep({ type: 'done' });
      return finalText;
    }

    // Echo the assistant's tool_use blocks back into the conversation,
    // then append the tool_result blocks for the next round.
    messages.push({
      role: 'assistant',
      content: response.content as ContentBlockParam[],
    });
    const toolResults: ContentBlockParam[] = [];

    for (const tu of toolUses) {
      if (input.context.signal.aborted) throw new Error('cancelled');
      toolCallCount += 1;
      if (toolCallCount > MAX_TOOL_CALLS_PER_TASK) {
        input.onStep({
          type: 'error',
          detail: `Reached the ${MAX_TOOL_CALLS_PER_TASK} tool-call limit. Stopping.`,
        });
        return finalText;
      }
      const tool = getTool(tu.name);
      input.onStep({
        type: 'tool_call',
        toolName: tu.name as never,
        detail: describeToolCall(tu.name, tu.input),
        data: tu.input,
      });

      let resultContent: unknown;
      let isError = false;
      try {
        if (!tool) throw new Error(`Unknown tool: ${tu.name}`);
        if (tool.destructive) {
          const ok = await input.context.runtime.confirmDestructive(
            describeToolCall(tu.name, tu.input),
          );
          if (!ok) throw new Error('User declined the destructive action.');
        }
        const parsed = tool.inputSchema.parse(tu.input ?? {});
        const out = await tool.execute(parsed, input.context);
        resultContent = out;
        input.onStep({ type: 'tool_result', toolName: tu.name as never, data: out });
      } catch (err) {
        isError = true;
        resultContent =
          err instanceof Error ? err.message : 'Unknown error executing tool';
        input.onStep({ type: 'error', toolName: tu.name as never, detail: String(resultContent) });
      }
      toolResults.push({
        type: 'tool_result',
        tool_use_id: tu.id,
        content: resultContent,
        is_error: isError,
      });
    }

    messages.push({ role: 'user', content: toolResults });
  }

  input.onStep({ type: 'done' });
  return finalText;
}

function describeToolCall(name: string, input: unknown): string {
  if (!input || typeof input !== 'object') return name;
  const fields = Object.entries(input as Record<string, unknown>)
    .map(([k, v]) => `${k}=${formatValue(v)}`)
    .join(', ');
  return `${name}(${fields})`;
}

function formatValue(v: unknown): string {
  if (typeof v === 'string') return v.length > 60 ? `${v.slice(0, 57)}…` : v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return JSON.stringify(v).slice(0, 60);
}
