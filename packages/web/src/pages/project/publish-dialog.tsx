/**
 * PublishDialog — three-pane publish surface.
 *
 *   ┌────────────────────────────────────────────────────────────────────┐
 *   │ Publish video                                                  ×   │
 *   │ <project title> · <duration> · <resolution>                        │
 *   │ ┌─tabs──────────────────────────────────────────────────────┐      │
 *   │ │ [YouTube] [TikTok] [Instagram] [LinkedIn] [X]             │      │
 *   │ └───────────────────────────────────────────────────────────┘      │
 *   │ ┌─FORM (left)───────────────────────┐  ┌─PREVIEW (right)───┐       │
 *   │ │ connected-account card            │  │ PREVIEW · YOUTUBE │       │
 *   │ │ Title                             │  │ ┌──── phone ────┐ │       │
 *   │ │ Description                       │  │ │ ▶ video      │ │       │
 *   │ │ Visibility cards · Schedule cards │  │ └───────────────┘ │       │
 *   │ │ Audience chips                    │  │ caption + @handle │       │
 *   │ │ Hashtags chips                    │  │ disclaimer        │       │
 *   │ └───────────────────────────────────┘  └───────────────────┘       │
 *   │ ✓ Will post to 1 platform        [Cancel] [Save draft] [Publish]   │
 *   └────────────────────────────────────────────────────────────────────┘
 *
 * Picks the target by clicking a platform tab — the dialog auto-binds to
 * the first connected account on that platform. Submitting POSTs
 * /api/v1/targets/{id}/publish; 401/409/501 each map to specific toast copy.
 */

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Clock,
  Globe,
  Hash,
  Instagram,
  Linkedin,
  Link2,
  Loader2,
  Lock,
  Play,
  PlayCircle,
  Save,
  Send,
  Twitter,
  Youtube,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import {
  ApiError,
  targetsApi,
  type ProjectDetail,
  type Target,
  type TargetPlatform,
} from "@octoflash/core";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";


type Visibility = "public" | "unlisted" | "private";
type Schedule = "now" | "later";

type PlatformMeta = {
  id: TargetPlatform;
  label: string;
  Icon: LucideIcon;
  bg: string;
  fg: string;
  /** Surface name shown next to the connected account ("YouTube Shorts", etc). */
  surfaceName: string;
};

const PLATFORMS: PlatformMeta[] = [
  { id: "youtube",   label: "YouTube",   Icon: Youtube,   bg: "#ff0033",                                                fg: "#fff", surfaceName: "YouTube Shorts" },
  { id: "tiktok",    label: "TikTok",    Icon: Play,      bg: "#000",                                                   fg: "#fff", surfaceName: "TikTok" },
  { id: "instagram", label: "Instagram", Icon: Instagram, bg: "linear-gradient(135deg,#fa7e1e,#d62976,#962fbf)",        fg: "#fff", surfaceName: "Reels" },
  { id: "linkedin",  label: "LinkedIn",  Icon: Linkedin,  bg: "#0a66c2",                                                fg: "#fff", surfaceName: "LinkedIn" },
  { id: "x",         label: "X",         Icon: Twitter,   bg: "#000",                                                   fg: "#fff", surfaceName: "X" },
];


