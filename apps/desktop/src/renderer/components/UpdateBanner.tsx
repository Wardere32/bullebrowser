import { useEffect, useState } from 'react';
import type { UpdateStatus } from '../../shared/ipc.js';

// Offers an update that is already downloaded and waiting. It appears only once
// the bytes are on disk, so clicking it is a relaunch and nothing more — no
// download bar, no progress to watch, no chance of being stranded half-updated
// on a bad connection.
//
// Lives in the top bar, not floating over the page: the active tab is a native
// view painted on top of this window, so anything positioned over the page area
// is simply invisible. The top bar is renderer chrome, so it actually shows.
//
// Deliberately not a modal either — an update is never more important than what
// the user is in the middle of.
export function UpdateBanner() {
  const [status, setStatus] = useState<UpdateStatus>({ state: 'idle' });
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    void window.bullebrowser.updates.status().then(setStatus);
    return window.bullebrowser.updates.onStatus(setStatus);
  }, []);

  if (status.state !== 'ready') return null;

  const install = () => {
    setInstalling(true);
    void window.bullebrowser.updates.install();
  };

  return (
    <button
      type="button"
      onClick={install}
      disabled={installing}
      title={`Restart BulleBrowser to finish updating to ${status.version}`}
      // no-drag: the top bar is a window drag region, which would otherwise
      // swallow the click.
      className="no-drag flex shrink-0 flex-col items-start rounded-md border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1 leading-tight transition-colors hover:bg-emerald-400/20 disabled:opacity-60"
    >
      <span className="text-[11px] font-medium text-emerald-300">
        {installing ? 'Relaunching…' : 'Relaunch to update'}
      </span>
      <span className="text-[10px] text-emerald-300/70">Version {status.version}</span>
    </button>
  );
}
