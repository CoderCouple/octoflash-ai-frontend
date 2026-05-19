# octoflash-ai-frontend

A Next.js 15 (App Router) + shadcn/ui scaffold for the Octoflash AI redesign.
Drop-in replacement for the single-file HTML prototype.

## 1. Bootstrap

```bash
pnpm create next-app@latest octoflash-ai-frontend \
  --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*"

cd octoflash-ai-frontend
pnpm dlx shadcn@latest init -d        # neutral · zinc · CSS vars
```

## 2. Add shadcn primitives

```bash
pnpm dlx shadcn@latest add \
  button input label card badge tabs textarea switch separator \
  tooltip dialog sheet command dropdown-menu sidebar avatar \
  resizable progress scroll-area sonner skeleton breadcrumb
```

## 3. Install lucide + extras

```bash
pnpm add lucide-react cmdk
```

## 4. Drop these files in

Copy everything in this folder into your new project root, overwriting:

```
app/                    # routes
components/             # custom components (not the ui/ primitives)
lib/                    # mock data + helpers
```

`app/globals.css` is the full shadcn neutral token set (light + dark) — replace
the one shadcn init wrote.

## 5. Run

```bash
pnpm dev
```

Routes:
- `/login` — auth
- `/videos` — home (card grid)
- `/channels/[id]` — channel rail + shorts feed
- `/workspace/[id]?state=analyzing|analyzed|rendering|completed` — IDE workspace

Tweak the `?state` query param to walk the full lifecycle. The Publish dialog
opens on the completed state via the toolbar Publish button.
