/**
 * SourceSidebar — right-drawer for source_url / source_text nodes.
 *
 * For source_url: embed the YouTube video (if it's a youtube URL/shorts
 * link) so the user can watch the source content alongside the canvas.
 * Falls back to a plain link for non-YouTube URLs.
 *
 * For source_text: show the text content read-only.
 */

import { ExternalLink, Globe } from "lucide-react";

import type { ProjectDetail } from "@octoflash/core";

export function SourceSidebar({
  project,
  variant,
}: {
  project: ProjectDetail;
  variant: "url" | "text";
}) {
  if (variant === "text") {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-3 border-b">
          <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            <Globe className="size-3" /> Source: Text
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <pre className="text-[12px] leading-relaxed whitespace-pre-wrap font-mono rounded-md border bg-muted/30 px-3 py-2">
            {project.transcript || "(no text supplied)"}
          </pre>
        </div>
      </div>
    );
  }

  const embedSrc = toYouTubeEmbedSrc(project.sourceUrl);
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b">
        <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          <Globe className="size-3" /> Source: URL
        </div>
        {project.sourceUrl && (
          <a
            href={project.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-[11px] text-foreground hover:underline truncate max-w-full"
            title={project.sourceUrl}
          >
            {project.sourceUrl}
            <ExternalLink className="size-3 shrink-0" />
          </a>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!project.sourceUrl ? (
          <div className="text-[11px] text-muted-foreground italic">
            (no source URL set on this project)
          </div>
        ) : embedSrc ? (
          // Portrait container for shorts; iframe stretches inside.
          <div className="w-full overflow-hidden rounded-md border bg-black aspect-[9/16]">
            <iframe
              src={embedSrc}
              title="Source video"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground">
            Source preview only embeds YouTube URLs for now. Open the link above to view this source.
          </div>
        )}

        {project.sourceDuration && (
          <div className="text-[11px] text-muted-foreground font-mono">
            source duration: {project.sourceDuration.toFixed(1)}s
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Convert a YouTube URL to its embed equivalent.
 *   https://www.youtube.com/shorts/<id>     → https://www.youtube.com/embed/<id>
 *   https://www.youtube.com/watch?v=<id>    → https://www.youtube.com/embed/<id>
 *   https://youtu.be/<id>                   → https://www.youtube.com/embed/<id>
 * Returns null for non-YouTube URLs.
 */
function toYouTubeEmbedSrc(url: string | null): string | null {
  if (!url) return null;
  let videoId: string | null = null;
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") {
      videoId = u.pathname.replace(/^\/+/, "").split("/")[0] || null;
    } else if (u.hostname.endsWith("youtube.com")) {
      if (u.pathname.startsWith("/shorts/")) {
        videoId = u.pathname.replace("/shorts/", "").split("/")[0] || null;
      } else if (u.pathname === "/watch") {
        videoId = u.searchParams.get("v");
      } else if (u.pathname.startsWith("/embed/")) {
        videoId = u.pathname.replace("/embed/", "").split("/")[0] || null;
      }
    }
  } catch {
    return null;
  }
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}`;
}
