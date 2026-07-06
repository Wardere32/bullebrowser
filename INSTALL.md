# Installing BulleBrowser

BulleBrowser is a desktop app for **macOS, Windows, and Linux**. This guide
gets you from download to a working AI agent in a few minutes — no technical
background needed.

> Downloads live on the [Releases page](https://github.com/wardere83/bullebrowser/releases/latest).
> The website's **Download** button picks the right file for your computer
> automatically.

---

## 1. Download

| Your computer | File to download |
|---------------|------------------|
| Mac | `BulleBrowser-<version>-universal.dmg` |
| Windows 10/11 | `BulleBrowser-Setup-<version>-x64.exe` |
| Windows on ARM | `BulleBrowser-Setup-<version>-arm64.exe` |
| Linux (most PCs) | `BulleBrowser-<version>-x86_64.AppImage` |
| Linux (ARM) | `BulleBrowser-<version>-arm64.AppImage` |

Not sure which Mac you have? Apple menu →  **About This Mac**. If it says
"Apple M…", choose Apple Silicon.

---

## 2. Install & first launch

BulleBrowser is currently distributed **unsigned** (no paid Apple/Microsoft
developer certificate yet), so your OS will show a one-time safety prompt.
This is expected — here's how to get past it.

### macOS
1. Open the `.dmg` and drag **BulleBrowser** into **Applications**.
2. In Applications, **right-click** BulleBrowser → **Open** → **Open**.
   (Right-clicking is the key step — double-clicking the first time may say
   the app "can't be opened".)
3. After this one time, it launches normally from the Dock.

If you ever see *"BulleBrowser is damaged"*, it's just the quarantine flag.
Open Terminal and run:
```bash
xattr -dr com.apple.quarantine /Applications/BulleBrowser.app
```
then open it again.

### Windows
1. Run `BulleBrowser-Setup-…exe`.
2. If **Windows SmartScreen** appears, click **More info → Run anyway**.
3. Follow the installer; BulleBrowser opens when it finishes.

### Linux
```bash
chmod +x BulleBrowser-*.AppImage
./BulleBrowser-*.AppImage
```
If your distro lacks FUSE, run `./BulleBrowser-*.AppImage --appimage-extract`
and launch `squashfs-root/AppRun`.

---

## 3. (Optional) Verify your download

Each release includes `checksums.txt`. To confirm your file is intact:

```bash
# macOS / Linux
shasum -a 256 BulleBrowser-*.AppImage      # compare against checksums.txt

# Windows (PowerShell)
Get-FileHash .\BulleBrowser-Setup-*.exe -Algorithm SHA256
```

---

## 4. Open the assistant

BulleBrowser can run without a provider key. If you later want external
synthesis, add a supported key from your AI provider account.

1. Open the **assistant panel** (the **Your Assistant** button, or
   `Ctrl/Cmd + Shift + A`).
2. Choose a preset skill if you want a guided workflow, or just describe
   what you need in plain language.
3. The agent will browse the live tab and return a result summary.

Preset **Skills**:
- **Page assistant** — read and summarize the current page.
- **Site navigator** — open a site, find the control, and complete the requested action.
- **Workflow automator** — coordinate repeatable multi-step browser tasks.

---

## Keyboard shortcuts

| Action | Shortcut |
|--------|----------|
| New tab | `Ctrl/Cmd + T` |
| Close tab | `Ctrl/Cmd + W` |
| Focus address bar | `Ctrl/Cmd + L` |
| Reload | `Ctrl/Cmd + R` |
| Toggle AI panel | `Ctrl/Cmd + Shift + A` |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Mac: "can't be opened" | Right-click → Open → Open (step 2 above). |
| Mac: "is damaged" | Run the `xattr -dr` command above. |
| Windows: SmartScreen blocks it | More info → Run anyway. |
| AI panel asks for a key | That is optional; continue using the local assistant, or add a key later in Settings if you want external synthesis. |
| Agent can't read a page | Some PDFs/non-HTML pages aren't readable; paste the text or use an HTML version. |
| Updates | BulleBrowser checks GitHub Releases and updates itself on the next launch. |

Questions? <hello@bulleconsulting.com>
