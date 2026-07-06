import { describe, expect, it } from 'vitest';
import { planTask } from './planner.js';

describe('planner output shape', () => {
  it('creates deterministic summarize plan by default', () => {
    const plan = planTask({ userMessage: 'summarize this page' });
    expect(plan.goal.length).toBeGreaterThan(0);
    expect(plan.steps.length).toBeGreaterThan(0);
    expect(plan.steps[0]).toMatchObject({
      id: expect.any(String),
      toolName: expect.any(String),
      input: expect.any(Object),
      expected: expect.any(String),
    });
  });

  it('plans explicit navigation requests', () => {
    const plan = planTask({ userMessage: 'navigate to https://example.com' });
    expect(plan.steps[0]?.toolName).toBe('navigate');
  });
});
