# Comet-style redesign — marketing site (`apps/web`)

Phase 1 of the "make bullebrowser.com feel like Perplexity's Comet page"
effort. It restyles the **static marketing site** into a two-panel, minimalist
layout with a persistent live agent panel. It is **additive and
non-destructive**: every existing route, page, component, and integration still
works; nothing was deleted.

> **Scope note.** `apps/web` is a static export (GitHub Pages, `output:
> 'export'`, strict `default-src 'self'` CSP). There is no agent or backend on
> the site — the real agent runs in the desktop app and the widget service.
> So the agent experience here is a faithful, self-playing **demo**, and any
> capability that can't work honestly on a static page (notably live voice /
> transcription) was intentionally left to the in-product UI phase rather than
> faked. See "Deliberate omissions" below.

## Layout shell

```
<body>
 ├─ <SideNav/>                     fixed left rail (desktop) / drawer (mobile)
 └─ <div lg:pl-[--sidenav-width]>  main column, offset by the rail on desktop
     ├─ <Header/>                  slim top bar (CTA; wordmark on mobile only)
     ├─ <main>{page}</main>
     └─ <Footer/>
```

`--sidenav-width` (in `globals.css`) is the single source of truth for the rail
width and the column offset.

## New components (`apps/web/components/`)

| File | What it is |
| --- | --- |
| `SideNav.tsx` | Comet-style left vertical navigation. BulleBrowser-named items, each mapped onto an **existing** route so no URL is lost: Home→`/`, Workflows→`/features`, Guides & Tutorials→`/install`, Projects→`/preview`, Account & Settings→`/download`, Help & Support→`/about`. Fixed rail ≥`lg`; hamburger + slide-over drawer below. Active route is highlighted via `usePathname`. Inline SVG icons (no icon dependency, CSP-safe). |
| `AgentPanel.tsx` | The persistent right-hand "main interaction area." A self-playing, looping script drives a browser sub-pane (visible cursor that moves, types the address bar, clicks) above a conversation the agent streams character-by-character — mirroring the shipping app. Houses the halo composer, the "+" attachment menu, the brand-mark home link, and the jump-to-latest pointer. Honors `prefers-reduced-motion` (holds a finished state). Replaces the older `AgentDemo.tsx` (removed — it was fully superseded and no longer imported). |
| `VideoGuide.tsx` | Hero walkthrough player. With no clip shipped yet it renders a poster that links to `/preview` (the real captured screens) — **not** a fake player. Drop a file at `/public/walkthrough.mp4` and pass `src="/walkthrough.mp4"` and the same frame becomes a real inline `<video>`; no other change needed. |

## Modified files

- `app/globals.css` — the `.halo` effect (conic ring on a masked `::before`,
  animated via a registered `@property --halo-angle`; activates on
  `.is-active` **or** `:focus-within`), the `soft-pulse` keyframes, and the
  `--sidenav-width` token. All reduced-motion aware.
- `app/layout.tsx` — wraps the app in the two-panel shell (`SideNav` + offset
  main column). Content, metadata, and CSP unchanged.
- `app/page.tsx` — new hero: headline + copy, an **Allow Access** control as
  the first CTA (links to `/install`, where granting browser control is
  documented), the OS-aware `DownloadButton`, the persistent `AgentPanel`, and
  a `VideoGuide` band directly beneath. Existing skills and privacy sections
  are retained.
- `components/Header.tsx` — taller bar (`h-16`), larger wordmark (`h-11`).
  On desktop the rail owns the brand mark, so the header shows the wordmark
  only below `lg`; the Download CTA and section links stay on the right.

## Feature map (spec → implementation)

- **Two-panel Comet layout / left nav** → shell in `layout.tsx` + `SideNav`.
- **Live agent, visible cursor & typing** → `AgentPanel` browser sub-pane +
  streamed conversation.
- **Halo around the chat box** → `.halo` in `globals.css`, toggled by the
  `AgentPanel` composer while the agent composes or the visitor focuses it.
- **Pointer arrow → jump to latest** → button in `AgentPanel`, shown whenever
  the feed is scrolled up; auto-scroll pauses while the visitor reads.
- **"+" attachment menu** → `Composer` popover: Upload your file (retained 8
  days), Screenshot, Projects, Control Browser. Each item names where the
  capability runs (the app) and the panel links to `/download`.
- **Brand-mark icon → home** → the BulleBrowser mark beside "+" links to `/`.
- **Hero video guide** → `VideoGuide`, integrated under the hero.
- **Allow Access, above the fold** → first CTA in the hero.
- **Bigger logo / taller banner** → `Header` (`h-16`/`h-11`), rail wordmark
  (`h-11`), footer (`h-12`).
- **Responsive** → two-panel ≥`lg`; rail collapses to a drawer, hero grids
  stack, panel remains usable on small screens.

## Deliberate omissions (Phase 2 candidates, in-product UI)

- **Voice / soundwave input.** Real one-shot voice and continuous Voice Mode
  need the running agent to hear and act on commands. On a static marketing
  page they could only be faked, so per direction they were dropped here and
  belong to the in-product UI phase. The composer's icon row is built to
  accept them later without layout change.
- **Real file upload / screenshot / browser control** happen in the desktop
  app; on the site the "+" menu presents them and routes to the download.

## Verifying

```bash
cd apps/web
npx tsc --noEmit     # types
npx next lint        # lint
npx next build       # static export (writes ./out)
```

All three pass; the export produces the same 15 routes as before.
