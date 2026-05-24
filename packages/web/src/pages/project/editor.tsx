/**
 * Project EDITOR page — `/workflow/:id`.
 *
 * Full-screen workflow editor: React Flow DAG + clip sidebar.
 * Renders OUTSIDE the AppShell (no left nav, no top header) — the topbar
 * below is the only chrome.
 * Modeled on the `/workflow/editor/[id]` pattern from context0-next-frontend.
 *
 * Layout:
 *   topbar       — back link, title, status, Generate, Re-analyze (later)
 *   canvas       — React Flow DAG of clips
 *   sidebar      — slides in on clip click (player + prompt editor + regen)
 *
 * Polling: `useProjectPolling` keeps the page live while any clip is in
 * flight (scripting/rendering) so users watching a regenerate see the
 * status flip without manual refresh.
 */

import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  PanelRightOpen,
  Sparkles,
  Wand2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/status-pill";
import { NodePalette } from "@/components/workflow/node-palette";
import { FlowEditor, type SelectedNode } from "@/components/workflow/flow-editor";
import { ClipSidebar } from "@/pages/project/clip-sidebar";
import { SourceSidebar } from "@/pages/project/source-sidebar";
import { TargetSidebar } from "@/pages/project/target-sidebar";
import { useProjectPolling } from "@/hooks/use-project-polling";
import { useJobsStore } from "@/store/jobsStore";
import { useProjectsStore } from "@/store/projectsStore";
import { TaskType } from "@/workflow-engine/types";

