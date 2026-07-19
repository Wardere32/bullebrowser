# Desktop agent — functional Comet features

The in-product agent panel (`apps/desktop`) is where the Comet-style features
run for real — against the live agent, not a demo. This documents the
capabilities added so they operate 100% functionally, and how they're wired.

Everything here is **additive and localized to the desktop app**: `agent-core`
and the agent loop are untouched. An ordinary run with no attachments behaves
byte-for-byte as before.

## What was already real (unchanged)

- **Live agent + browser control** — the agent drives real tabs (navigate,
  read, click, type, screenshot) via CDP; steps stream into the panel.
- **Halo on the composer** — a rotating conic-gradient ring with
  idle/focus/typing/working states (`styles.css`, driven by `useInputActivity`).
- **Visible agent cursor** — the on-page pointer/halo the agent paints as it acts.
- **"Allow Access"** — the once-per-task browsing-consent prompt above the composer.

## What was added

### Attachments — the "+" menu (`AttachMenu.tsx`)
A Comet-style popover under the composer. Each item is functional:

| Item | Backing |
| --- | --- |
| **Upload your file** | Native picker (`dialog.showOpenDialog`) → files copied into `userData/session-files`, tracked in a store, **swept 8 days after upload**. Text files carry an excerpt the agent reads; binaries attach without one. |
| **Screenshot** | Captures the active tab (`webContents.capturePage`, the same call the agent's screenshot tool uses) → attached as a thumbnail chip. |
| **Projects** | Pick or create a project (name + standing instructions + files). Attaching one tells the agent the task belongs to it. |
| **Control Browser** | Ensures a live tab exists for the agent to drive and focuses the composer. |

Attachments show as removable chips above the input and flow to the run via a
new optional `AgentRunRequest.attachments` field.

### How attachments reach the agent (safe design)
The renderer sends only **references** (file ids, a project id, a screenshot
url). In `main/agent/run.ts`, `buildAttachmentAppendix()` resolves them from the
stores and folds their content into a Markdown appendix on the message sent to
the model — while the **clean** user text is what's stored in the conversation.
No `agent-core` change; the agent just receives a richer prompt.

### Pointer-to-latest
The conversation auto-follows the newest message while pinned to the bottom; if
the user scrolls up, a pointer button appears to jump back down (`AiPanel.tsx`).

### Brand-mark home
The BulleBrowser mark beside "+" opens `bullebrowser.com` in a new tab.

### Voice — mic + continuous Voice Mode (`VoiceOverlay.tsx`, `main/voice.ts`)
- **Mic (one-shot):** record one utterance; on stop it transcribes and sends.
- **Soundwave (continuous):** keeps listening, cuts a segment on trailing
  silence (a lightweight VAD over a Web Audio `AnalyserNode`), transcribes each,
  and sends it — click the icon again to stop, and the wave fades out.
- The soundwave reacts to the real mic level. Transcription runs in **main**
  against **OpenAI Whisper using the user's stored OpenAI key** (the key never
  reaches the renderer). No key → a clear inline message to add one.
- macOS: `NSMicrophoneUsageDescription` (builder `extendInfo`) +
  `com.apple.security.device.audio-input` (both entitlement plists) so a
  packaged, hardened-runtime build can access the mic.

## Files

New: `main/storage/session-files.ts`, `main/storage/projects.ts`, `main/voice.ts`,
`renderer/components/AttachMenu.tsx`, `renderer/components/VoiceOverlay.tsx`.

Changed: `shared/ipc.ts` (channels, types, bridge), `preload/index.ts`,
`main/ipc-handlers.ts`, `main/agent/run.ts`, `renderer/components/AiPanel.tsx`,
`renderer/styles.css`, `electron-builder.yml`, the two `entitlements.mac*.plist`.

## Verifying

```bash
pnpm --filter @bullebrowser/desktop typecheck   # types
pnpm --filter @bullebrowser/desktop test         # unit tests
pnpm --filter @bullebrowser/desktop build        # electron-vite bundle
```

All pass. Note: a GUI/mic smoke test (record → transcribe → send; upload → the
agent references the file; screenshot attach; jump-to-latest) must be done in a
running build — it can't be exercised headlessly.
