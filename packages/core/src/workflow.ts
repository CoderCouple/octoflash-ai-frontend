// Workflow types and fixture. A video project is a DAG of nodes:
//
//   • start   — entry (source/transcript/prompt)
//   • scene   — one Manim render. References a Scene by id.
//   • branch  — decision point. Fans out into parallel paths.
//   • merge   — combines paths back (future).
//   • end     — terminal video output. A graph can have 2+ ends so
//               one project produces multiple variant cuts.
//
// Editing a scene only re-renders downstream nodes; sibling branches
// are untouched.

export type WorkflowNodeKind = "start" | "scene" | "branch" | "merge" | "end";

export type WorkflowNode = {
  id: string;
  kind: WorkflowNodeKind;
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  /** For scene nodes: which Scene does this node render. */
  sceneId?: string;
  /** Optional per-node overrides — lets two branches reuse the same
   *  Scene but render with different styles. */
  styleOverride?: string;
  branchLabel?: string;
};

export type WorkflowEdge = {
  from: string;
  to: string;
  kind?: "linear" | "branch";
};

export type Workflow = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  bounds: { w: number; h: number };
};

/** Default workflow: Source → S1 → S2 → S3 → Branch → (S4·editorial → End A, S4·manic → End B). */
export const DEFAULT_WORKFLOW: Workflow = {
  bounds: { w: 1620, h: 600 },
  nodes: [
    { id: "start",  kind: "start",  x: 60,   y: 256, w: 88,  h: 64,  label: "Source" },
    { id: "n-s1",   kind: "scene",  x: 200,  y: 188, w: 200, h: 200, sceneId: "s1" },
    { id: "n-s2",   kind: "scene",  x: 460,  y: 188, w: 200, h: 200, sceneId: "s2" },
    { id: "n-s3",   kind: "scene",  x: 720,  y: 188, w: 200, h: 200, sceneId: "s3" },
    { id: "branch", kind: "branch", x: 980,  y: 256, w: 140, h: 64,  label: "Style fork" },
    { id: "n-s4a",  kind: "scene",  x: 1180, y: 60,  w: 200, h: 200, sceneId: "s4", styleOverride: "editorial", branchLabel: "Editorial cut · 0:55" },
    { id: "n-s4b",  kind: "scene",  x: 1180, y: 320, w: 200, h: 200, sceneId: "s4", styleOverride: "manic",     branchLabel: "Manic cut · 0:42" },
    { id: "end-a",  kind: "end",    x: 1440, y: 128, w: 130, h: 64,  label: "final-editorial.mp4" },
    { id: "end-b",  kind: "end",    x: 1440, y: 388, w: 130, h: 64,  label: "final-manic.mp4" },
  ],
  edges: [
    { from: "start",  to: "n-s1" },
    { from: "n-s1",   to: "n-s2" },
    { from: "n-s2",   to: "n-s3" },
    { from: "n-s3",   to: "branch" },
    { from: "branch", to: "n-s4a", kind: "branch" },
    { from: "branch", to: "n-s4b", kind: "branch" },
    { from: "n-s4a",  to: "end-a" },
    { from: "n-s4b",  to: "end-b" },
  ],
};

/** Set of node ids reachable from `start` along a named path label.
 *  Used by the canvas to dim non-highlighted edges. */
export function pathSet(wf: Workflow, branchNodeIds: string[]): Set<string> {
  // BFS from "start", but at the branch node only follow `branchNodeIds`.
  const adj = new Map<string, string[]>();
  for (const e of wf.edges) {
    adj.set(e.from, [...(adj.get(e.from) ?? []), e.to]);
  }
  const out = new Set<string>(["start"]);
  const stack = ["start"];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const next of adj.get(cur) ?? []) {
      if (cur === "branch" && !branchNodeIds.includes(next)) continue;
      if (!out.has(next)) {
        out.add(next);
        stack.push(next);
      }
    }
  }
  return out;
}
