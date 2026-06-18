/**
 * DeletableEdge — smooth-step edge with a small ✕ button at the midpoint.
 *
 * Ported from context0's edge component. Click the X to remove the edge from
 * the canvas (local state only until the workflowsApi save lands).
 */

import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  getSmoothStepPath,
  useReactFlow,
} from "@xyflow/react";

import { Button } from "@/components/ui/button";

export function DeletableEdge(props: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath(props);
  const { setEdges } = useReactFlow();

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={props.markerEnd}
        style={props.style}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
        >
          <Button
            variant="outline"
            size="icon"
            className="size-5 rounded-full border bg-background text-[10px] leading-none hover:shadow-md"
            onClick={() => setEdges((eds) => eds.filter((e) => e.id !== props.id))}
            aria-label="Delete edge"
            title="Delete edge"
          >
            ×
          </Button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
