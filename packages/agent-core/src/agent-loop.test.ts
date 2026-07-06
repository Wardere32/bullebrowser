import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_MODEL, runAgent } from './agent-loop.js';
import type { ToolContext } from './types.js';

function makeRuntime(overrides?: Partial<ToolContext['runtime']>): ToolContext['runtime'] {
  return {
    navigate: vi.fn(async (_id, url) => ({ url, title: 'Example' })),
    readPage: vi.fn(async () => ({
      title: 'Example Title',
      url: 'https://example.com',
      text: 'Example page text. This page explains grants and deadlines.',
    })),
    click: vi.fn(async (_id, target) => ({ matched: target })),
    type: vi.fn(async (_id, target) => ({ matched: target })),
    extract: vi.fn(async () => ({ data: { title: 'Doc' } })),
    screenshot: vi.fn(async () => ({ pngBase64: 'iVBORw0KGgo=' })),
    newTab: vi.fn(async (url) => ({ id: 't-new', title: 'New', url: url ?? 'about:blank', active: true })),
    switchTab: vi.fn(async (id) => ({ id, title: 'X', url: 'https://x', active: true })),
    listTabs: vi.fn(async () => [{ id: 't1', title: 'A', url: 'https://a', active: true }]),
    closeTab: vi.fn(async () => ({ closed: true })),
    goBack: vi.fn(async () => ({ url: 'https://prev' })),
    goForward: vi.fn(async () => ({ url: 'https://next' })),
    reload: vi.fn(async () => ({ url: 'https://r' })),
    scroll: vi.fn(async () => ({ scrolledTo: 600 })),
    pressKey: vi.fn(async (_id, key) => ({ pressed: key })),
    waitFor: vi.fn(async () => ({ matched: true })),
    confirmDestructive: vi.fn(async () => true),
    ...overrides,
  };
}

function makeContext(overrides?: Partial<ToolContext['runtime']>): ToolContext {
  return {
    activeTabId: 't1',
    signal: new AbortController().signal,
    runtime: makeRuntime(overrides),
  };
}

describe('runAgent modular loop', () => {
  it('runs perceive->plan->act->verify->report and returns report text', async () => {
    const steps: string[] = [];
    const out = await runAgent({
      apiKey: 'test-key',
      model: DEFAULT_MODEL,
      systemPrompt: 'ignored in local planner',
      history: [],
      userMessage: 'summarize this page',
      context: makeContext(),
      onStep: (s) => steps.push(s.type),
    });

    expect(out).toContain('Execution Report');
    expect(out).toContain('Plan goal');
    expect(steps).toContain('tool_call');
    expect(steps).toContain('tool_result');
    expect(steps.at(-1)).toBe('done');
  });

  it('stops when confirmation is declined for risky actions', async () => {
    const out = await runAgent({
      apiKey: 'test-key',
      model: DEFAULT_MODEL,
      systemPrompt: 'ignored',
      history: [],
      userMessage: 'click "submit"',
      context: makeContext({
        confirmDestructive: vi.fn(async () => false),
      }),
      onStep: () => {},
    });

    expect(out).toContain('Failure');
    expect(out).toContain('User declined confirmation');
  });
});
