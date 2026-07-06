import { describe, expect, it } from 'vitest';
import { SessionMemoryStore } from './memory.js';

describe('memory safety', () => {
  it('does not persist sensitive keys', () => {
    const memory = new SessionMemoryStore();
    memory.put('password', 'secret');
    expect(memory.get('password')).toBeUndefined();
  });

  it('stores safe values and supports ttl', async () => {
    const memory = new SessionMemoryStore();
    memory.put('allowed_domain', 'example.com', 1);
    expect(memory.get('allowed_domain')).toBe('example.com');
    await new Promise((r) => setTimeout(r, 5));
    expect(memory.get('allowed_domain')).toBeUndefined();
  });
});