export default function ProjectEditorPage() {
  const { id } = useParams<{ id: string }>();
  const { currentProject, loading, error, openProject } = useProjectsStore();
  const startGenerate = useJobsStore((s) => s.startGenerate);
  const [selectedNode, setSelectedNode] = useState<SelectedNode>(null);
  const [generating, setGenerating] = useState(false);
  /** Collapsed = thin rail with expand button; open = full 380px ClipSidebar. */
  const [previewOpen, setPreviewOpen] = useState(true);

  useEffect(() => {
    if (id) void openProject(id);
  }, [id, openProject]);

  // Auto-refresh while any clip is in flight (regen, initial generate, etc).
  const refetch = useCallback(async () => {
    if (id) await openProject(id);
  }, [id, openProject]);
  useProjectPolling(currentProject, refetch);

  async function onGenerate() {
    if (!currentProject) return;
    setGenerating(true);
    try {
      await startGenerate(currentProject.id, 5);
    } catch (e) {
      console.error("[editor] startGenerate failed:", e);
    } finally {
      setGenerating(false);
    }
  }

  if (loading && !currentProject) {
    return <Centered>Loading editor…</Centered>;
  }
  if (error) {
    return <Centered tone="error">Couldn’t load: {error}</Centered>;
  }
  if (!currentProject) {
    return <Centered>Project not found.</Centered>;
  }

  const p = currentProject;
  // Resolve the Scene row a selected scene-node points at. The DAG node id
  // is a `wni_*` (workflow_node_instance) — distinct from `scn_*` (scene)
  // — so we can't just compare ids. Resolution priority:
  //   1. node.data.scene_id — set by the backend bind step when Generate
  //      materializes Scene rows AND updates the node payload.
  //   2. (node.data.n, orientation='portrait') — the seed activity writes
  //      `n` into every scene-node's data; this matches it back to the
  //      Scene row created by GenerateVideoWorkflow's create_scenes step.
  //      Works even if the backend bind step hasn't run yet.
  // Falls through to null when neither matches — sidebar surfaces a
  // "planned but not rendered" placeholder.
  const selectedScene = (() => {
    if (selectedNode?.type !== TaskType.SCENE) return null;
    const data = selectedNode.data as { scene_id?: string; n?: number } | undefined;
    if (data?.scene_id) {
      return p.scenes.find((s) => s.id === data.scene_id) ?? null;
    }
    if (typeof data?.n === "number") {
      return (
        p.scenes.find(
          (s) => s.n === data.n && (s.orientation ?? "portrait") === "portrait",
        ) ?? null
      );
    }
    // Legacy fallback — old FE seedFromScenes path used scene.id as the
    // React Flow node id directly.
    return p.scenes.find((s) => s.id === selectedNode.id) ?? null;
  })();
  const canGenerate =
    p.status === "analyzed" || p.status === "generated" || p.status === "failed";

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      {/* ── Topbar ─────────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 border-b px-4 h-11 bg-card/50">
        <Button asChild variant="ghost" size="sm" className="h-7 -ml-2">
          <Link to={`/projects/${p.id}`}>
            <ChevronLeft className="size-3.5 mr-1" />
            <span className="text-[12px]">Overview</span>
          </Link>
        </Button>
        <div className="flex items-baseline gap-2 min-w-0">
          <h1 className="text-[13px] font-semibold tracking-tight truncate">
            {p.title}
          </h1>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            · {p.scenes.length} clip{p.scenes.length === 1 ? "" : "s"}
          </span>
        </div>
        <StatusPill status={p.status} />

        <div className="ml-auto flex items-center gap-1.5">
          <Button size="sm" variant="outline" className="h-7" disabled>
            <Wand2 className="size-3.5 mr-1" />
            Re-analyze
          </Button>
          <Button
            size="sm"
            className="h-7"
            onClick={onGenerate}
            disabled={!canGenerate || generating || p.status === "generating"}
          >
            {generating || p.status === "generating" ? (
              <>
                <Loader2 className="size-3.5 mr-1 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="size-3.5 mr-1" />
                {p.status === "generated" ? "Re-generate" : "Generate"}
              </>
            )}
          </Button>
        </div>
      </header>

      {/* ── Main: palette (left) + canvas (centre) + preview (right) ── */}
      <div className="flex flex-1 overflow-hidden">
        <NodePalette />

        <div className="flex-1 relative min-w-0">
          <FlowEditor
            project={p}
            selectedNode={selectedNode}
            onSelectNode={setSelectedNode}
          />
        </div>

        {previewOpen ? (
          <aside className="flex w-[380px] shrink-0 flex-col border-l bg-card overflow-hidden">
            <div className="flex h-9 items-center justify-between border-b px-2">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Preview
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setPreviewOpen(false)}
                aria-label="Collapse preview"
              >
                <ChevronsRight className="size-3.5" />
              </Button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              {selectedNode === null ? (
                <div className="h-full grid place-items-center text-[11px] text-muted-foreground px-6 text-center">
                  Click a node on the canvas to preview it here.
                </div>
              ) : selectedNode.type === TaskType.SCENE && selectedScene ? (
                <ClipSidebar scene={selectedScene} />
              ) : selectedNode.type === TaskType.SCENE ? (
                <PlannedClipPlaceholder
                  data={selectedNode.data as { title?: string; brief?: string; duration?: number; n?: number }}
                />
              ) : selectedNode.type === TaskType.SOURCE_URL ? (
                <SourceSidebar project={p} variant="url" />
              ) : selectedNode.type === TaskType.SOURCE_TEXT ? (
                <SourceSidebar project={p} variant="text" />
              ) : selectedNode.type === TaskType.TARGET ? (
                <TargetSidebar project={p} />
              ) : (
                <div className="h-full grid place-items-center text-[11px] text-muted-foreground px-6 text-center">
                  No preview for this node type yet.
                </div>
              )}
            </div>
          </aside>
        ) : (
          <aside className="flex w-9 shrink-0 flex-col items-center border-l bg-card/30 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setPreviewOpen(true)}
              aria-label="Expand preview"
              title="Expand preview"
            >
              <ChevronsLeft className="size-3.5" />
            </Button>
            <div className="mt-3 -rotate-90 origin-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1 whitespace-nowrap">
              <PanelRightOpen className="size-3" /> Preview
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function Centered({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "error";
}) {
  return (
    <div
      className={
        "h-full grid place-items-center text-sm text-center px-6 " +
        (tone === "error" ? "text-red-500" : "text-muted-foreground")
      }
    >
      {children}
    </div>
  );
}


/**
 * Placeholder shown when a scene node on the DAG doesn't yet have a backing
 * Scene row — i.e. analyze seeded the planned clips but Generate hasn't run
 * to materialize them as renderable scenes. Surfaces the planned title /
 * brief / duration from the node's data so the user knows what this slot
 * will become.
 */
function PlannedClipPlaceholder({
  data,
}: {
  data: { title?: string; brief?: string; duration?: number; n?: number };
}) {
  const title = data.title ?? (typeof data.n === "number" ? `Clip ${data.n}` : "Clip");
  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          Planned · not rendered
        </div>
        <h2 className="text-[15px] font-semibold leading-tight mt-1">{title}</h2>
        {typeof data.duration === "number" && (
          <div className="text-[11px] text-muted-foreground mt-0.5">
            ≈ {data.duration.toFixed(1)} s
          </div>
        )}
      </div>

      {data.brief && (
        <div className="space-y-1.5">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
            Brief
          </div>
          <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap text-foreground/85">
            {data.brief}
          </p>
        </div>
      )}

      <div className="rounded-md border border-dashed bg-muted/30 px-3 py-3 text-[11.5px] text-muted-foreground">
        This clip will render when you click <span className="font-medium text-foreground">Generate</span> on
        the project. After generation finishes you can edit the prompt and
        regenerate this clip individually.
      </div>
    </div>
  );
}
