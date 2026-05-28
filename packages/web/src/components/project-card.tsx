/**
 * ProjectCard — grid tile for /projects (and /workflow when given linkTo).
 *
 * Thumbnail slot per status:
 *   • generated / published — actual final video (poster frame via
 *     `<video preload="metadata">`; muted so it never plays sound).
 *     Picks the orientation that matches `p.orientation` first; falls
 *     back to the other if only one was rendered.
 *   • queued / analyzing / analyzed / generating — monochrome placeholder
 *     with a state-appropriate icon. `generating` adds a shimmer overlay.
 *   • failed — destructive-tinted placeholder with an alert icon.
 *
 * No colour gradients — palette stays monochrome with the destructive token
 * reserved for failed.
 */

import { Link } from "react-router-dom";
import {
  AlertCircle,
  FileText,
  Loader2,
  MoreVertical,
  Play,
  RotateCw,
  Send,
  Trash,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusPill } from "@/components/status-pill";
import { cn } from "@/lib/utils";
import { useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { useJobsStore } from "@/store/jobsStore";
import { useProjectsStore } from "@/store/projectsStore";
import { formatDuration, projectsApi, type Orientation, type Project } from "@octoflash/core";

export function ProjectCard({
  p,
  linkTo,
}: {
  p: Project;
  /** Where to navigate on click. Defaults to the project overview. */
  linkTo?: (p: Project) => string;
}) {
  const deleteProject = useProjectsStore((s) => s.deleteProject);
  const startGenerate = useJobsStore((s) => s.startGenerate);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const inFlight =
    p.status === "queued" || p.status === "analyzing" || p.status === "generating";

  const onRetry = async () => {
    try {
      await startGenerate(p.id, 5);
    } catch (err) {
      console.error("[project-card] retry failed:", err);
    }
  };
  // Source hostname is a cheap, recognizable subtitle (youtube.com, medium.com, ...)
  const source = p.sourceUrl ? safeHostname(p.sourceUrl) : "manual";
  const href = linkTo ? linkTo(p) : `/projects/${p.id}`;

  // Pick which final to thumbnail. Prefer the project's stated orientation;
  // fall back to whichever side actually has a rendered file.
  const thumbOrientation: Orientation | null =
    p.orientation === "portrait" && p.finalPortraitVideoUrl
      ? "portrait"
      : p.orientation === "landscape" && p.finalLandscapeVideoUrl
        ? "landscape"
        : p.finalPortraitVideoUrl
          ? "portrait"
          : p.finalLandscapeVideoUrl
            ? "landscape"
            : null;

  const showVideo =
    (p.status === "generated" || p.status === "published") && thumbOrientation !== null;

  return (
    <div className="group relative rounded-lg border bg-card overflow-hidden transition-colors hover:border-foreground/30">
      <Link to={href} className="block">
        <div className="relative aspect-[16/10] bg-muted">
          {showVideo ? (
            <video
              // Cache-bust on every updatedAt so a re-stitch refreshes the
              // poster. The `#t=…` media-fragment tells the browser to draw
              // a frame from the middle of the video rather than the literal
              // first frame (which on our Manim renders is usually a black
              // fade-in or empty title card).
              key={p.updatedAt}
              src={`${projectsApi.previewUrl(p.id, thumbOrientation!)}&t=${encodeURIComponent(p.updatedAt)}#t=${posterOffsetSeconds(p.sourceDuration)}`}
              preload="metadata"
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-contain bg-black"
            />
          ) : (
            <StatePlaceholder status={p.status} />
          )}

          {p.sourceDuration && p.sourceDuration > 0 && (
            <div className="absolute right-2 bottom-2 rounded bg-black/75 text-white text-[10px] font-mono px-1.5 py-0.5">
              {formatDuration(Math.round(p.sourceDuration))}
            </div>
          )}
          <div className="absolute top-2 left-2">
            <StatusPill status={p.status} className="bg-background/85 backdrop-blur" />
          </div>
        </div>
        <div className="p-3">
          <div className="text-[13px] font-medium truncate mb-1 pr-7">{p.title}</div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground truncate pr-2">{source}</span>
            <Badge variant="outline" className="text-[10px] uppercase">
              {p.orientation}
            </Badge>
          </div>
        </div>
      </Link>

      {/* Kebab sits above the link, intercepts clicks so navigation doesn't fire.
          Trigger is rendered directly (no asChild around a Button) — the
          asChild+preventDefault pattern blocks Radix's open: the trigger calls
          `e.preventDefault()` and Radix's own onClick bails when
          `event.defaultPrevented` is true. Same fix the sort-menu uses. */}
      <div
        className="absolute top-2 right-2"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Project actions"
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "size-7 bg-background/85 backdrop-blur",
            )}
          >
            <MoreVertical className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onRetry} disabled={inFlight}>
              <RotateCw className="size-3.5 mr-1.5" />
              {p.status === "failed" ? "Retry" : "Re-generate"}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => setConfirmOpen(true)}
            >
              <Trash className="size-3.5 mr-1.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete "${p.title}"?`}
        description="This soft-deletes the project. It can be restored from the DB until purged."
        confirmLabel="Delete project"
        destructive
        onConfirm={() => deleteProject(p.id)}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Per-state placeholder
