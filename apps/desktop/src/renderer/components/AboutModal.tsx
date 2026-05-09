import { useEffect, useState } from 'react';
import { product } from '@bullebrowser/brand-tokens';
import wordmark from '@bullebrowser/brand-tokens/wordmark.png';
import { useBrowserStore } from '../state/browser-store.js';
import type { AppInfo } from '../../shared/ipc.js';
import { Modal } from './Modal.js';

export function AboutModal() {
  const closeAbout = useBrowserStore((s) => s.closeAbout);
  const [info, setInfo] = useState<AppInfo | null>(null);

  useEffect(() => {
    void window.bullebrowser.app.info().then(setInfo);
  }, []);

  return (
    <Modal title="About BulleBrowser" onClose={closeAbout} width={560}>
      <div className="space-y-4 text-sm">
        <img src={wordmark} alt="BulleBrowser" width={240} />
        <div className="text-ink-secondary">{product.tagline}</div>

        {info && (
          <div className="rounded border border-line bg-surface-muted p-3 text-xs">
            <div>
              <span className="text-ink-secondary">Version: </span>
              <span className="font-mono">{info.version}</span>
            </div>
            <div>
              <span className="text-ink-secondary">Platform: </span>
              <span className="font-mono">{info.platform}</span>
            </div>
            <div>
              <span className="text-ink-secondary">Engine: </span>
              <span className="font-mono">
                Chromium {info.chromeVersion} · Electron {info.electronVersion}
              </span>
            </div>
          </div>
        )}

        <div className="text-xs text-ink-secondary">
          © {new Date().getFullYear()} {product.vendor}. All rights reserved. Visit{' '}
          <a
            href={`https://${product.domain}`}
            className="text-primary underline"
            onClick={(e) => {
              e.preventDefault();
              window.open(`https://${product.domain}`, '_blank');
            }}
          >
            {product.domain}
          </a>
          .
        </div>

        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-secondary">
            Built with
          </h3>
          <div className="max-h-44 overflow-y-auto rounded border border-line">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-surface-muted text-left text-ink-secondary">
                  <th className="px-2 py-1">Package</th>
                  <th className="px-2 py-1">Version</th>
                  <th className="px-2 py-1">License</th>
                </tr>
              </thead>
              <tbody>
                {info?.thirdPartyNotices?.length ? (
                  info.thirdPartyNotices.map((n) => (
                    <tr key={`${n.name}@${n.version}`} className="border-t border-line">
                      <td className="px-2 py-1 font-mono">{n.name}</td>
                      <td className="px-2 py-1 font-mono">{n.version}</td>
                      <td className="px-2 py-1">{n.license}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-2 py-2 text-ink-secondary">
                      Third-party notices are generated at build time.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
}
