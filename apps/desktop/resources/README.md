# Desktop resources

Files in this folder ship with the packaged app via `electron-builder`.

| File | Required for | Replace with |
|------|--------------|--------------|
| `icon.icns` | macOS .dmg / .zip | 1024×1024 master exported as `.icns` |
| `icon.ico`  | Windows NSIS .exe | 256×256 multi-resolution `.ico` |
| `icon.png`  | Linux .AppImage / .deb | 512×512 `.png` |
| `entitlements.mac.plist` | macOS hardened runtime / notarization (wired via `electron-builder.yml` → `mac.entitlements`) | Already committed |
| `entitlements.mac.inherit.plist` | Inherited entitlements for Electron helper processes (`mac.entitlementsInherit`) | Already committed |

The committed SVGs in `packages/brand-tokens/assets/` are the source of
truth for the wordmark and the rounded-square monogram. Generate the
three platform binaries from the master logo before the first signed
release using any standard converter (e.g. `iconutil` on macOS, an
online .ico generator, `convert` from ImageMagick for the .png).

## Wordmark

The official BulleBrowser wordmark ships as PNG, with two variants:

* `packages/brand-tokens/assets/wordmark.png` — black on transparent /
  light backgrounds. Used on the landing page header.
* `packages/brand-tokens/assets/wordmark-light.png` — white on
  transparent / dark backgrounds. Used on the desktop splash and in
  the About modal.

To swap in a higher-resolution master, replace these two files and
re-copy them to `apps/web/public/`. The file watcher picks them up on
the next dev reload; production builds pick them up on rebuild.