export function PublishDialog({
  project,
  open,
  onOpenChange,
}: {
  project: ProjectDetail;
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const [targets, setTargets] = useState<Target[]>([]);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activePlatform, setActivePlatform] = useState<TargetPlatform>("youtube");

  // Available orientations = whichever final renders exist on the project.
  const availableOrientations = useMemo<("portrait" | "landscape")[]>(() => {
    const r: ("portrait" | "landscape")[] = [];
    if (project.finalPortraitVideoUrl) r.push("portrait");
    if (project.finalLandscapeVideoUrl) r.push("landscape");
    return r;
  }, [project.finalPortraitVideoUrl, project.finalLandscapeVideoUrl]);
  const orientation = availableOrientations[0] ?? "portrait";

  // Form state.
  const [title, setTitle] = useState<string>(project.title);
  const [description, setDescription] = useState<string>("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [schedule, setSchedule] = useState<Schedule>("now");

  // Reset form whenever the dialog re-opens (so leftover state from a prior
  // open doesn't bleed in).
  useEffect(() => {
    if (!open) return;
    setTitle(project.title);
    setDescription("");
    setVisibility("public");
    setSchedule("now");
  }, [open, project.title]);

  // Load targets on open.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingTargets(true);
    (async () => {
      try {
        const page = await targetsApi.list({ limit: 100 });
        if (!cancelled) setTargets(page.items.filter(
          (t) => t.hasCredential && t.status === "active",
        ));
      } catch (e) {
        toast.error(
          e instanceof ApiError ? `HTTP ${e.status}: ${e.message}` : (e as Error).message,
        );
      } finally {
        if (!cancelled) setLoadingTargets(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  // Auto-pick the first platform that has a connected target.
  useEffect(() => {
    if (targets.length === 0) return;
    const platforms = new Set(targets.map((t) => t.platform));
    if (!platforms.has(activePlatform)) {
      const first = PLATFORMS.find((p) => platforms.has(p.id));
      if (first) setActivePlatform(first.id);
    }
  }, [targets, activePlatform]);

  // Active target = first credentialed target on the active platform.
  const activeTarget = useMemo<Target | null>(
    () => targets.find((t) => t.platform === activePlatform) ?? null,
    [targets, activePlatform],
  );

  const hashtags = useMemo(() => extractHashtags(description), [description]);

  async function onSubmit() {
    if (!activeTarget) {
      toast.error("Connect a target on /targets first.");
      return;
    }
    if (schedule === "later") {
      toast.info("Scheduling not wired yet", {
        description: "Use Publish now for now — scheduled publishing lands in a later release.",
      });
      return;
    }
    if (availableOrientations.length === 0) {
      toast.error("No final video yet — run Generate first.");
      return;
    }
    setSubmitting(true);
    try {
      const execution = await targetsApi.publish(activeTarget.id, {
        projectId: project.id,
        orientation,
        title: title.trim() || project.title,
        description: description.trim(),
        privacy: visibility,
      });
      toast.success("Publish started", {
        description: `Watch progress in the executions panel (id ${execution.id.slice(0, 14)}…).`,
      });
      onOpenChange(false);
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0;
      const detail = e instanceof ApiError ? e.message : (e as Error).message;
      if (status === 401) {
        toast.error("Reconnect needed", {
          description: `${activeTarget.platform} token can't refresh — reconnect it on /targets.`,
        });
      } else if (status === 501) {
        toast.error("Platform not wired", { description: detail });
      } else if (status === 409) {
        toast.error("Can't publish yet", { description: detail });
      } else {
        toast.error("Publish failed", { description: detail || "Unknown error" });
      }
    } finally {
      setSubmitting(false);
    }
  }

  const platform = PLATFORMS.find((p) => p.id === activePlatform)!;
  const PlatformIcon = platform.Icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-none w-[calc(100vw-3rem)] sm:max-w-5xl p-0 gap-0 overflow-hidden"
      >
        {/* ── header ─────────────────────────────────────────────────── */}
        <div className="px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[16px] font-semibold leading-tight">Publish video</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {project.title}
              {project.scenes.length > 0 && (
                <> · {project.scenes.length} {project.scenes.length === 1 ? "scene" : "scenes"}</>
              )}
              {orientation === "portrait" ? " · 720 × 1280" : " · 1280 × 720"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* ── platform tabs ──────────────────────────────────────────── */}
        <div className="px-6 pb-4">
          <div className="inline-flex rounded-md border bg-muted/30 p-0.5">
            {PLATFORMS.map((p) => {
              const Icon = p.Icon;
              const isActive = p.id === activePlatform;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePlatform(p.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                    isActive
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-3.5" />
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── body: form + preview ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-6 px-6 pb-6 max-h-[calc(100vh-18rem)] overflow-y-auto">
          {/* ── LEFT: form ──────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* connected account card */}
            <div className="rounded-md border bg-card px-3 py-2.5 flex items-center gap-3">
              <span
                className="size-9 rounded-md flex items-center justify-center shrink-0"
                style={{ background: platform.bg, color: platform.fg }}
              >
                <PlatformIcon className="size-4.5" />
              </span>
              <div className="flex-1 min-w-0">
                {activeTarget ? (
                  <>
                    <div className="text-[12.5px] font-medium leading-tight truncate">
                      {activeTarget.displayName ?? activeTarget.handle ?? activeTarget.externalId}
                      <span className="text-muted-foreground font-normal"> · connected</span>
                    </div>
                    <div className="text-[11.5px] text-muted-foreground truncate">
                      {platform.surfaceName}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-[12.5px] font-medium leading-tight">
                      No {platform.label} account
                    </div>
                    <div className="text-[11.5px] text-muted-foreground">
                      Connect one on /targets to publish here.
                    </div>
                  </>
                )}
              </div>
              <ReadinessPill ready={!!activeTarget} />
            </div>

            {/* Title */}
            <Field label="Title">
              <Input
                value={title}
                maxLength={100}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="A short, punchy title"
              />
            </Field>

            {/* Description */}
            <Field label="Description">
              <Textarea
                rows={6}
                value={description}
                maxLength={5000}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={`Describe what the video covers. Hashtags (#shorts) become tags on YouTube.`}
              />
            </Field>

            {/* Visibility + Schedule (two columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Visibility">
                <div className="grid gap-2">
                  <RadioRow
                    Icon={Globe}
                    label="Public"
                    selected={visibility === "public"}
                    onClick={() => setVisibility("public")}
                  />
                  <RadioRow
                    Icon={Link2}
                    label="Unlisted"
                    selected={visibility === "unlisted"}
                    onClick={() => setVisibility("unlisted")}
                  />
                  <RadioRow
                    Icon={Lock}
                    label="Private"
                    selected={visibility === "private"}
                    onClick={() => setVisibility("private")}
                  />
                </div>
              </Field>

              <Field label="Schedule">
                <div className="grid gap-2">
                  <RadioRow
                    Icon={Send}
                    label="Publish now"
                    selected={schedule === "now"}
                    onClick={() => setSchedule("now")}
                  />
                  <RadioRow
                    Icon={Clock}
                    label="Schedule for later"
                    selected={schedule === "later"}
                    onClick={() => setSchedule("later")}
                    disabled
                    disabledHint="Coming soon"
                  />
                </div>
              </Field>
            </div>

            {/* Audience (read-only for now) */}
            <Field label="Audience">
              <div className="flex flex-wrap gap-1.5">
                <Chip>Made for kids: No</Chip>
                <Chip>Age restricted: No</Chip>
                <Chip>Comments: On</Chip>
                <Chip>Embed: On</Chip>
              </div>
            </Field>

            {/* Hashtags & mentions (derived from description) */}
            {hashtags.length > 0 && (
              <Field label="Hashtags & mentions">
                <div className="flex flex-wrap gap-1.5">
                  {hashtags.map((tag) => (
                    <Chip key={tag} className="font-mono">
                      <Hash className="size-3 -mr-0.5" />
                      {tag.replace(/^#/, "")}
                    </Chip>
                  ))}
                </div>
              </Field>
            )}
          </div>

          {/* ── RIGHT: preview ─────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              Preview · {platform.label}
            </div>

            <div
              className={cn(
                "relative w-full max-w-[260px] mx-auto bg-[#0c1224] rounded-lg overflow-hidden flex items-center justify-center text-white/50",
                orientation === "portrait" ? "aspect-[9/16]" : "aspect-[16/9]",
              )}
            >
              <div className="absolute top-3 left-3 text-[12px] text-white/90 font-medium truncate max-w-[80%]">
                {title || project.title}
              </div>
              <PlayCircle className="size-12 stroke-[1.25]" />
            </div>

            <div className="px-1">
              <div className="text-[12.5px] font-medium leading-tight">
                {(title || project.title)}
              </div>
              <div className="text-[11.5px] text-muted-foreground mt-0.5">
                {activeTarget?.handle ? `@${activeTarget.handle.replace(/^@/, "")}` : "@you"} · just now
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed px-1">
              This is roughly how your post will appear on {platform.surfaceName}.
              Platform-side rendering may differ.
            </p>
          </div>
        </div>

        {/* ── footer ─────────────────────────────────────────────────── */}
        <div className="border-t px-6 py-3 flex items-center justify-between gap-3 bg-muted/20">
          <div className="text-[12px] text-muted-foreground flex items-center gap-1.5">
            <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            Will post to 1 platform
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled
              title="Drafts not implemented yet"
            >
              <Save className="size-3.5 mr-1.5" /> Save draft
            </Button>
            <Button
              size="sm"
              onClick={() => void onSubmit()}
              disabled={
                submitting ||
                !activeTarget ||
                availableOrientations.length === 0 ||
                schedule === "later"
              }
            >
              {submitting ? (
                <>
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" /> Submitting…
                </>
              ) : (
                <>
                  <Send className="size-3.5 mr-1.5" /> Publish now
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


// ─── small subcomponents ────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[11.5px] font-medium text-muted-foreground tracking-wide">
        {label}
      </div>
      {children}
    </div>
  );
}


function ReadinessPill({ ready }: { ready: boolean }) {
  return ready ? (
    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium tracking-wider">
      Ready
    </span>
  ) : (
    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium tracking-wider">
      Not connected
    </span>
  );
}


function RadioRow({
  Icon,
  label,
  selected,
  onClick,
  disabled,
  disabledHint,
}: {
  Icon: LucideIcon;
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  disabledHint?: string;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={disabled ? disabledHint : undefined}
      className={cn(
        "flex items-center gap-2 rounded-md border px-3 py-2 text-[12.5px] transition-colors text-left",
        selected
          ? "border-foreground bg-foreground/[0.03]"
          : "border-border hover:bg-muted/40",
        disabled && "opacity-50 cursor-not-allowed hover:bg-transparent",
      )}
    >
      <Icon className="size-3.5 text-muted-foreground shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {selected && <Check className="size-3.5 shrink-0" />}
    </button>
  );
}


function Chip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border bg-muted/40 px-2 py-0.5 text-[11.5px] text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}


function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w]+/g) ?? [];
  return Array.from(new Set(matches));
}
