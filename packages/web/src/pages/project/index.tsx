/**
 * Project OVERVIEW page — `/projects/:id`.
 *
 * "Look at the project, watch the final video." Doesn't host the DAG; that
 * lives at `/workflow/:id` (full-screen workflow editor, no left nav).
 *
 * Layout:
 *   header  — title, status pill, Generate button, "Open editor" link
 *   brief   — collapsible 3-tab viewer (transcript / description / manim_prompt)
 *   body    — placeholder for final-video player (slice 7)
 *
 * Polling: `useProjectPolling` auto-refreshes while status ∈ in-flight states
 * so the user sees `queued → analyzing → analyzed → generating → generated`
 * progress live without manual refresh.
 */

import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Loader2, Send, Sparkles, Smartphone, Monitor, Workflow as WorkflowIcon } from "lucide-react";

import { projectsApi, type Orientation, type ProjectDetail } from "@octoflash/core";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusPill } from "@/components/status-pill";
import { BriefPanel } from "@/pages/project/brief-panel";
import { PublishDialog } from "@/pages/project/publish-dialog";
import { useProjectPolling } from "@/hooks/use-project-polling";
import { useJobsStore } from "@/store/jobsStore";
import { useProjectsStore } from "@/store/projectsStore";

export default function ProjectOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const { currentProject, loading, error, openProject } = useProjectsStore();
  const startGenerate = useJobsStore((s) => s.startGenerate);
  // Watch jobsStore for any in-flight generate execution against this
  // project. Closes the race window where the project row still says
  // `analyzed` (workflow's first activity hasn't fired yet) but a
  // generate is already running. With the BE idempotency in place
  // (commit 2bcc493) a duplicate click is harmless, but we still want
  // the button to reflect reality.
  const jobs = useJobsStore((s) => s.jobs);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [searchParams] = useSearchParams();

  // Allow `?publish=1` to deep-link straight into the dialog — useful for
  // headless smoke tests and shareable "click here to publish" URLs.
  useEffect(() => {
    if (searchParams.get("publish") === "1") setPublishOpen(true);
  }, [searchParams]);

  useEffect(() => {
    if (id) void openProject(id);
  }, [id, openProject]);

  // Re-fetch on a fixed interval while anything is in flight.
  const refetch = useCallback(async () => {
    if (id) await openProject(id);
  }, [id, openProject]);
  useProjectPolling(currentProject, refetch);

  async function onGenerate() {
    if (!currentProject) return;
    setGenerateError(null);
    setGenerating(true);
    try {
      await startGenerate(currentProject.id, 5);
      // Don't clear `generating` here — useProjectPolling only kicks in
      // once `p.status` is in-flight, and the backend Temporal workflow
      // hasn't flipped status yet at this point. Burst-poll until status
      // moves off "analyzed", then the effect below clears the flag and
      // hands off to useProjectPolling.
    } catch (e) {
      setGenerateError((e as Error).message);
      setGenerating(false);
    }
  }

  // While we've locally started generate but the server hasn't yet flipped
  // status, burst-poll every 500ms so the in-flight state shows up without
  // a manual refresh. Clears `generating` once status leaves "analyzed".
  useEffect(() => {
    if (!generating || !id) return;
    if (currentProject && currentProject.status !== "analyzed") {
      setGenerating(false);
      return;
    }
    const handle = setInterval(() => void openProject(id), 500);
    return () => clearInterval(handle);
  }, [generating, id, currentProject, openProject]);

  if (loading && !currentProject) {
    return <ShellMessage>Loading project…</ShellMessage>;
  }
  if (error) {
    return <ShellMessage tone="error">Couldn’t load: {error}</ShellMessage>;
  }
  if (!currentProject) {
    return <ShellMessage>Project not found.</ShellMessage>;
  }

  const p = currentProject;
  // True when jobsStore holds any in-flight generate execution for
  // this project — covers the race between from-text returning
  // status=analyzed and the workflow's first activity flipping it.
  const generateInFlight = Object.values(jobs).some(
    (e) =>
      e.projectId === p.id &&
      e.kind === "generate" &&
      (e.status === "RUNNING" || e.status === "PENDING"),
  );
  const canGenerate = p.status === "analyzed" || p.status === "generated" || p.status === "failed";
  // Backend now stores two final URLs (one per orientation). Prefer portrait
  // since most projects are vertical-first; fall back to landscape if only
  // that orientation was rendered.
  const finalUrl = p.finalPortraitVideoUrl ?? p.finalLandscapeVideoUrl;
  const showFinalVideo = p.status === "generated" && !!finalUrl;
  // Pre-analysis states block all destructive UI (Generate / Open workflow)
  // via a modal. Once analyzed, the user can act on the project.
  const blockingInFlight = p.status === "queued" || p.status === "analyzing";
  const generatingInline = p.status === "generating";

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 border-b px-6 py-3">
        <Link
          to="/projects"
          className="text-[12px] text-muted-foreground hover:text-foreground"
        >
          ← Projects
        </Link>
        <h1 className="text-[15px] font-semibold tracking-tight truncate">
          {p.title}
        </h1>
        <StatusPill status={p.status} />

        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            onClick={onGenerate}
            disabled={!canGenerate || generating || p.status === "generating" || generateInFlight}
          >
            {generating || p.status === "generating" || generateInFlight ? (
              <>
                <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="size-3.5 mr-1.5" />
                {p.status === "generated" ? "Re-generate" : "Generate"}
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPublishOpen(true)}
            disabled={!p.finalPortraitVideoUrl && !p.finalLandscapeVideoUrl}
            title={
              p.finalPortraitVideoUrl || p.finalLandscapeVideoUrl
                ? "Publish to a connected target"
                : "Run Generate first"
            }
          >
            <Send className="size-3.5 mr-1.5" />
            Publish
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to={`/workflow/${p.id}`}>
              <WorkflowIcon className="size-3.5 mr-1.5" />
              Open workflow
            </Link>
          </Button>
        </div>
      </header>

      <PublishDialog
        project={p}
        open={publishOpen}
        onOpenChange={setPublishOpen}
      />

      {generateError && (
        <div className="text-xs text-destructive px-6 py-2 border-b bg-destructive/5">
          Couldn’t start generate: {generateError}
        </div>
      )}

      {/* ── Main body: brief sidebar (left) + video player (right) ──── */}
      <div className="flex-1 grid min-h-0 grid-cols-1 lg:grid-cols-[minmax(280px,1fr)_minmax(0,1.4fr)] divide-y lg:divide-y-0 lg:divide-x">
        <BriefPanel project={p} />
        <div className="grid place-items-center p-6 min-h-0 overflow-y-auto">
          {showFinalVideo ? (
            <FinalVideoTabs project={p} />
          ) : generatingInline ? (
            <InFlightLoader
              status={p.status}
              sceneCount={p.scenes.length}
              sourceUrl={p.sourceUrl}
            />
          ) : (
            <div className="text-center text-sm text-muted-foreground space-y-1">
              <div className="font-mono text-xs">{p.id}</div>
              <div>status: {p.status} · scenes: {p.scenes.length}</div>
              {p.sourceUrl && (
                <a
                  href={p.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-xs hover:underline text-muted-foreground"
                >
                  source: {p.sourceUrl}
                </a>
              )}
              <div className="text-[11px] opacity-70 pt-3 max-w-md mx-auto">
                {nextStepHint(p.status, p.scenes.length)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Blocking modal during pre-analysis. User can wait or back out. */}
      <Dialog open={blockingInFlight}>
        <DialogContent
          showCloseButton={false}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className="sm:max-w-md"
        >
          <div className="flex flex-col items-center text-center gap-3 py-2">
            <Loader2 className="size-10 text-foreground/70 animate-spin" />
            <DialogTitle className="text-base">
              {p.status === "queued" ? "Queued for analysis" : "Analyzing source"}
            </DialogTitle>
            <DialogDescription className="text-[12.5px] leading-relaxed">
              {nextStepHint(p.status, p.scenes.length)}
            </DialogDescription>
            <Button asChild variant="ghost" size="sm" className="mt-2">
              <Link to="/projects">← Back to projects</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Final video player with a portrait/landscape toggle.
 *
 * The backend now stores two finals per project (one per orientation). When
 * both are populated we show a Tabs control to switch; when only one is set
 * we render it directly. The `<video>` aspect ratio adapts so portrait isn't
 * stretched to landscape's box.
 *
 * The `?t=updatedAt` cache-bust forces the browser to re-fetch the MP4 when
 * a regenerate writes a new file under the same path.
 */
function FinalVideoTabs({ project }: { project: ProjectDetail }) {
  const hasPortrait = !!project.finalPortraitVideoUrl;
  const hasLandscape = !!project.finalLandscapeVideoUrl;
  const initial: Orientation = hasPortrait ? "portrait" : "landscape";
  const [orientation, setOrientation] = useState<Orientation>(initial);

  const bust = encodeURIComponent(project.updatedAt);
  const src = `${projectsApi.previewUrl(project.id, orientation)}&t=${bust}`;
  const aspectClass = orientation === "portrait" ? "aspect-[9/16]" : "aspect-video";

  return (
    <div className="w-full max-w-md">
      {hasPortrait && hasLandscape && (
        <Tabs
          value={orientation}
          onValueChange={(v) => setOrientation(v as Orientation)}
          className="mb-3"
        >
          <TabsList className="h-8">
            <TabsTrigger value="portrait" className="text-xs">
              <Smartphone className="size-3 mr-1" /> Portrait
            </TabsTrigger>
            <TabsTrigger value="landscape" className="text-xs">
              <Monitor className="size-3 mr-1" /> Landscape
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}
      <video
        key={`${orientation}-${project.updatedAt}`}
        src={src}
        controls
        preload="metadata"
        className={`w-full rounded-md border bg-black ${aspectClass}`}
      />
    </div>
  );
}

function InFlightLoader({
  status,
  sceneCount,
  sourceUrl,
}: {
  status: string;
  sceneCount: number;
  sourceUrl: string | null;
}) {
  const title =
    status === "queued"
      ? "Queued for analysis"
      : status === "analyzing"
        ? "Analyzing source"
        : "Generating clips";
  return (
    <div className="w-full max-w-md rounded-lg border bg-card p-8 flex flex-col items-center text-center gap-3">
      <Loader2 className="size-10 text-foreground/70 animate-spin" />
      <div className="text-sm font-medium">{title}</div>
      <div className="text-[12px] text-muted-foreground leading-relaxed">
        {nextStepHint(status, sceneCount)}
      </div>
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] underline text-muted-foreground hover:text-foreground truncate max-w-full"
        >
          {sourceUrl}
        </a>
      )}
    </div>
  );
}

function nextStepHint(status: string, sceneCount: number): string {
  switch (status) {
    case "queued":
    case "analyzing":
      return "Analyze is running — transcript, frames, and visual description are being extracted. Polling for updates.";
    case "analyzed":
      return "Brief is ready. Edit it in the panel above, then click Generate to plan + render clips.";
    case "generating":
      return `Generating ${sceneCount || "N"} clips in parallel — script generation, Manim render, and ffmpeg concat. Polling for updates.`;
    case "generated":
      return "Done. Watch above, or open the editor to inspect/edit individual clips.";
    case "failed":
      return "Something failed. Check the job logs or click Generate to retry.";
    default:
      return "";
  }
}

function ShellMessage({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "error";
}) {
  return (
    <div
      className={
        "h-full grid place-items-center text-sm " +
        (tone === "error" ? "text-red-500" : "text-muted-foreground")
      }
    >
      {children}
    </div>
  );
}
