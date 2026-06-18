/**
 * ClipSidebar — right-drawer for the selected clip in the workflow editor.
 *
 * Composition (top → bottom):
 *   - Header        — clip # + title (editable inline)
 *   - Video         — <video src={scenesApi.previewUrl(scene.id)}> with cache-bust on updatedAt
 *   - Prompt        — large textarea, debounced PATCH on every keystroke
 *   - Duration      — numeric input, debounced PATCH
 *   - Eval          — score chip + collapsible feedback
 *   - Script        — collapsible read-only Manim Python (slice 14)
 *   - Regenerate    — kicks off RegenerateClipWorkflow; sidebar shows progress
 *
 * On regen:
 *   - "Regenerate clip" → jobsStore.startRegenerate(scene.id) → Job tracked
 *   - Parent page's useProjectPolling refetches the project as scene.status
 *     transitions scripting → rendering → ready
 *   - When status flips back to ready: cache-bust video src and final video
 */

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Wand2, ChevronDown, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { useJobsStore } from "@/store/jobsStore";
import { useProjectsStore } from "@/store/projectsStore";
import { scenesApi, type SceneResponse } from "@octoflash/core";
import { ClipStatusBadge } from "@/components/workflow/status-badge";

const SAVE_DEBOUNCE_MS = 500;