// ────────────────────────────────────────────────────────────────────────────

type PlaceholderMeta = {
  Icon: LucideIcon;
  label: string;
  iconClass: string;
  containerClass: string;
  spin?: boolean;
  shimmer?: boolean;
};

function placeholderFor(status: Project["status"]): PlaceholderMeta {
  switch (status) {
    case "queued":
      return { Icon: Loader2,  label: "Queued",     iconClass: "text-muted-foreground/90", containerClass: "bg-muted", spin: true };
    case "analyzing":
      return { Icon: Loader2,  label: "Analyzing",  iconClass: "text-muted-foreground/90", containerClass: "bg-muted", spin: true };
    case "analyzed":
      return { Icon: FileText, label: "Ready to generate", iconClass: "text-muted-foreground/90", containerClass: "bg-muted" };
    case "generating":
      return { Icon: Loader2,  label: "Generating", iconClass: "text-foreground/90",       containerClass: "bg-muted", spin: true, shimmer: true };
    case "generated":
    case "published":
      // Reached only when the final URL is missing despite status=generated —
      // treat as "we promised a video and there isn't one." Still useful.
      return { Icon: Play,     label: status === "published" ? "Published" : "Generated", iconClass: "text-foreground", containerClass: "bg-muted" };
    case "failed":
      return { Icon: AlertCircle, label: "Failed", iconClass: "text-destructive", containerClass: "bg-destructive/10" };
    default:
      return { Icon: Send, label: status, iconClass: "text-muted-foreground", containerClass: "bg-muted" };
  }
}

function StatePlaceholder({ status }: { status: Project["status"] }) {
  const m = placeholderFor(status);
  const Icon = m.Icon;
  return (
    <div className={cn("absolute inset-0 flex flex-col items-center justify-center gap-2", m.containerClass)}>
      {m.shimmer && (
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent animate-pulse"
        />
      )}
      <Icon className={cn("size-6", m.iconClass, m.spin && "animate-spin")} />
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {m.label}
      </span>
    </div>
  );
}

/** Where in the video should the poster frame sit?
 *
 * First frame is usually a black fade-in or empty title card. Mid-video is
 * almost always inside actual content. Cap at 30s so very long videos still
 * pull a frame early enough that `preload="metadata"` doesn't have to scan
 * a huge chunk of the file. */
function posterOffsetSeconds(durationSeconds: number | null): number {
  if (!durationSeconds || durationSeconds <= 0) return 3;
  return Math.min(30, Math.max(2, durationSeconds / 2));
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.slice(0, 40);
  }
}
