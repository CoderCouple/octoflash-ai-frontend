import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { ProjectStatus } from "@octoflash/core";

const dot: Record<ProjectStatus, string> = {
  queued:     "bg-muted-foreground animate-pulse",
  analyzing:  "bg-warning animate-pulse",
  analyzed:   "bg-blue-500",
  generating: "bg-violet-500 animate-pulse",
  generated:  "bg-success",
  published:  "bg-violet-500",
  failed:     "bg-destructive",
};

const label: Record<ProjectStatus, string> = {
  queued:     "Queued",
  analyzing:  "Analyzing",
  analyzed:   "Analyzed",
  generating: "Generating",
  generated:  "Generated",
  published:  "Published",
  failed:     "Failed",
};

export function StatusPill({ status, className }: { status: ProjectStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("gap-1.5 pl-1.5 pr-2 font-medium", className)}>
      <span className={cn("size-1.5 rounded-full", dot[status])} />
      {label[status]}
    </Badge>
  );
}
