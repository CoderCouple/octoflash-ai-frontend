/**
 * Per-clip status badge for use inside React Flow nodes.
 *
 * Compact (text + dot) so it fits in the corner of a ClipNode without
 * dominating the card. Mirrors the color language of StatusPill but lighter.
 */

import type { SceneStatus } from "@octoflash/core";
import { cn } from "@/lib/utils";

const STYLES: Record<SceneStatus, { dot: string; text: string; bg: string }> = {
  draft:     { dot: "bg-muted-foreground", text: "text-muted-foreground", bg: "bg-muted/60" },
  scripting: { dot: "bg-amber-500 animate-pulse", text: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40" },
  rendering: { dot: "bg-violet-500 animate-pulse", text: "text-violet-700 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/40" },
  ready:     { dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
  failed:    { dot: "bg-destructive", text: "text-destructive", bg: "bg-destructive/10" },
};

const LABEL: Record<SceneStatus, string> = {
  draft:     "draft",
  scripting: "scripting",
  rendering: "rendering",
  ready:     "ready",
  failed:    "failed",
};

export function ClipStatusBadge({ status }: { status: SceneStatus }) {
  const s = STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded",
        s.bg,
        s.text,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {LABEL[status]}
    </span>
  );
}
