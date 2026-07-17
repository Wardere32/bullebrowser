// API keys for the model providers.
//
// These are stored in the app's own data directory, encrypted at rest with a
// key derived from the machine + user account. We deliberately do NOT use
// Electron's safeStorage here: on macOS it backs onto the login keychain, which
// makes the OS interrupt the user with a "BulleBrowser wants to use your
// keychain" password prompt — and it re-prompts whenever the app's signature
// changes (every upgrade from a differently-signed build).
//
// Tradeoff, stated plainly: this is weaker than the keychain. The ciphertext is
// only as private as the user's home directory, because the derivation inputs
// are readable by any process running as that user. It defeats casual reading
// of the file and anything that scrapes backups or synced copies; it does not
// defeat malware already running as you. The keychain would, at the cost of the
// prompt. If that tradeoff is ever unwanted, restore safeStorage here — nothing
// else needs to change.

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { homedir, hostname, userInfo } from 'node:os';
import { createStore } from './store.js';

export type ProviderId = 'anthropic' | 'openai';

interface SecretSchema extends Record<string, unknown> {
  // Legacy: a safeStorage-encrypted Anthropic key from before this change.
  apiKeyEncrypted: string | null;
  // Current: per-provider, encrypted by the scheme below.
  keys: Partial<Record<ProviderId, string>>;
}

const store = createStore<SecretSchema>('secrets', { apiKeyEncrypted: null, keys: {} });

// Stable per-machine/per-user derivation. Not a user secret — the point is to
// avoid a plaintext key sitting on disk, not to withstand a local attacker.
function derivedKey(): Buffer {
  return scryptSync(`${hostname()}::${userInfo().username}::${homedir()}`, 'bullebrowser.secrets.v1', 32);
}

function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', derivedKey(), iv);
  const body = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${Buffer.concat([iv, tag, body]).toString('base64')}`;
}

function decrypt(stored: string): string | null {
  if (!stored.startsWith('v1:')) return null;
  try {
    const raw = Buffer.from(stored.slice(3), 'base64');
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const body = raw.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', derivedKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(body), decipher.final()]).toString('utf8');
  } catch {
    // Wrong machine, tampered file, or a rotated derivation input.
    return null;
  }
}

// Each provider's key has a recognizable prefix; checking it catches the very
// common paste error of putting a key in the wrong provider's box.
const KEY_SHAPE: Record<ProviderId, { prefix: RegExp; label: string }> = {
  anthropic: { prefix: /^sk-ant-/, label: "an Anthropic key (starts with 'sk-ant-')" },
  openai: { prefix: /^sk-/, label: "an OpenAI key (starts with 'sk-')" },
};

function envKey(provider: ProviderId): string | null {
  const name = provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY';
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export function setApiKey(plain: string, provider: ProviderId = 'anthropic'): void {
  const trimmed = plain.trim();
  if (!trimmed) throw new Error('API key is empty.');
  const shape = KEY_SHAPE[provider];
  if (!shape.prefix.test(trimmed)) {
    throw new Error(`That doesn't look like ${shape.label}.`);
  }
  if (trimmed.length < 40) throw new Error('API key is too short to be valid.');
  store.set('keys', { ...store.get('keys'), [provider]: encrypt(trimmed) });
}

export function getApiKey(provider: ProviderId = 'anthropic'): string | null {
  const stored = store.get('keys')?.[provider];
  if (stored) {
    const plain = decrypt(stored);
    if (plain) return plain;
  }
  return envKey(provider);
}

export function hasApiKey(provider: ProviderId = 'anthropic'): boolean {
  return getApiKey(provider) !== null;
}

export function clearApiKey(provider: ProviderId = 'anthropic'): void {
  const keys = { ...store.get('keys') };
  delete keys[provider];
  store.set('keys', keys);
  if (provider === 'anthropic') store.set('apiKeyEncrypted', null);
}
