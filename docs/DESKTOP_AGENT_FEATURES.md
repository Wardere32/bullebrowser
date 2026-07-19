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

All pass.

### The typecheck used to check nothing

`apps/desktop/tsconfig.json` is a *solution* file — `{"files": [], "references":
[...]}` — so `tsc --noEmit -p tsconfig.json` compiled **zero files** and always
exited 0. Real type errors (including a live crash) shipped undetected behind a
green check. The `typecheck` script now runs `tsconfig.node.json` and
`tsconfig.web.json` explicitly. If a desktop typecheck ever looks suspiciously
easy, confirm what it actually compiles (`tsc -p … --listFiles | wc -l`).

### What the unit tests cover

The logic that can't be driven headlessly is covered directly instead:

- `main/agent/attachments.test.ts` — the prompt appendix: inlining text files,
  describing binaries, expanding projects, skipping swept files, and the
  untrusted-data framing (a file containing "ignore all previous instructions"
  must still arrive labelled as inert data, *after* the warning).
- `main/storage/session-files.test.ts` — the 8-day sweep against a real temp
  filesystem (metadata *and* bytes), dotfile classification, excerpt capping,
  and the UUID guard that stops a renderer-supplied id from deleting an
  arbitrary file.
- `main/storage/projects.test.ts` — de-duping, missing-project guards, and
  read-side reconciliation of file counts against expired files.
- `main/voice.test.ts` — the transcription contract: bearer auth, empty-clip
  short-circuit, the no-key path (must not call out), 401 mapping, provider
  error messages, and non-JSON error bodies.

### Still not covered: the GUI

The Playwright Electron harness (`e2e/`) **cannot launch on this toolchain**:
Playwright passes `--remote-debugging-port=0` ahead of the app path, where
Electron 39 parses it as a Node flag and dies with `bad option`. Bumping
Playwright to 1.61.1 does not fix it. Separately, all three specs assert UI copy
that no longer exists ("Running in local-first mode.", "Open Settings", the old
key-validation string) — they rotted in earlier commits. So the e2e job is red
for reasons that predate this work, and these remain unverified end-to-end:

- record → transcribe → send, and continuous Voice Mode segmentation
- the file picker and screenshot capture round-trip
- jump-to-latest and the attachment chips under real interaction

Fixing e2e means resolving the Playwright/Electron incompatibility and
rewriting the stale assertions — worth doing, but it is its own task.
