import { describe, expect, it } from 'vitest';
import { findSkill, skills } from './index.js';

describe('skill registry', () => {
  it('exposes every skill by its id', () => {
    for (const s of skills) expect(findSkill(s.id)?.id).toBe(s.id);
  });

  // The desktop run path appends the user's Settings checklist only when the
  // selected skill has this exact id. It was referenced for a long time while
  // no such skill existed, so the checklist was silently discarded.
  it('registers compliance_review, which the checklist feature depends on', () => {
    const skill = findSkill('compliance_review');
    expect(skill).toBeDefined();
    expect(skill!.systemPrompt).toMatch(/Status legend/);
  });

  it('gives every skill the fields the UI renders', () => {
    for (const s of skills) {
      expect(s.label).toBeTruthy();
      expect(s.shortDescription).toBeTruthy();
      expect(s.inputPlaceholder).toBeTruthy();
      expect(s.systemPrompt.length).toBeGreaterThan(50);
    }
  });

  it('has no duplicate ids', () => {
    expect(new Set(skills.map((s) => s.id)).size).toBe(skills.length);
  });
});
