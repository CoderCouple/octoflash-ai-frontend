# `components/editor` — Manim scene editor

Scene-first, IDE-style editing surface for Manim videos. Mirrors the
module layout convention used by [`octonote`](https://github.com/CoderCouple/octonote)
(feature folder under `components/`, types + fixtures under `lib/`).

## Map

```
components/editor/
├── editor-shell.tsx          IDE layout container + state. Mount this.
├── editor-topbar.tsx         project title · scope toggle · Preview · Export
├── editor-tab-bar.tsx        in-area tabs: preview / prompt.txt / scene.py
├── scenes-panel.tsx          LEFT — file-tree style scene list + assets
├── inspector-panel.tsx       RIGHT — Prompt · Template · Duration · Style · Variations
├── preview-canvas.tsx        center — 9:16 phone preview
├── prompt-tab.tsx            center — scene prompt + compiled params
├── code-tab.tsx              center — generated Manim (read-only)
├── transport-controls.tsx    play/pause + scrubber under the preview
├── bottom-panel.tsx          Timeline · Logs · Renders · Problems
├── status-bar.tsx            bottom strip — render queue · resolution · cost
├── desktop-chrome.tsx        macOS window chrome (Tauri/Electron build)
├── scene-art.tsx             faux scene SVG — swap for <video> in prod
└── template-glyph.tsx        small iconographic glyph per template id
```

```
lib/
├── scenes.ts                 Scene, TemplateId, StyleId types · SCENES fixture · TEMPLATES · STYLES
└── format.ts                 formatTime · formatShort · formatRange
```

```
app/(app)/editor/page.tsx     /editor route — renders <EditorShell />
```

## Design principles

- **Scene-first, not timeline-first.** Each scene is an independent
  Manim render. Editing one scene only re-renders that scene.
- **No user-written Manim** in MVP. Users pick a `template` + tweak
  params; the backend compiles to a `GeneratedScene` subclass.
- **FFmpeg concat for stitching.** Selected variation per scene →
  `ffmpeg -f concat -c copy`.
- **Layout: nav always left, extras right.** App sidebar +
  scenes-panel on the left, inspector on the right, status bar at the
  very bottom.

## Wiring the backend

Today everything reads from `SCENES` in `lib/scenes.ts`. To connect
the FastAPI backend:

| UI surface | Replace with |
|---|---|
| `SCENES` import in `editor-shell.tsx` | `useQuery(["project", id], fetchProject)` |
| `<SceneArt>` thumbs in `<BottomPanel>` / panels | `<video src={variation.videoUrl} muted />` |
| `<PreviewCanvas>` | full-fledged HTML5 `<video>` element |
| Inspector "Regenerate" / "4 variations" | `useMutation` against `/scenes/{id}/variations` |
| Inspector variation picker | `useMutation` against `/scenes/{id}/select-variation` |
| Topbar "Export" | `useMutation` against `/projects/{id}/export` + job polling |

## API surface (matches the spec)

```
POST   /projects
GET    /projects/{project_id}
POST   /projects/{project_id}/scenes
PATCH  /scenes/{scene_id}
POST   /scenes/{scene_id}/variations
PATCH  /scenes/{scene_id}/select-variation
POST   /variations/{variation_id}/render
POST   /projects/{project_id}/preview
POST   /projects/{project_id}/export
GET    /jobs/{job_id}
```

## Web + Desktop

The same `<EditorShell />` is the entry point for both targets.

```tsx
// Web (Next.js / app/(app)/editor/page.tsx)
<EditorShell />

// Desktop (Tauri / Electron renderer process)
<DesktopChrome title="Octoflash AI — black-holes.octoflash">
  <EditorShell />
</DesktopChrome>
```
