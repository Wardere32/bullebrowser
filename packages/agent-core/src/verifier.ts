import type { PlanStep, VerificationResult } from './types.js';

function isNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function verifyStep(step: PlanStep, output: unknown): VerificationResult {
  if (!output || typeof output !== 'object') {
    return { ok: false, reason: 'Tool output must be an object.' };
  }

  const out = output as Record<string, unknown>;

  if (step.toolName === 'navigate') {
    return isNonEmptyString(out.url)
      ? { ok: true }
      : { ok: false, reason: 'Navigate result missing url.' };
  }

  if (step.toolName === 'getPageText' || step.toolName === 'read_page') {
    return isNonEmptyString(out.text)
      ? { ok: true }
      : { ok: false, reason: 'Page text was empty.' };
  }

  if (step.toolName === 'summarizePage') {
    return isNonEmptyString(out.summary)
      ? { ok: true }
      : { ok: false, reason: 'Summary was empty.' };
  }

  if (step.toolName === 'extractStructuredData' || step.toolName === 'extract') {
    return out.data !== undefined
      ? { ok: true }
      : { ok: false, reason: 'Extraction output missing data.' };
  }

  return { ok: true };
}
