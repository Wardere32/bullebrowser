// API keys live in the OS keychain via Electron's safeStorage. The
// encrypted ciphertext is persisted alongside other settings; only this
// machine's user account can decrypt it.

import { safeStorage } from 'electron';
import { createStore } from './store.js';

interface SecretSchema extends Record<string, unknown> {
  apiKeyEncrypted: string | null;
}

const store = createStore<SecretSchema>('secrets', { apiKeyEncrypted: null });

function apiKeyFromEnv(): string | null {
  const fromEnv = process.env.ANTHROPIC_API_KEY?.trim();
  return fromEnv ? fromEnv : null;
}

export function hasApiKey(): boolean {
  return store.get('apiKeyEncrypted') !== null || apiKeyFromEnv() !== null;
}

export function setApiKey(plain: string): void {
  const trimmed = plain.trim();
  if (!trimmed) throw new Error('API key is empty.');
  if (!/^sk-ant-/.test(trimmed)) {
    throw new Error(
      "That doesn't look like a BulleBrowser AI key. Current supported keys start with 'sk-ant-'.",
    );
  }
  if (trimmed.length < 40) {
    throw new Error('API key is too short to be valid.');
  }
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error(
      'Secure storage is unavailable on this system. Aborting key save.',
    );
  }
  const cipher = safeStorage.encryptString(trimmed).toString('base64');
  store.set('apiKeyEncrypted', cipher);
}

export function getApiKey(): string | null {
  // A key saved in Settings (encrypted in the OS keychain) always wins.
  const cipher = store.get('apiKeyEncrypted');
  if (cipher) {
    try {
      return safeStorage.decryptString(Buffer.from(cipher, 'base64'));
    } catch {
      // Fall through to the environment fallback below.
    }
  }
  // Otherwise fall back to ANTHROPIC_API_KEY (loaded from .env in dev).
  return apiKeyFromEnv();
}

export function clearApiKey(): void {
  store.set('apiKeyEncrypted', null);
}
