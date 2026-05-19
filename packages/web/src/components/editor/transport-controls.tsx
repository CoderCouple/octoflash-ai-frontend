
import { ChevronLeft, ChevronRight, Pause, Play, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Scope } from "./editor-topbar";
import type { Scene } from "@octoflash/core";
import { formatTime } from "@octoflash/core";

export function TransportControls({
  scene,
  scope,
  playing,
  onTogglePlay,
  playhead,
  total,
}: {
  scene: Scene;
  scope: Scope;
  playing: boolean;
  onTogglePlay: () => void;
  playhead: number;
  total: number;
}) {
  const max = scope === "scene" ? scene.duration : total;
  const pct = Math.min(100, (playhead / max) * 100);

  return (
    <div className="flex items-center gap-2.5 h-9 px-3.5 border-t bg-background shrink-0">
      <Button variant="ghost" size="icon" className="size-7">
        <ChevronLeft className="size-3" />
      </Button>
      <Button
        size="icon"
        variant={playing ? "outline" : "default"}
        className="size-7"
        onClick={onTogglePlay}
      >
        {playing ? <Pause className="size-3" /> : <Play className="size-3" />}
      </Button>
      <Button variant="ghost" size="icon" className="size-7">
        <ChevronRight className="size-3" />
      </Button>
      <span className="font-mono text-[11px]">
        {formatTime(playhead)}
        <span className="text-muted-foreground"> / {formatTime(max)}</span>
      </span>
      <div className="flex-1">
        <Progress value={pct} className="h-[3px]" />
      </div>
      <span className="font-mono text-[10px] text-muted-foreground">
        {scope === "scene" ? `s${scene.n}` : "all"}
      </span>
      <Button variant="ghost" size="icon" className="size-7">
        <Volume2 className="size-3" />
      </Button>
    </div>
  );
}
