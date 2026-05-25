// Wire up electron-updater to GitHub Releases. Disabled in dev.

import { app } from 'electron';
// electron-updater is CommonJS; under our ESM main process the named export
// isn't available, so import the default and destructure.
import electronUpdater from 'electron-updater';
const { autoUpdater } = electronUpdater;

export function setupAutoUpdate() {
  if (!app.isPackaged) return;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater
    .checkForUpdatesAndNotify()
    .catch((err) => console.warn('[updater] check failed:', err));
}
