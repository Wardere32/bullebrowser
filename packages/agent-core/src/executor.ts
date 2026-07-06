import { getTool } from './tools/index.js';
import type { ExecutionPlan, PlanStep, ToolContext } from './types.js';
import type { PolicyEngine } from './policy.js';
import { verifyStep } from './verifier.js';
import type { AuditLogger } from './audit.js';

export interface ExecutionResult {
  step: PlanStep;
  output?: unknown;
  ok: boolean;
  reason?: string;
}

export async function executePlan(
  plan: ExecutionPlan,
  context: ToolContext,
  policy: PolicyEngine,
  audit: AuditLogger,
  onStep: (event: {
    type: 'thinking' | 'tool_call' | 'tool_result' | 'error';
    detail?: string;
    toolName?: PlanStep['toolName'];
    data?: unknown;
  }) => void,
): Promise<ExecutionResult[]> {
  const results: ExecutionResult[] = [];
  let lastOutput: unknown;

  for (const step of plan.steps) {
    if (context.signal.aborted) throw new Error('cancelled');

    const policyDecision = policy.evaluateToolStep(step);
    audit.add('policy', `Policy evaluated ${step.toolName}`, policyDecision);

    if (!policyDecision.allowed) {
      const reason = policyDecision.reason ?? 'Blocked by policy.';
      onStep({ type: 'error', detail: reason, toolName: step.toolName });
      results.push({ step, ok: false, reason });
      break;
    }

    if (policyDecision.requiresConfirmation) {
      const approved = await context.runtime.confirmDestructive(
        `Confirm action: ${step.toolName} ${JSON.stringify(step.input)}`,
      );
      if (!approved) {
        const reason = `User declined confirmation for ${step.toolName}.`;
        onStep({ type: 'error', detail: reason, toolName: step.toolName });
        results.push({ step, ok: false, reason });
        break;
      }
    }

    const tool = getTool(step.toolName);
    if (!tool) {
      const reason = `Unknown tool: ${step.toolName}`;
      onStep({ type: 'error', detail: reason, toolName: step.toolName });
      results.push({ step, ok: false, reason });
      break;
    }

    let input = step.input;
    if (step.toolName === 'summarizePage' && (!input.text || typeof input.text !== 'string')) {
      const previous = lastOutput as { text?: string; url?: string } | undefined;
      if (previous?.text) {
        input = {
          ...input,
          text: previous.text,
          sourceUrl: typeof previous.url === 'string' ? previous.url : undefined,
        };
      }
    }

    onStep({
      type: 'tool_call',
      toolName: step.toolName,
      detail: `${step.toolName}(${JSON.stringify(input)})`,
      data: input,
    });

    try {
      const parsed = tool.inputSchema.parse(input);
      const output = await tool.execute(parsed, context);
      const verification = verifyStep(step, output);
      audit.add('verify', `Verify ${step.toolName}`, verification);

      if (!verification.ok) {
        onStep({
          type: 'error',
          toolName: step.toolName,
          detail: verification.reason ?? 'Verification failed.',
        });
        results.push({ step, ok: false, reason: verification.reason, output });
        break;
      }

      lastOutput = output;
      onStep({ type: 'tool_result', toolName: step.toolName, data: output });
      results.push({ step, ok: true, output });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Tool execution failed.';
      onStep({ type: 'error', toolName: step.toolName, detail: reason });
      audit.add('error', `Tool failure ${step.toolName}`, { reason });
      results.push({ step, ok: false, reason });
      break;
    }
  }

  return results;
}
