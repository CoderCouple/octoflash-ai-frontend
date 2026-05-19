
import { Check, GitBranch, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Scene } from "@octoflash/core";
import type { WorkflowNode as Node } from "@octoflash/core";
import { SceneArt } from "./scene-art";

/** A single workflow node card (start / scene / branch / end). */
export function WorkflowNode({
  node,
  scene,
  active,
  onClick,
}: {
  node: Node;
  scene: Scene | null;
  active: boolean;
  onClick?: () => void;
}) {
  const base: React.CSSProperties = {
    position: "absolute",
    left: node.x,
    top: node.y,
    width: node.w,
    height: node.h,
  };

  // Terminal nodes (start / end)
  if (node.kind === "start" || node.kind === "end") {
    return (
      <div
        style={base}
        onClick={onClick}
        className={cn(
          "rounded-[10px] cursor-pointer transition-all flex items-center justify-center text-center px-2.5",
          "bg-foreground text-background border border-foreground",
          "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.04)]",
          "hover:-translate-y-px",
          active && "ring-2 ring-foreground/15"
        )}
      >
        <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold leading-tight">
          {node.kind === "start" ? <Play className="size-3" /> : <Check className="size-3" />}
          {node.label}
        </span>
        {node.kind === "start" && <Port side="out" terminal />}
        {node.kind === "end" && <Port side="in" terminal />}
      </div>
    );
  }

  // Branch node
  if (node.kind === "branch") {
    return (
      <div
        style={base}
        className="rounded-[10px] flex items-center justify-center gap-1.5 bg-muted border border-dashed text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
      >
        <GitBranch className="size-3" />
        <span>{node.label}</span>
        <Port side="in" />
        <Port side="out" />
      </div>
    );
  }

  // Scene node
  if (!scene) return null;
  return (
    <div
      style={base}
      onClick={onClick}
      className={cn(
        "rounded-[10px] overflow-hidden bg-card border cursor-pointer transition-all",
        "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.04)]",
        "hover:-translate-y-px hover:shadow-[0_2px_6px_rgba(0,0,0,0.08),0_8px_22px_rgba(0,0,0,0.06)]",
        active && "border-foreground ring-2 ring-foreground/15"
      )}
    >
      <Port side="in" />
      {/* Header */}
      <div className="flex items-center gap-1.5 px-2.5 pt-2 pb-1.5 border-b">
        <span className="font-mono text-[10px] text-muted-foreground">
          S{String(scene.n).padStart(2, "0")}
        </span>
        <span className="font-mono text-[10px] px-1 rounded bg-muted text-muted-foreground">
          {scene.template}
        </span>
        <div className="flex-1" />
        <span
          className={cn(
            "size-1.5 rounded-full",
            scene.status === "generating" ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
          )}
        />
      </div>
      {/* Thumb */}
      <div className="aspect-video overflow-hidden">
        <SceneArt
          kind={scene.kind}
          bg={scene.bg}
          accent={scene.accent}
          variant={scene.selectedVariation}
          width={node.w}
          height={Math.round((node.w * 9) / 16)}
        />
      </div>
      {/* Footer */}
      <div className="px-2.5 pt-1.5 pb-2">
        <div className="text-[12px] font-medium leading-tight">
          {node.branchLabel ?? scene.title}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground">
          <span className="font-mono">{scene.duration.toFixed(1)}s</span>
          <span>·</span>
          <span className="font-mono text-[9px] px-1 rounded bg-primary/15 text-primary">
            {node.styleOverride ?? scene.style}
          </span>
        </div>
      </div>
      <Port side="out" />
    </div>
  );
}

function Port({ side, terminal }: { side: "in" | "out"; terminal?: boolean }) {
  return (
    <span
      className={cn(
        "absolute top-1/2 -translate-y-1/2 size-2.5 rounded-full border-2",
        terminal ? "bg-background border-foreground" : "bg-foreground border-background",
        side === "in" ? "-left-[5px]" : "-right-[5px]"
      )}
    />
  );
}
