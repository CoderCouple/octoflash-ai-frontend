
import { Bell, GitBranch, Pause, Play } from "lucide-react";
import type { Scene } from "@octoflash/core";

/** VS-Code-style status bar across the bottom of the editor. */
export function StatusBar({ scene, playing }: { scene: Scene | null; playing: boolean }) {
  return (
    <div className="flex items-center h-[22px] px-1 bg-foreground text-background text-[11px] shrink-0 dark:bg-muted dark:text-foreground dark:border-t">
      <Item button>
        <GitBranch className="size-3" /> main
      </Item>
      <Item>
        <span className="size-1.5 rounded-full bg-emerald-500" /> 1 / 4 rendering
      </Item>
      <Item mono>scene {scene ? `s${scene.n}` : "—"}</Item>
      <Item mono>{scene?.template ?? ""}</Item>
      <div className="flex-1" />
      <Item mono>720 × 1280 · 30 fps</Item>
      <Item mono>h.264 · yuv420p</Item>
      <Item button>
        {playing ? <Pause className="size-3" /> : <Play className="size-3" />}
        {playing ? "playing" : "paused"}
      </Item>
      <Item mono>$0.42</Item>
      <Item button>
        <Bell className="size-3" />
      </Item>
    </div>
  );
}

function Item({
  children,
  button,
  mono,
}: {
  children: React.ReactNode;
  button?: boolean;
  mono?: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 px-2 h-full",
        button ? "cursor-pointer hover:bg-white/15 dark:hover:bg-accent" : "",
        mono ? "font-mono text-[10.5px]" : "",
      ].join(" ")}
    >
      {children}
    </span>
  );
}
