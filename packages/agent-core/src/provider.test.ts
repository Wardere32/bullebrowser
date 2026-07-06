import { describe, expect, it } from 'vitest';
import { LocalSynthesisProvider } from './provider.js';

describe('provider isolation', () => {
  it('local provider summarizes without external calls', async () => {
    const provider = new LocalSynthesisProvider();
    const text = await provider.summarize({
      model: 'claude-sonnet-4-6',
      goal: 'Summarize page',
      facts: [{ summary: 'A local summary.' }],
    });
    expect(provider.id).toBe('local-default');
    expect(text).toContain('Goal: Summarize page');
  });
});
