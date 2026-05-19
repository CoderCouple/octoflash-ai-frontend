
import { useMemo, useState } from "react";
import { GitBranch, Plus, RefreshCw, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Scene } from "@octoflash/core";
import { DEFAULT_WORKFLOW, pathSet, type WorkflowNode as WfNode } from "@octoflash/core";
import { WorkflowNode } from "./workflow-node";
import { WorkflowEdges } from "./workflow-edges";

type Path = "editorial" | "manic" | "all";

/**
 * Node-graph view of the project. Center pane of the editor when
 * `mode === "workflow"`.
 *
 * Selecting a scene node fires `onPickScene(sceneId)` so the existing
 * right inspector edits that scene — same surface, alternate view.
 */
export function WorkflowCanvas({
  scenes,
  activeSceneId,
  onPickScene,
}: {
  scenes: Scene[];
  activeSceneId: string;
  onPickScene: (id: string) => void;
}) {
  const wf = DEFAULT_WORKFLOW;
  const [path, setPath] = useState<Path>("all");
  const [zoom, setZoom] = useState(0.86);
  const sceneById = useMemo(() => Object.fromEntries(scenes.map((s) => [s.id, s])), [scenes]);

  const active = useMemo(() => {
    if (path === "all") return new Set(wf.nodes.map((n) => n.id));
    return pathSet(wf, path === "editorial" ? ["n-s4a"] : ["n-s4b"]);
  }, [path, wf]);

  return (
    <>
      <Toolbar path={path} onChangePath={setPath} />
      <div
        className={cn(
          "relative flex-1 min-h-0 overflow-hidden bg-muted/25",
          "[background-image:radial-gradient(circle_at_1px_1px,hsl(var(--muted-foreground)/.14)_1px,transparent_1px)]",
          "[background-size:18px_18px]"
        )}
      >
        {/* Scaled stage */}
        <div
          className="absolute inset-0 origin-top-left"
          style={{ width: wf.bounds.w, height: wf.bounds.h, transform: `scale(${zoom})` }}
        >
          <WorkflowEdges wf={wf} activePath={active} />
          {wf.nodes.map((n: WfNode) => (
            <WorkflowNode
              key={n.id}
              node={n}
              scene={n.sceneId ? sceneById[n.sceneId] : null}
              active={n.sceneId === activeSceneId}
              onClick={() => n.sceneId && onPickScene(n.sceneId)}
            />
          ))}
        </div>

        {/* Zoom HUD */}
        <div className="absolute top-3.5 right-3.5 flex flex-col gap-1 bg-background border rounded-md p-[3px]">
          <Button variant="ghost" size="icon" className="size-7" onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))}>
            <ZoomIn className="size-3" />
          </Button>
          <Button variant="ghost" size="icon" className="size-7" onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}>
            <ZoomOut className="size-3" />
          </Button>
          <span className="text-[9px] font-mono text-center text-muted-foreground py-0.5">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        {/* Legend */}
        <div className="absolute left-3.5 bottom-3.5 flex gap-3 px-3 py-2 bg-background/85 backdrop-blur-md border rounded-md text-[11px] text-muted-foreground">
          <Swatch className="bg-card border" label="Scene" />
          <Swatch className="bg-muted border border-dashed" label="Branch" />
          <Swatch className="bg-foreground" label="Start / End" />
        </div>

        {/* Minimap */}
        <div className="absolute right-3.5 bottom-3.5 w-40 h-24 bg-background/85 backdrop-blur-md border rounded-md overflow-hidden">
          <svg viewBox={`0 0 ${wf.bounds.w} ${wf.bounds.h}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
            {wf.edges.map((e, i) => {
              const a = wf.nodes.find((n) => n.id === e.from)!;
              const b = wf.nodes.find((n) => n.id === e.to)!;
              return (
                <line
                  key={i}
                  x1={a.x + a.w}
                  y1={a.y + a.h / 2}
                  x2={b.x}
                  y2={b.y + b.h / 2}
                  stroke="hsl(var(--muted-foreground) / .6)"
                  strokeWidth={4}
                />
              );
            })}
            {wf.nodes.map((n) => (
              <rect
                key={n.id}
                x={n.x}
                y={n.y}
                width={n.w}
                height={n.h}
                rx={6}
                fill={
                  n.kind === "start" || n.kind === "end"
                    ? "hsl(var(--foreground))"
                    : "hsl(var(--muted-foreground) / .4)"
                }
              />
            ))}
          </svg>
        </div>
      </div>
    </>
  );
}

function Swatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("inline-block size-2.5 rounded-sm", className)} />
      {label}
    </span>
  );
}

function Toolbar({ path, onChangePath }: { path: Path; onChangePath: (p: Path) => void }) {
  return (
    <div className="flex items-center gap-2 h-9 px-3.5 border-b bg-background shrink-0">
      <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
        Workflow
      </span>
      <span className="font-mono text-[10px] text-muted-foreground">
        1 source · 4 scenes · 1 branch · 2 outputs
      </span>
      <Separator orientation="vertical" className="h-4" />
      <span className="text-[11px] text-muted-foreground">Highlight path:</span>
      <Segmented value={path} onChange={onChangePath} />
      <div className="flex-1" />
      <Button variant="ghost" size="sm" className="h-7"><GitBranch className="size-3 mr-1.5" />Add branch</Button>
      <Button variant="ghost" size="sm" className="h-7"><Plus className="size-3 mr-1.5" />Add node</Button>
      <Separator orientation="vertical" className="h-4" />
      <Button variant="outline" size="sm" className="h-7"><RefreshCw className="size-3 mr-1.5" />Re-run path</Button>
    </div>
  );
}

function Segmented({ value, onChange }: { value: Path; onChange: (p: Path) => void }) {
  const items: { v: Path; l: string }[] = [
    { v: "editorial", l: "Editorial cut" },
    { v: "manic", l: "Manic cut" },
    { v: "all", l: "All" },
  ];
  return (
    <div className="inline-flex gap-px p-0.5 bg-muted rounded-md">
      {items.map((it) => (
        <button
          key={it.v}
          type="button"
          onClick={() => onChange(it.v)}
          className={cn(
            "px-2.5 py-[3px] rounded text-[11.5px] font-medium",
            value === it.v
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {it.l}
        </button>
      ))}
    </div>
  );
}
