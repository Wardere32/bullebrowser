import { test, expect, _electron as electron } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, '..');

async function launch() {
  // Fresh user-data dir per test so we always start with no API key and
  // default settings — required for the validation + API-key-prompt assertions.
  const userData = mkdtempSync(join(tmpdir(), 'bullebrowser-e2e-'));
  const app = await electron.launch({
    args: ['.', '--no-sandbox', `--user-data-dir=${userData}`],
    cwd: appRoot,
    env: { ...process.env, NODE_ENV: 'test' },
  });
  const win = await app.firstWindow({ timeout: 20_000 });
  await win.waitForLoadState('domcontentloaded');
  // Default settings now ship with aiPanelOpen: true (the BulleBrowser
  // rebrand made the agent the front-and-center surface). Open the
  // panel idempotently so this works whether the boot lands open or
  // closed.
  const panelHeader = win.locator('aside').getByText('BulleBrowser Agent');
  if (!(await panelHeader.isVisible().catch(() => false))) {
    await win.getByRole('button', { name: 'Agent' }).click();
  }
  await expect(panelHeader).toBeVisible({ timeout: 10_000 });
  return { app, win };
}

test('AI agent panel mounts after toggling open', async () => {
  const { app, win } = await launch();
  await expect(win.locator('aside').getByText('BulleBrowser Agent')).toBeVisible();
  await app.close();
});

test('fresh profile opens directly into an agent-ready composer without a key', async () => {
  const { app, win } = await launch();
  await expect(win.getByText('Running in local-first mode.')).toBeVisible();
  await expect(win.locator('aside textarea')).toBeEnabled();
  await app.close();
});

test('API key validation rejects malformed keys with a visible error', async () => {
  const { app, win } = await launch();
  await win.getByRole('button', { name: 'Open Settings' }).click();
  const keyInput = win.locator('input[type="password"]');
  await keyInput.fill('totally-bogus-key');
  await win.getByRole('button', { name: 'Save' }).click();
  await expect(
    win.getByText(/doesn't look like a BulleBrowser AI key/i),
  ).toBeVisible({ timeout: 5_000 });
  await app.close();
});
