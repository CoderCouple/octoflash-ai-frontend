
import { ChevronDown, File as FileIcon, Film, Lock, MoreHorizontal, Plus, Search, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Scene } from "@octoflash/core";
import { formatShort, formatTime } from "@octoflash/core";
import { SceneArt } from "./scene-art";

type Props = {
  scenes: Scene[];
  activeId: string;
  locked: Record<string, boolean>;
  onPick: (id: string) => void;
};

export function ScenesPanel({ scenes, activeId, locked, onPick }: Props) {
  const total = scenes.reduce((a, s) => a + s.duration, 0);

  return (
    <div className="flex flex-col h-full w-64 shrink-0 bg-background">
      {/* Panel header */}
      <div className="flex items-center h-[30px] px-3 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
        <span>Scenes</span>
        <div className="ml-auto flex gap-0.5">
          <Button variant="ghost" size="icon" className="size-6">
            <Search className="size-3" />
          </Button>
          <Button variant="ghost" size="icon" className="size-6">
            <Plus className="size-3" />
          </Button>
          <Button variant="ghost" size="icon" className="size-6">
            <MoreHorizontal className="size-3" />
          </Button>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-auto pb-2">
        <TreeGroup label="black-holes.octoflash" meta={`${scenes.length} · ${formatShort(total)}`}>
          {scenes.map((s) => (
            <SceneRow
              key={s.id}
              scene={s}
              active={s.id === activeId}
              locked={!!locked[s.id]}
              onClick={() => onPick(s.id)}
            />
          ))}
        </TreeGroup>

        <TreeGroup label="Renders">
          <TreeRow icon={<Film className="size-3" />} title="final.mp4" />
          <TreeRow icon={<Film className="size-3" />} title="preview-stitch.mp4" />
        </TreeGroup>

        <TreeGroup label="Project assets">
          <TreeRow icon={<Volume2 className="size-3" />} title="voiceover.mp3" />
          <TreeRow icon={<Volume2 className="size-3" />} title="music-bed.mp3" />
          <TreeRow icon={<FileIcon className="size-3" />} title="transcript.txt" />
        </TreeGroup>
      </div>

      {/* Footer */}
      <div className="h-7 px-3 flex items-center justify-between text-[11px] text-muted-foreground border-t shrink-0">
        <span>{scenes.length} scenes</span>
        <span className="font-mono">{formatTime(total)}</span>
      </div>
    </div>
  );
}

function TreeGroup({
  label,
  meta,
  children,
}: {
  label: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-2 first:mt-1">
      <div className="flex items-center gap-1 px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
        <ChevronDown className="size-2.5" />
        <span>{label}</span>
        {meta && <span className="ml-auto font-mono opacity-70 normal-case tracking-normal">{meta}</span>}
      </div>
      {children}
    </div>
  );
}

function TreeRow({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="relative flex items-center gap-1.5 px-2 py-[3px] text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground cursor-pointer">
      <span className="w-3.5 text-right font-mono text-[10px]" />
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="flex-1 truncate">{title}</span>
    </div>
  );
}

function SceneRow({
  scene,
  active,
  locked,
  onClick,
}: {
  scene: Scene;
  active: boolean;
  locked: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-1.5 px-2 py-[3px] text-xs cursor-pointer whitespace-nowrap",
        active
          ? "bg-primary/10 text-foreground"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      )}
    >
      {active && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />}
      <span className="w-3.5 text-right font-mono text-[10px] text-muted-foreground shrink-0">
        {String(scene.n).padStart(2, "0")}
      </span>
      <span className="size-[22px] rounded-sm overflow-hidden shrink-0">
        <SceneArt
          kind={scene.kind}
          bg={scene.bg}
          accent={scene.accent}
          variant={scene.selectedVariation}
          width={22}
          height={22}
        />
      </span>
      <span className={cn("flex-1 truncate", active && "font-medium")}>{scene.title}</span>
      <span className="font-mono text-[10px] text-muted-foreground">
        {scene.duration.toFixed(1)}s
      </span>
      <span className="w-3.5 flex justify-center shrink-0">
        {scene.status === "generating" ? (
          <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
        ) : locked ? (
          <Lock className="size-2.5 text-muted-foreground" />
        ) : (
          <span className="size-1.5 rounded-full bg-emerald-500" />
        )}
      </span>
    </div>
  );
}
