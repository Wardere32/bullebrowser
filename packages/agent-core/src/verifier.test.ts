import { describe, expect, it } from 'vitest';
import { verifyStep } from './verifier.js';

describe('verifier', () => {
  it('accepts valid getPageText outputs', () => {
    const result = verifyStep(
      { id: '1', toolName: 'getPageText', input: {}, expected: 'text' },
      { text: 'hello', title: 'T', url: 'https://x', tabId: 't1' },
    );
    expect(result.ok).toBe(true);
  });

  it('rejects empty summary outputs', () => {
    const result = verifyStep(
      { id: '1', toolName: 'summarizePage', input: {}, expected: 'summary' },
      { summary: '' },
    );
    expect(result.ok).toBe(false);
  });
});
