import { executePlan } from './executor.js';
import { SessionMemoryStore } from './memory.js';
import { planTask } from './planner.js';
import { PrivacyPolicyEngine } from './policy.js';
import { AnthropicSynthesisProvider, LocalSynthesisProvider } from './provider.js';
import { retrieveContext } from './retrieval.js';
import { AuditLogger } from './audit.js';
import {
  MAX_TOOL_CALLS_PER_TASK,
  type AgentInput,
  type ClaudeModelId,
  type ExecutionPlan,
} from './types.js';

export const DEFAULT_MODEL: ClaudeModelId = 'claude-opus-4-7';

function shouldUseExternalProvider(): boolean {
  return process.env.BULLE_AGENT_USE_EXTERNAL_PROVIDER === '1';
}

function formatPlan(plan: ExecutionPlan): string {
  const lines = [
    `Goal: ${plan.goal}`,
    `Why: ${plan.rationale}`,
    'Steps:',
    ...plan.steps.map((s, i) => `${i + 1}. ${s.toolName} - ${s.expected}`),
  ];
  return lines.join('\n');
}

function makeFinalReport(params: {
  plan: ExecutionPlan;
  results: Array<{ ok: boolean; output?: unknown; reason?: string }>;
  providerText: string;
  url?: string;
}): string {
  const successCount = params.results.filter((r) => r.ok).length;
  const failed = params.results.find((r) => !r.ok);

  const lines: string[] = [];
  lines.push('Execution Report');
  lines.push('');
  lines.push(`Plan goal: ${params.plan.goal}`);
  lines.push(`Completed steps: ${successCount}/${params.plan.steps.length}`);
  if (failed?.reason) lines.push(`Failure: ${failed.reason}`);
  if (params.url) lines.push(`Source: ${params.url}`);
  lines.push('');
  lines.push(params.providerText.trim());

  return lines.join('\n');
}

export async function runAgent(input: AgentInput): Promise<string> {
  const policy = new PrivacyPolicyEngine();
  const memory = new SessionMemoryStore();
  const audit = new AuditLogger();

  if (input.context.signal.aborted) {
    input.onStep({ type: 'error', detail: 'Cancelled by user.' });
    throw new Error('cancelled');
  }

  input.onStep({ type: 'thinking', detail: 'Perceiving browser context…' });
  audit.add('perceive', 'Starting contextual retrieval');

  const retrieved = await retrieveContext(input.context, memory);
  memory.put('last_url', retrieved.url, 15 * 60 * 1000);
  memory.put('last_title', retrieved.title, 15 * 60 * 1000);

  input.onStep({ type: 'thinking', detail: 'Planning actions…' });
  const plan = planTask({
    userMessage: input.userMessage,
    currentUrl: retrieved.url,
  });

  if (plan.steps.length > MAX_TOOL_CALLS_PER_TASK) {
    throw new Error(`Plan exceeds max tool calls (${MAX_TOOL_CALLS_PER_TASK}).`);
  }

  input.onStep({ type: 'text', detail: formatPlan(plan) });
  audit.add('plan', 'Plan generated', plan);

  input.onStep({ type: 'thinking', detail: 'Executing plan…' });
  const results = await executePlan(plan, input.context, policy, audit, (event) => {
    if (event.type === 'tool_call') {
      input.onStep({
        type: 'tool_call',
        toolName: event.toolName,
        detail: event.detail,
        data: policy.redact(event.data),
      });
      return;
    }
    if (event.type === 'tool_result') {
      input.onStep({
        type: 'tool_result',
        toolName: event.toolName,
        data: policy.redact(event.data),
      });
      return;
    }
    if (event.type === 'error') {
      input.onStep({ type: 'error', toolName: event.toolName, detail: event.detail });
      return;
    }
    input.onStep({ type: 'thinking', detail: event.detail });
  });

  const facts = results.filter((r) => r.ok).map((r) => r.output);
  const externalDecision = policy.allowExternalProvider({
    url: retrieved.url,
    text: retrieved.textSnippet,
  });

  const provider =
    shouldUseExternalProvider() && externalDecision.allowed
      ? new AnthropicSynthesisProvider()
      : new LocalSynthesisProvider();

  if (provider.id === 'anthropic' && !externalDecision.allowed) {
    audit.add('policy', 'External synthesis blocked', externalDecision.reason);
  }

  input.onStep({ type: 'thinking', detail: 'Preparing final report…' });
  const providerText = await provider.summarize({
    model: input.model,
    goal: plan.goal,
    facts,
    apiKey: input.apiKey,
  });

  const report = makeFinalReport({
    plan,
    results,
    providerText,
    url: retrieved.url,
  });

  audit.add('report', 'Final report generated', {
    provider: provider.id,
    records: audit.all().length,
  });

  input.onStep({ type: 'done' });
  return report;
}
