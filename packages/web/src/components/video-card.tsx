import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/status-pill";
import { formatDuration, type Video } from "@octoflash/core";

export function VideoCard({ v }: { v: Video }) {
  const showProgress = v.status === "analyzing" || v.status === "generating";
  return (
    <Link
      to={`/workspace/${v.id}`}
      className="group rounded-lg border bg-card overflow-hidden transition-colors hover:border-foreground/20"
    >
      <div className="relative aspect-[16/10]" style={{ background: `linear-gradient(135deg, ${v.thumb}, ${v.thumb}99)` }}>
        {v.duration > 0 && (
          <div className="absolute right-2 bottom-2 rounded bg-black/75 text-white text-[10px] font-mono px-1.5 py-0.5">
            {formatDuration(v.duration)}
          </div>
        )}
        {showProgress && (
          <div className="absolute inset-x-2 bottom-2 h-[3px] rounded-full bg-white/25 overflow-hidden">
            <div
              className="h-full bg-white animate-pulse rounded-full"
              style={{ width: `${v.progress ?? 35}%` }}
            />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <StatusPill status={v.status} className="bg-background/85 backdrop-blur" />
        </div>
      </div>
      <div className="p-3">
        <div className="text-[13px] font-medium truncate mb-1">{v.title}</div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground truncate pr-2">
            {v.channel} · {v.updated}
          </span>
          <Badge variant="outline" className="text-[10px]">{v.tag}</Badge>
        </div>
      </div>
    </Link>
  );
}
