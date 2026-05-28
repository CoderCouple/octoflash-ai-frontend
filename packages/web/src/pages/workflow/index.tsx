/**
 * Workflows list — `/workflow`.
 *
 * Row-style layout (one workflow per row) inspired by scrape-flow's
 * `/dashboard/workflows`. Each row carries:
 *
 *   ┌──────────────────────────────────────────────────────────────────────┐
 *   │ [●]  Project title   [Draft?]                       [Run] [Edit] [⋮] │
 *   │      └ <subtitle: scene count · orientations>                        │
 *   ├──────────────────────────────────────────────────────────────────────┤
 *   │ Last run: ● status, <relative time>     Status: <project.status>     │
 *   └──────────────────────────────────────────────────────────────────────┘
 *
 * Status icon switches per project state:
 *   queued / analyzing / generating → spinning Loader2 (in-flight)
 *   analyzed                         → FileText (draft — has brief, no video)
 *   generated / published            → Play (ready to watch / publish)
 *   failed                           → AlertCircle
 *   no scenes + nothing started      → ListTree (blank canvas)
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  FileText,
  ListTree,
  Loader2,
  MoreVertical,
  Play,
  Plus,
  RotateCw,
  Shuffle,
  Trash,
} from "lucide-react";

import { SortMenu, applySort, type SortKey } from "@/components/sort-menu";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useJobsStore } from "@/store/jobsStore";
import { useProjectsStore } from "@/store/projectsStore";
import type { Project, ProjectStatus } from "@octoflash/core";

const FILTER_TABS: { v: ProjectStatus | "all"; label: string }[] = [
  { v: "all",        label: "All" },
  { v: "queued",     label: "Queued" },
  { v: "analyzing",  label: "Analyzing" },
  { v: "analyzed",   label: "Analyzed" },
  { v: "generating", label: "Generating" },
  { v: "generated",  label: "Generated" },
  { v: "failed",     label: "Failed" },
];

export default function WorkflowListPage() {
  const { projects, loading, error, loadProjects } = useProjectsStore();
  const [filter, setFilter] = useState<ProjectStatus | "all">("all");
  const [sort, setSort] = useState<SortKey>("newest");

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const counts = useMemo(() => {
    const out: Record<string, number> = { all: projects.length };
    for (const p of projects) out[p.status] = (out[p.status] || 0) + 1;
    return out;
  }, [projects]);

  const visible = useMemo(() => {
    const filtered = filter === "all" ? projects : projects.filter((p) => p.status === filter);
    return applySort(filtered, sort);
  }, [filter, projects, sort]);

  return (
    <div className="px-7 py-6 max-w-[1280px] mx-auto">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your workflows</p>
        </div>
        <Button asChild size="sm">
          <Link to="/editor">
            <Plus className="size-3.5 mr-1.5" />
            Create workflow
          </Link>
        </Button>
      </div>

      {/* ── Filter tabs ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <Tabs
          value={filter}
          onValueChange={(v: string) => setFilter(v as ProjectStatus | "all")}
        >
          <TabsList className="h-8">
            {FILTER_TABS.map((t) => (
              <TabsTrigger key={t.v} value={t.v} className="text-xs">
                {t.label}
                {counts[t.v] !== undefined && counts[t.v] > 0 && (
                  <span className="ml-1.5 text-muted-foreground">{counts[t.v]}</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <SortMenu value={sort} onChange={setSort} />
      </div>

      {/* ── Loading / error / empty ────────────────────────────────── */}
      {loading && projects.length === 0 && (
        <div className="text-sm text-muted-foreground py-10 text-center">
          Loading workflows…
        </div>
      )}
      {error && (
        <div className="text-sm text-destructive py-10 text-center">
          Couldn't load workflows: {error}
        </div>
      )}
      {!loading && projects.length === 0 && !error && (
        <EmptyState />
      )}

      {/* ── Rows ───────────────────────────────────────────────────── */}
      {visible.length > 0 && (
        <div className="flex flex-col gap-3">
          {visible.map((p) => (
            <WorkflowRow key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Row card
// ────────────────────────────────────────────────────────────────────────────

function WorkflowRow({ project: p }: { project: Project }) {
  const navigate = useNavigate();
  const startGenerate = useJobsStore((s) => s.startGenerate);
  const deleteProject = useProjectsStore((s) => s.deleteProject);
  const [running, setRunning] = useState(false);

  const meta = statusIcon(p.status);
  const isDraft = p.status === "queued" || p.status === "analyzing" || p.status === "analyzed";
  const inFlight = p.status === "analyzing" || p.status === "generating";

  async function onRun(e: React.MouseEvent) {
    e.preventDefault();
    setRunning(true);
    try {
      await startGenerate(p.id);
    } catch (err) {
      console.error("[workflow-row] generate failed:", err);
    } finally {
      setRunning(false);
    }
  }

  async function onDelete() {
    // Projects and workflows are 1:1 in this app, so deleting the
    // workflow row deletes the parent project too (soft-delete).
    if (!confirm(
      `Delete "${p.title}"?\n\n` +
      "This also removes the project — a workflow can't exist without one. " +
      "Soft-delete; can be restored from the DB until purged."
    )) return;
    try {
      await deleteProject(p.id);
    } catch (err) {
      console.error("[workflow-row] delete failed:", err);
    }
  }

  // Whole-card click → open the workflow editor. Action buttons inside the
  // card stop propagation so clicking them doesn't ALSO navigate.
  const openEditor = () => navigate(`/workflow/${p.id}`);
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <Card
      role="link"
      tabIndex={0}
      onClick={openEditor}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openEditor();
        }
      }}
      className="overflow-hidden rounded-lg shadow-none cursor-pointer hover:border-foreground/30 hover:bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
    >
      {/* ── Main row ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2 gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <StatusBadge meta={meta} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[13px] font-semibold truncate"
                title={p.title}
              >
                {p.title}
              </span>
              {isDraft && (
                <span className="px-1.5 py-0 text-[9px] font-medium uppercase tracking-wider bg-muted text-muted-foreground rounded">
                  Draft
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="font-mono uppercase">{p.orientation}</span>
              {p.sourceUrl && (
                <>
                  <span>·</span>
                  <span className="truncate max-w-[240px]">{safeHostname(p.sourceUrl)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0" onClick={stop}>
          {!isDraft && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px]"
              onClick={onRun}
              disabled={running || inFlight}
            >
              {running || inFlight ? (
                <Loader2 className="size-3 mr-1 animate-spin" />
              ) : (
                <Play className="size-3 mr-1" />
              )}
              Run
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[11px]"
            onClick={openEditor}
          >
            <Shuffle className="size-3 mr-1" />
            Edit
          </Button>
          <DropdownMenu>
            {/* Trigger rendered directly (no asChild) — see sort-menu.tsx
                for why; the asChild+Button pattern was misbehaving on
                this page (kebab opened but content was empty). */}
            <DropdownMenuTrigger
              aria-label="Workflow actions"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-7 w-7 p-0",
              )}
            >
              <MoreVertical className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate(`/projects/${p.id}`)}>
                Open overview
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => void startGenerate(p.id)}
                disabled={inFlight || p.status === "queued"}
              >
                <RotateCw className="size-3.5 mr-1.5" />
                {p.status === "failed" ? "Retry" : "Re-generate"}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={onDelete}
              >
                <Trash className="size-3.5 mr-1.5" /> Delete project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Footer strip (only when there's run history to show) ───── */}
      {!isDraft && (
        <div className="flex items-center justify-between gap-3 px-3 py-1.5 border-t bg-muted/30 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span>Last run:</span>
            <span
              className={cn(
                "inline-block size-1.5 rounded-full",
                p.status === "failed" ? "bg-destructive" :
                p.status === "generating" ? "bg-foreground animate-pulse" :
                "bg-foreground/60",
              )}
            />
            <span className="font-medium">{p.status}</span>
            <span>·</span>
            <span>{relativeTime(p.updatedAt)}</span>
          </div>
          <div className="font-mono">
            {new Date(p.updatedAt).toLocaleString(undefined, {
              dateStyle: "short", timeStyle: "short",
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Status icon mapping
// ────────────────────────────────────────────────────────────────────────────

type StatusIconMeta = {
  Icon: typeof Play;
  bgClass: string;
  iconClass: string;
  /** When true, the icon itself spins (in-flight states). */
  animate: boolean;
  /** Optional halo around the badge for additional state signal:
   *   - "ping" — fading outward ring (queued / generating — "something is happening")
   *   - "pulse" — soft fade on the bg itself (failed — "needs attention")
   *   - "" — no halo (terminal states already read clearly via solid bg). */
  haloClass?: string;
};

/**
 * Monochrome palette — only failed states keep colour for safety; everything
 * else uses theme `foreground` / `muted-foreground` so the row reads as a
 * grayscale system. Spinning Loader2 carries the "in-flight" signal without
 * needing a special hue.
 */
function statusIcon(status: ProjectStatus): StatusIconMeta {
  switch (status) {
    case "queued":
    case "analyzing":
      return {
        Icon: Loader2,
        bgClass: "bg-muted",
        iconClass: "text-muted-foreground",
        animate: true,
        haloClass: "bg-muted-foreground/30",
      };
    case "analyzed":
      return {
        Icon: FileText,
        bgClass: "bg-muted",
        iconClass: "text-muted-foreground",
        animate: false,
      };
    case "generating":
      return {
        Icon: Loader2,
        bgClass: "bg-foreground/10",
        iconClass: "text-foreground",
        animate: true,
        haloClass: "bg-foreground/30",
      };
    case "generated":
    case "published":
      return {
        Icon: Play,
        bgClass: "bg-foreground",
        iconClass: "text-background",
        animate: false,
      };
    case "failed":
      return {
        Icon: AlertCircle,
        bgClass: "bg-destructive/15",
        iconClass: "text-destructive",
        animate: false,
        haloClass: "bg-destructive/40",
      };
    default:
      return {
        Icon: ListTree,
        bgClass: "bg-muted",
        iconClass: "text-muted-foreground",
        animate: false,
      };
  }
}

function StatusBadge({ meta }: { meta: StatusIconMeta }) {
  const { Icon, bgClass, iconClass, animate, haloClass } = meta;
  return (
    <div className="relative size-7 shrink-0 flex items-center justify-center">
      {/* Halo: full-bleed ring that pings outward for in-flight + fades for
          failed. Static states omit it. */}
      {haloClass && (
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 rounded-full opacity-60",
            haloClass,
            // ping = expand+fade (good for "in flight"); failed uses a softer pulse.
            animate ? "animate-ping" : "animate-pulse",
          )}
        />
      )}
      <div className={cn("relative size-7 rounded-full flex items-center justify-center", bgClass)}>
        <Icon className={cn("size-3.5", iconClass, animate && "animate-spin")} />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Empty state + helpers
// ────────────────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col gap-4 h-[300px] items-center justify-center">
      <div className="rounded-full bg-accent size-20 flex items-center justify-center">
        <ListTree className="size-10 stroke-primary" />
      </div>
      <div className="flex flex-col gap-1 text-center">
        <p className="font-bold">No workflows yet</p>
        <p className="text-sm text-muted-foreground">
          Click below to create your first workflow on a blank canvas.
        </p>
      </div>
      <Button asChild size="sm">
        <Link to="/editor">
          <Plus className="size-3.5 mr-1.5" />
          Create your first workflow
        </Link>
      </Button>
    </div>
  );
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.slice(0, 40);
  }
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Tiny relative-time formatter — "5m ago", "2h ago", "3d ago", "—" for invalid. */
function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (Number.isNaN(diff)) return "—";
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  return `${Math.floor(diff / DAY)}d ago`;
}
