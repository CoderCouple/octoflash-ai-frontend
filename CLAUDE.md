# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Run from the repo root — this is an **npm workspaces monorepo**.

- `npm run dev` — Vite dev server for the web app (`packages/web`), `http://localhost:5173`
- `npm run dev:desktop` — Vite + Electron together (Electron loads the dev URL)
- `npm run build` — build core → web → desktop in order
- `npm run build:web` — web-only build (skips Electron)
- `npm run pack` — `electron-builder --dir` (unpacked desktop bundle for smoke-testing)
- `npm run dist` — full signed/notarized installer build
- `npm run lint` / `npm run test` — fan out to every workspace that defines the script

Workspace-scoped: `npm run <script> -w @octoflash/web` (or `@octoflash/core`, `@octoflash/desktop`).

**First-time setup:** `npm install` at the root installs everything. Then in `packages/web` run `npx shadcn@latest add button input label card badge tabs textarea switch separator tooltip dialog sheet command dropdown-menu sidebar avatar resizable progress scroll-area sonner skeleton breadcrumb` — the components are imported from `@/components/ui/*` everywhere but **the `ui/` folder is not vendored**.

## What this is

Frontend for **Octoflash AI** — an IDE-style tool for turning YouTube shorts into Manim animations. Ships as **both a web app and an Electron desktop app** from the same React codebase. The Python FastAPI backend is in a separate repo and is **not** part of this workspace; the web/desktop client reaches it over HTTP.

Architecture mirrors [`CoderCouple/octonote`](https://github.com/CoderCouple/octonote): npm workspaces, flat `packages/*` layout, Vite + React for web, Electron 33 for desktop, a shared TS `core` package.

## Workspace layout

```
packages/
├── core/        @octoflash/core — pure TS. Domain types, fixtures, API client, runtime config, IPC contract.
├── web/         @octoflash/web — Vite + React 18 + Tailwind v4 + react-router + Zustand + react-query.
└── desktop/     @octoflash/desktop — Electron 33. Loads packages/web in a BrowserWindow.
```

Every cross-package import is `from "@octoflash/core"` (never relative `../../core`).

## Runtime config is config-driven, local-first

The FastAPI base URL is **never** hard-coded in components. Resolution lives in `packages/core/src/config.ts` (`getRuntimeConfig()`):

1. **Desktop**: `window.octoflash.config.apiUrl`, populated by `main.ts` → `loadConfig()` → `~/Library/Application Support/Octoflash AI/config.json` (auto-created with defaults on first launch).
2. **Web**: `import.meta.env.VITE_API_URL`, set in `packages/web/.env.local` (see `.env.example`).
3. **Fallback**: `http://localhost:8000` — assume the Python backend is running locally.

All HTTP goes through `packages/core/src/api/client.ts` (`api.get/post/patch`). Each domain has its own typed module: `projects.ts`, `scenes.ts`, `jobs.ts`. Endpoints mirror the spec in `packages/web/src/components/editor/README.md`. There is no mock adapter — point `VITE_API_URL` at a real backend (or a stub).

## Web ↔ Desktop bridge

`packages/core/src/desktop-bridge.ts` declares the `DesktopBridge` type. The Electron preload (`packages/desktop/src/preload.ts`) exposes a matching object on `window.octoflash`. Web components consume it through `packages/web/src/lib/platform.ts`, which returns a no-op shim in a plain browser — so **components never branch on `isDesktop`**.

Adding a native capability is always three coordinated edits: the type in `desktop-bridge.ts`, the `ipcMain.handle` in `packages/desktop/src/ipc-handlers.ts`, and the `contextBridge` entry in `preload.ts`.

## Routing — Vite + react-router (no Next.js)

`packages/web/src/routes.tsx` is the router. The layout convention:

- `/login` is its own top-level route (unauthed surface).
- All authed routes are children of the `<AppShell>` layout route, which renders `SidebarProvider` + `AppSidebar` + `SiteHeader` + the ⌘K `CommandMenu` and uses `<Outlet />` for children.
- Pages live in `packages/web/src/pages/`; bracketed filenames (`channels/[id].tsx`, `workspace/[id].tsx`) are param routes — Vite doesn't care about the brackets, the mapping happens in `routes.tsx`.

## The state-driven workspace

`pages/workspace/[id].tsx` is the central pattern. It looks up a `Video` by id from the `VIDEOS` fixture and reads `?state=analyzing|analyzed|generating|generated|...` from the URL to swap the **center panel** between four state components in `components/workspace/states/`. The full lifecycle (`VideoStatus` in `@octoflash/core`) is `queued → analyzing → analyzed → generating → generated → published | failed`. Walking the lifecycle by hand just means changing `?state` — there is no real state machine yet; the FastAPI backend will own state transitions.

Layout is three `ResizablePanel`s — `LeftConfig` | state component | `RightInspector`. Toolbar buttons (`Generate`, `Re-analyze`, `Publish`) are conditionally rendered off `status`.

## The editor module (`packages/web/src/components/editor/`)

This is its own mini-app with a dedicated README — read `components/editor/README.md` before changing anything here. Key invariants:

- `<EditorShell>` is the single entry point; `pages/editor/index.tsx` just mounts it. It owns all editor state (selected scene, variant, tab, mode, scope). Currently `useState`-based; will migrate to a Zustand store opportunistically as features grow.
- Two top-level modes: **timeline** (PreviewCanvas + TransportControls + BottomPanel) and **workflow** (`WorkflowCanvas` rendering a DAG from `core/workflow.ts`). Toggle via `EditorTopbar`'s mode control.
- **Scene-first, not timeline-first**: each `Scene` is an independent render; editing one scene only invalidates that scene + downstream workflow nodes. Don't introduce timeline-wide state that breaks this.
- Users never write Manim — they pick a `TemplateId` + `StyleId` and the backend compiles it. `TEMPLATES` / `STYLES` / `TEMPLATE_CATEGORIES` in `core/scenes.ts` are the source of truth.
- `core/workflow.ts` `DEFAULT_WORKFLOW` describes the DAG node kinds (`start | scene | branch | merge | end`). A project can have multiple `end` nodes → multiple variant cuts; `pathSet()` is the BFS used to dim non-active edges.

## Design source-of-truth

The `design/` folder at the repo root holds 26 single-line HTML exports, one per screen/state (Login, Videos, Channels, Workspace states, Editor tabs, Workflow mode, Publish dialogs, etc.). They are **the spec** — if a component drifts from the design, the design wins. Each file has every computed CSS property inlined per element; to read one, strip the styles first:

```bash
python3 -c "
import re, sys
html = open(sys.argv[1]).read()
html = re.sub(r'\s*style=\"[^\"]*\"', '', html)
html = re.sub(r'\s*data-om-id=\"[^\"]*\"', '', html)
print(re.sub(r'>(\s*)<', '>\n<', html))
" "design/Login _ auth.html" > /tmp/login.html
```

## Tailwind v4 + shadcn (new-york / neutral)

`packages/web/src/index.css` is the canonical token file. Tokens live in `:root` / `.dark` as raw HSL triplets and are surfaced to Tailwind via `@theme inline { --color-* : hsl(var(--*)) }`. shadcn primitives generated by the CLI will use `bg-background`, `text-foreground`, etc., which resolve through that mapping. **Don't move the tokens** — the design HTMLs assume these exact values.