export function ClipSidebar({ scene }: { scene: SceneResponse }) {
  const patchScene = useProjectsStore((s) => s.patchScene);
  const startRegenerate = useJobsStore((s) => s.startRegenerate);
  // Execution rows don't carry a scene_id (that's a workflow-input detail);
  // we identify the "active regen for this clip" by kind + status. There's
  // typically only one regen in flight per scene at a time.
  const activeJob = useJobsStore((s) =>
    Object.values(s.jobs).find(
      (e) =>
        e.kind === "regenerate_clip" &&
        (e.status === "PENDING" || e.status === "RUNNING"),
    ),
  );

  // Local drafts so we can show the typed-but-not-yet-saved value.
  const [title, setTitle] = useState(scene.title ?? "");
  const [prompt, setPrompt] = useState(scene.prompt ?? "");
  const [duration, setDuration] = useState(
    scene.duration != null ? String(scene.duration) : "",
  );
  const [promptOpen, setPromptOpen] = useState(false);
  const [scoreOpen, setScoreOpen] = useState(false);
  const [scriptOpen, setScriptOpen] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Reset local drafts whenever the selected scene changes (or its data
  // updates from a poll/refetch).
  useEffect(() => {
    setTitle(scene.title ?? "");
    setPrompt(scene.prompt ?? "");
    setDuration(scene.duration != null ? String(scene.duration) : "");
    setPromptOpen(false);
    setScoreOpen(false);
    setScriptOpen(false);
    setRegenError(null);
  }, [scene.id, scene.title, scene.prompt, scene.duration]);

  const persist = useDebouncedCallback(
    async (patch: { title?: string; prompt?: string; duration?: number }) => {
      try {
        await patchScene(scene.id, patch);
        setSavedAt(Date.now());
      } catch (e) {
        console.error("[ClipSidebar] patch failed:", e);
      }
    },
    SAVE_DEBOUNCE_MS,
  );

  async function onRegenerate() {
    setRegenError(null);
    try {
      await startRegenerate(scene.id);
      // Project polling on parent page will pick up the status transitions.
    } catch (e) {
      setRegenError((e as Error).message);
    }
  }

  const regenInFlight = !!activeJob || scene.status === "scripting" || scene.status === "rendering";
  // Cache-bust the per-clip <video> src whenever the scene updates.
  const previewSrc = `${scenesApi.previewUrl(scene.id)}?t=${encodeURIComponent(scene.updatedAt)}`;

  return (
    <div className="h-full flex flex-col">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-mono text-muted-foreground">
            #{scene.n}
          </span>
          <ClipStatusBadge status={scene.status} />
          {savedAt && Date.now() - savedAt < 2000 && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 ml-auto">
              ✓ saved
            </span>
          )}
        </div>
        <Input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            persist({ title: e.target.value });
          }}
          placeholder="Clip title"
          className="h-8 text-[13px] font-medium"
        />
      </div>

      {/* ── Scrollable body ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Video player — shows the clip's MP4 or status placeholder. */}
        {scene.videoUrl ? (
          <video
            key={scene.updatedAt}
            src={previewSrc}
            controls
            preload="metadata"
            className="w-full rounded-md border bg-black aspect-[9/16]"
          />
        ) : (
          <div className="w-full rounded-md border bg-muted/30 aspect-[9/16] grid place-items-center text-xs text-muted-foreground">
            {regenInFlight ? (
              <div className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Rendering…
              </div>
            ) : (
              <span>Not rendered yet</span>
            )}
          </div>
        )}

        {/* Prompt (collapsible — same pattern as Generated script) */}
        <div className="rounded-md border bg-card">
          <button
            type="button"
            onClick={() => setPromptOpen((v) => !v)}
            className="flex items-center gap-1.5 w-full px-3 py-2 hover:bg-muted/40 transition-colors"
          >
            {promptOpen ? (
              <ChevronDown className="size-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-3.5 text-muted-foreground" />
            )}
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Prompt
            </span>
            <span className="text-[10px] text-muted-foreground ml-auto font-mono">
              {prompt.length.toLocaleString()} chars
            </span>
          </button>
          {promptOpen && (
            <div className="px-3 pb-3 pt-0">
              <Textarea
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  persist({ prompt: e.target.value });
                }}
                placeholder="What this clip shows + voiceover…"
                rows={8}
                className="text-[12px] font-mono"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Changes auto-save. Click <strong>Regenerate</strong> below to re-render this clip with the new prompt.
              </p>
            </div>
          )}
        </div>

        {/* Eval score (collapsible — same pattern as Generated script) */}
        {scene.evalScore != null && (
          <div className="rounded-md border bg-card">
            <button
              type="button"
              onClick={() => setScoreOpen((v) => !v)}
              className="flex items-center gap-1.5 w-full px-3 py-2 hover:bg-muted/40 transition-colors"
            >
              {scoreOpen ? (
                <ChevronDown className="size-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="size-3.5 text-muted-foreground" />
              )}
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Eval score
              </span>
              <span
                className={cn(
                  "text-[13px] font-mono font-semibold ml-auto",
                  scene.evalScore >= 7 ? "text-emerald-600 dark:text-emerald-400" :
                  scene.evalScore >= 5 ? "text-amber-600 dark:text-amber-400" :
                                         "text-destructive",
                )}
              >
                {scene.evalScore}/10
              </span>
            </button>
            {scoreOpen && scene.evalFeedback && (
              <p className="px-3 pb-3 pt-0 text-[11px] text-muted-foreground whitespace-pre-wrap">
                {scene.evalFeedback}
              </p>
            )}
          </div>
        )}

        {/* Generated script (collapsible) */}
        {scene.scriptCode && (
          <div className="rounded-md border bg-card">
            <button
              type="button"
              onClick={() => setScriptOpen((v) => !v)}
              className="flex items-center gap-1.5 w-full px-3 py-2 hover:bg-muted/40 transition-colors"
            >
              {scriptOpen ? (
                <ChevronDown className="size-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="size-3.5 text-muted-foreground" />
              )}
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Generated script
              </span>
              <span className="text-[10px] text-muted-foreground ml-auto font-mono">
                {scene.scriptCode.length.toLocaleString()} chars
              </span>
            </button>
            {scriptOpen && (
              <pre className="px-3 pb-3 pt-0 text-[10px] font-mono leading-relaxed overflow-x-auto max-h-[300px] overflow-y-auto">
                {scene.scriptCode}
              </pre>
            )}
          </div>
        )}

        {/* Duration + render method — last row before the footer */}
        <div className="flex items-end gap-4 pt-2 mt-auto">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Duration
            </label>
            <Input
              type="number"
              step="0.5"
              min="1"
              max="60"
              value={duration}
              onChange={(e) => {
                setDuration(e.target.value);
                const n = parseFloat(e.target.value);
                if (!Number.isNaN(n)) persist({ duration: n });
              }}
              className="mt-1 h-8 text-[12px] w-24"
            />
          </div>
          {scene.renderMethod && (
            <div className="text-[11px] text-muted-foreground pb-2">
              Render: <span className="font-mono">{scene.renderMethod}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer action ───────────────────────────────────────────── */}
      <div className="border-t p-3 space-y-2">
        {regenError && (
          <div className="text-[11px] text-destructive px-1">
            {regenError}
          </div>
        )}
        {activeJob && activeJob.phases.length > 0 && (
          <div className="text-[10px] text-muted-foreground font-mono px-1 line-clamp-1">
            {activeJob.phases[activeJob.phases.length - 1].name ?? "running"}
            {" "}
            <span className="opacity-60">· {activeJob.progress}%</span>
          </div>
        )}
        <Button
          size="sm"
          className="w-full h-8"
          onClick={onRegenerate}
          disabled={regenInFlight}
        >
          {regenInFlight ? (
            <>
              <Loader2 className="size-3.5 mr-1.5 animate-spin" />
              Regenerating clip…
            </>
          ) : (
            <>
              <RefreshCw className="size-3.5 mr-1.5" />
              Regenerate clip
            </>
          )}
        </Button>
        <p className="text-[10px] text-muted-foreground text-center px-2">
          <Wand2 className="size-3 inline mr-1" />
          Re-runs script-gen + render for this clip only, then re-stitches the project.
        </p>
      </div>
    </div>
  );
}
