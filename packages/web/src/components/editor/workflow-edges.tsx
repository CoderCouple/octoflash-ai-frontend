
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Workflow } from "@octoflash/core";

/**
 * SVG layer that draws cubic-bezier edges between node ports.
 * Edges in `activePath` render bold and dark; others dim.
 */
export function WorkflowEdges({
  wf,
  activePath,
}: {
  wf: Workflow;
  activePath: Set<string>;
}) {
  const byId = useMemo(() => Object.fromEntries(wf.nodes.map((n) => [n.id, n])), [wf]);

  return (
    <svg
      width={wf.bounds.w}
      height={wf.bounds.h}
      viewBox={`0 0 ${wf.bounds.w} ${wf.bounds.h}`}
      className="absolute inset-0 pointer-events-none"
    >
      {wf.edges.map((e, i) => {
        const a = byId[e.from];
        const b = byId[e.to];
        if (!a || !b) return null;
        const ax = a.x + a.w;
        const ay = a.y + a.h / 2;
        const bx = b.x;
        const by = b.y + b.h / 2;
        const dx = Math.max(40, (bx - ax) / 2);
        const d = `M ${ax} ${ay} C ${ax + dx} ${ay}, ${bx - dx} ${by}, ${bx} ${by}`;
        const inPath = activePath.has(e.from) && activePath.has(e.to);
        return (
          <path
            key={i}
            d={d}
            fill="none"
            className={cn(
              "transition-colors",
              inPath
                ? "stroke-foreground [stroke-width:2]"
                : "stroke-muted-foreground/55 [stroke-width:1.5]"
            )}
            strokeDasharray={e.kind === "branch" ? "4 3" : undefined}
          />
        );
      })}
    </svg>
  );
}
