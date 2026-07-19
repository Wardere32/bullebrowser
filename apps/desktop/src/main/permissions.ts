// Permission policy for the whole app session.
//
// Electron has no restrictive default here: with no handler installed, requests
// are granted. That is the wrong posture for an agentic browser — the agent
// opens arbitrary websites in tab views that share this session, so any page it
// visited could have obtained the microphone, camera, or the user's location
// without them ever being asked.
//
// The policy is therefore: deny everything, for everyone, except the handful of
// capabilities the app's OWN chrome needs — today just the microphone, for
// voice input in the AI panel. Web content gets nothing.

import { session, type WebContents } from 'electron';

// 'media' covers microphone and camera. The app UI only ever asks for audio
// (see VoiceOverlay), and web content is refused outright, so granting it here
// cannot hand a page a camera.
const APP_UI_ALLOWED = new Set<string>(['media']);

export function setupPermissions(appWebContentsId: number): void {
  const isAppUi = (wc: WebContents | null | undefined): boolean =>
    !!wc && !wc.isDestroyed() && wc.id === appWebContentsId;

  // Asked when a page actively requests a capability.
  session.defaultSession.setPermissionRequestHandler((wc, permission, callback) => {
    const allowed = isAppUi(wc) && APP_UI_ALLOWED.has(permission);
    if (!allowed) {
      console.info(`[permissions] denied "${permission}" to ${wc?.getURL?.() ?? 'unknown'}`);
    }
    callback(allowed);
  });

  // Asked when a page checks whether it *would* be granted (navigator.permissions).
  // Must agree with the handler above, or a page sees "granted" and then fails.
  session.defaultSession.setPermissionCheckHandler((wc, permission) =>
    isAppUi(wc) && APP_UI_ALLOWED.has(permission),
  );
}
