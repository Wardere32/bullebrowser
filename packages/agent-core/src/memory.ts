export interface MemoryStore {
  put(key: string, value: unknown, ttlMs?: number): void;
  get<T>(key: string): T | undefined;
  all(): Record<string, unknown>;
}

interface Entry {
  value: unknown;
  expiresAt?: number;
}

const BANNED_KEY_RE = /(password|token|cookie|credential|card|cvv|secret)/i;

export class SessionMemoryStore implements MemoryStore {
  private readonly entries = new Map<string, Entry>();

  put(key: string, value: unknown, ttlMs?: number): void {
    if (BANNED_KEY_RE.test(key)) return;
    this.entries.set(key, {
      value,
      expiresAt: ttlMs ? Date.now() + ttlMs : undefined,
    });
  }

  get<T>(key: string): T | undefined {
    const current = this.entries.get(key);
    if (!current) return undefined;
    if (current.expiresAt && current.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return current.value as T;
  }

  all(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [k] of this.entries) {
      const value = this.get(k);
      if (value !== undefined) out[k] = value;
    }
    return out;
  }
}
