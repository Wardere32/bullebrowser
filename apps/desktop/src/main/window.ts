import { app, BrowserWindow, nativeImage } from 'electron';
import { join } from 'node:path';
import { product } from '@bullebrowser/brand-tokens';

export interface WindowOptions {
  preloadPath: string;
}

export function createBrowserWindow(opts: WindowOptions): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: product.windowTitle,
    backgroundColor: '#071422',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    autoHideMenuBar: true,
    show: false,
    icon: tryIcon(),
    webPreferences: {
      preload: opts.preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false,
      // No DevTools on the app's own UI in a shipped build: it exposes the
      // chrome's internals and the IPC bridge to anyone poking at it. Still on
      // in development, where it's the main debugging tool.
      //
      // Worth being clear about what this is and isn't: it raises the bar, it
      // does not make the code secret. Any Electron app's JavaScript can be
      // read out of the installed bundle by someone who wants to. Treat this as
      // tidiness, never as a place to hide a secret.
      devTools: !app.isPackaged,
    },
  });

  win.once('ready-to-show', () => win.show());
  win.on('page-title-updated', (e) => e.preventDefault()); // keep our title

  return win;
}

function tryIcon() {
  try {
    return nativeImage.createFromPath(
      join(process.resourcesPath, 'icon.png'),
    );
  } catch {
    return undefined;
  }
}
