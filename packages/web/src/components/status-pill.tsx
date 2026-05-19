import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, type VideoStatus } from "@octoflash/core";

const dot: Record<VideoStatus, string> = {
  queued:     "bg-muted-foreground",
  analyzing:  "bg-warning animate-pulse",
  analyzed:   "bg-blue-500",
  generating: "bg-violet-500 animate-pulse",
  generated:  "bg-success",
  published:  "bg-violet-500",
  failed:     "bg-destructive",
};

export function StatusPill({ status, className }: { status: VideoStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("gap-1.5 pl-1.5 pr-2 font-medium", className)}>
      <span className={cn("size-1.5 rounded-full", dot[status])} />
      {STATUS_LABELS[status]}
    </Badge>
  );
}
