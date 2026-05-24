/**
 * FlowEditor — the editable React Flow canvas. Replaces the read-only
 * workflow-canvas. Ported from context0's `flow-editor.tsx`, adapted to
 * our 4-node-type domain (source_url / source_text / scene / target).
 *
 * State management:
 *   • `useNodesState` / `useEdgesState` for in-memory React Flow state.
 *   • On mount: load `workflow.definition` via `workflowsApi.getForProject`.
 *     If the definition is null and the project has scenes, seed a default
 *     linear DAG (source_url → scene*N → target) so the canvas isn't blank
 *     after a generate. Otherwise start empty.
 *   • On change (debounced 800ms): PUT the new definition back. Edits live
 *     immediately in local state so the UI feels snappy.
 *
 * Interactions:
 *   • Drag a palette card onto the canvas → onDrop creates a new node at
 *     the cursor position (uses `screenToFlowPosition`).
 *   • Connect handles → onConnect adds an animated edge.
 *   • Click the ✕ on an edge (DeletableEdge) → removes it.
 *   • Click the trash on a node header → removes node + incident edges.
 *
 * Connection validation:
 *   • No self-loops.
 *   • No cycles (DFS via `getOutgoers`).
 *   • Handle types must match (source.outputs[name].type === target.inputs[name].type)
 *     — TaskRegistry is the source of truth.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Redo2, Undo2 } from "lucide-react";
import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  getOutgoers,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeTypes,
  type NodeTypes,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import {
  executionsApi,
  type ProjectDetail,
  workflowsApi,
} from "@octoflash/core";

import { Button } from "@/components/ui/button";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { useUndoHistory } from "@/hooks/use-undo-history";

import { DeletableEdge } from "./deletable-edge";
import { NodeComponent } from "./nodes/node-component";
import {
  WorkflowRunnerProvider,
  type RunStatus,
} from "./workflow-runner-context";
import { createFlowNode } from "@/workflow-engine/create-flow-node";
import { TaskRegistry } from "@/workflow-engine/task-registry";
import {
  TaskType,
  type AppNode,
  type AppNodeData,
  type FlowDefinition,
} from "@/workflow-engine/types";

const NODE_TYPES: NodeTypes = { OctoflashNode: NodeComponent };
const EDGE_TYPES: EdgeTypes = { default: DeletableEdge };
const SNAP_GRID: [number, number] = [16, 16];
const FIT_VIEW_OPTS = { padding: 0.2 };

const SAVE_DEBOUNCE_MS = 800;

export type SelectedNode =
  | {
      id: string;
      type: TaskType;
      /**
       * The clicked node's `data` blob, passed through so the parent can
       * resolve cross-table references (e.g. `data.scene_id` for clip
       * nodes, `data.target_id` for target nodes) without re-querying
       * React Flow.
       */
      data: AppNodeData;
    }
  | null;

export function FlowEditor({
  project,
  onSelectNode,
  selectedNode,
}: {
  project: ProjectDetail;
  onSelectNode: (selected: SelectedNode) => void;
  selectedNode: SelectedNode;
}) {
  return (
    <ReactFlowProvider>
      <FlowEditorInner
        project={project}
        onSelectNode={onSelectNode}
        selectedNode={selectedNode}
      />
    </ReactFlowProvider>
  );
}

function FlowEditorInner({
  project,
  onSelectNode,
  selectedNode,
}: {
  project: ProjectDetail;
  onSelectNode: (selected: SelectedNode) => void;
  selectedNode: SelectedNode;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { screenToFlowPosition, setViewport } = useReactFlow();

  // Workflow id resolved on mount; needed for save (PUT /workflows/:id).
  const workflowIdRef = useRef<string | null>(null);
  // Suppress the auto-save during the initial load so we don't immediately
  // overwrite a freshly-fetched definition with the same payload.
  const loadingRef = useRef(true);

  // ── load — runs ONCE per project.id ────────────────────────────────
  //
  // Critical: this effect must NOT re-run on every project refetch. The
  // parent page polls /projects/:id while a workflow is in flight, which
  // hands us a new `project` reference (and a new `project.scenes` array)
  // on every tick. If `project.scenes` were in the deps, every poll would:
  //   1. blast local canvas state with whatever the backend last saved
  //   2. delete a node the user just dropped if the debounced save hadn't
  //      flushed yet
  // → "nodes / edges disappear after I drop them"
  //
  // Once we've fetched the initial definition the canvas is owned by local
  // state + the debounced save below. Server-side seeding (the analyze
  // workflow populating workflow.definition) is only picked up if the user
  // navigates away and back, which is acceptable for the seed-once flow.
  const loadedForRef = useRef<string | null>(null);
  useEffect(() => {
    if (loadedForRef.current === project.id) return;
    loadedForRef.current = project.id;
    let cancelled = false;
    (async () => {
      loadingRef.current = true;
      try {
        const wf = await workflowsApi.getForProject(project.id);
        if (cancelled) return;
        workflowIdRef.current = wf.id;
        const defn = (wf.definition ?? null) as FlowDefinition | null;
        if (defn && Array.isArray(defn.nodes) && defn.nodes.length > 0) {
          setNodes(defn.nodes as AppNode[]);
          setEdges((defn.edges ?? []) as Edge[]);
          if (defn.viewport) {
            const { x = 0, y = 0, zoom = 1 } = defn.viewport;
            setViewport({ x, y, zoom });
          }
        } else {
          // Empty workflow — analyze hasn't seeded the DAG yet, or it's a
          // bare project. Leave the canvas empty; the user can drag nodes
          // in, or navigate away + back to pick up backend-seeded content.
          setNodes([]);
          setEdges([]);
        }
      } catch (e) {
        console.error("[FlowEditor] load failed:", e);
      } finally {
        // Defer un-suppressing one tick so the setNodes/setEdges-triggered
        // change-events finish flushing first.
        setTimeout(() => {
          loadingRef.current = false;
        }, 0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [project.id, setNodes, setEdges, setViewport]);

  // ── undo / redo ─────────────────────────────────────────────────────
  //
  // Captures a snapshot of {nodes, edges} after 300ms of quiet (debounced
  // so a drag = one undo, not 200). Restoring a snapshot setNodes+setEdges
  // back; the save effect downstream PUTs the restored definition so the
  // server stays in sync. Suppressed during initial load via `enabled`.
  const restoreSnapshot = useCallback(
    (snap: { nodes: AppNode[]; edges: Edge[] }) => {
      setNodes(snap.nodes);
      setEdges(snap.edges);
    },
    [setNodes, setEdges],
  );
  const history = useUndoHistory<{ nodes: AppNode[]; edges: Edge[] }>({
    value: useMemo(
      () => ({ nodes: nodes as AppNode[], edges: edges as Edge[] }),
      [nodes, edges],
    ),
    restore: restoreSnapshot,
    enabled: !loadingRef.current,
  });

  // Keyboard shortcuts: ⌘Z undo, ⇧⌘Z redo (also Ctrl on non-Mac). Skip
  // when the user is typing in an input/textarea — those have their own
  // native undo stack.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inField =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (inField) return;
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key.toLowerCase() !== "z") return;
      e.preventDefault();
      if (e.shiftKey) history.redo();
      else history.undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [history]);

  // ── save (debounced) ────────────────────────────────────────────────
  const persist = useDebouncedCallback(
    async (definition: FlowDefinition) => {
      if (!workflowIdRef.current) return;
      try {
        await workflowsApi.put(workflowIdRef.current, {
          definition: definition as unknown as Record<string, unknown>,
        });
      } catch (e) {
        console.error("[FlowEditor] save failed:", e);
      }
    },
    SAVE_DEBOUNCE_MS,
  );

  // Trigger save whenever nodes or edges change (after initial load).
  useEffect(() => {
    if (loadingRef.current) return;
    persist({ nodes: nodes as AppNode[], edges: edges as FlowDefinition["edges"] });
  }, [nodes, edges, persist]);

  // ── drop a palette card onto the canvas ─────────────────────────────
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const taskType = event.dataTransfer.getData("application/reactflow");
      if (!taskType || !(taskType in TaskRegistry)) return;
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const newNode = createFlowNode(taskType as TaskType, position);
      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes],
  );

  // ── connect: addEdge + cycle/type validation ────────────────────────
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          { ...connection, animated: true, type: "default" } as Edge,
          eds,
        ),
      );
    },
    [setEdges],
  );

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  nodesRef.current = nodes;
  edgesRef.current = edges;

  const isValidConnection = useCallback((connection: Edge | Connection) => {
    if (connection.source === connection.target) return false;

    const source = nodesRef.current.find((n) => n.id === connection.source) as
      | AppNode
      | undefined;
    const target = nodesRef.current.find((n) => n.id === connection.target) as
      | AppNode
      | undefined;
    if (!source || !target) return false;

    const sourceTask = TaskRegistry[(source.data as AppNodeData).type];
    const targetTask = TaskRegistry[(target.data as AppNodeData).type];
    const sourceOutput = sourceTask.outputs.find(
      (o) => o.name === connection.sourceHandle,
    );
    const targetInput = targetTask.inputs.find(
      (i) => i.name === connection.targetHandle,
    );
    if (!sourceOutput || !targetInput) return false;
    if (sourceOutput.type !== targetInput.type) return false;

    // Cycle check (DFS).
    const hasCycle = (node: AppNode, visited = new Set<string>()): boolean => {
      if (visited.has(node.id)) return false;
      visited.add(node.id);
      for (const outgoer of getOutgoers(
        node,
        nodesRef.current,
        edgesRef.current,
      )) {
        if (outgoer.id === connection.source) return true;
        if (hasCycle(outgoer as AppNode, visited)) return true;
      }
      return false;
    };
    return !hasCycle(target);
  }, []);

  // ── click any node → bubble {id, type} up so parent can dispatch which
  //    right sidebar to render (clip / source / target). ───────────────
  const onNodeClick = useCallback(
    (_: unknown, node: { id: string; data: AppNodeData }) => {
      if (!node.data?.type) {
        onSelectNode(null);
        return;
      }
      onSelectNode({ id: node.id, type: node.data.type, data: node.data });
    },
    [onSelectNode],
  );

  // Selection ring follows whatever node the parent says is active.
  const nodesWithSelection = useMemo(
    () =>
      (nodes as AppNode[]).map((n) => ({
        ...n,
        selected: selectedNode?.id === n.id,
      })),
    [nodes, selectedNode],
  );

  // ── per-node run state + runNode callback ──────────────────────────
  const [runByNode, setRunByNode] = useState<Record<string, RunStatus>>({});
  const pollersRef = useRef<Record<string, number>>({});

  const pollExecution = useCallback((nodeId: string, executionId: string) => {
    // Idempotent: avoid stacking timers for the same node.
    if (pollersRef.current[nodeId]) {
      window.clearInterval(pollersRef.current[nodeId]);
    }
    const handle = window.setInterval(async () => {
      try {
        const ex = await executionsApi.get(executionId);
        if (ex.status === "RUNNING" || ex.status === "PENDING") return;
        // Terminal states.
        const final: RunStatus =
          ex.status === "COMPLETED"
            ? { state: "completed", executionId }
            : {
                state: "failed",
                executionId,
                message: ex.temporalLastFailure
                  ? String(
                      (ex.temporalLastFailure as Record<string, unknown>)
                        .message ?? ex.status,
                    )
                  : ex.status,
              };
        setRunByNode((m) => ({ ...m, [nodeId]: final }));
        window.clearInterval(handle);
        delete pollersRef.current[nodeId];
      } catch (e) {
        console.warn("[FlowEditor] poll", nodeId, e);
      }
    }, 2000);
    pollersRef.current[nodeId] = handle;
  }, []);

  const runNode = useCallback(
    async (nodeId: string) => {
      if (!workflowIdRef.current) {
        throw new Error("Workflow id not yet resolved");
      }
      setRunByNode((m) => ({ ...m, [nodeId]: { state: "running", executionId: "" } }));
      const execution = await workflowsApi.runNode(
        workflowIdRef.current,
        nodeId,
      );
      setRunByNode((m) => ({
        ...m,
        [nodeId]: { state: "running", executionId: execution.id },
      }));
      pollExecution(nodeId, execution.id);
      return execution;
    },
    [pollExecution],
  );

  // Tear down outstanding poll timers on unmount.
  useEffect(() => {
    return () => {
      for (const id of Object.values(pollersRef.current)) {
        window.clearInterval(id);
      }
      pollersRef.current = {};
    };
  }, []);

  return (
    <WorkflowRunnerProvider
      value={{ workflowId: workflowIdRef.current, runNode, runByNode }}
    >
      <ReactFlow
        nodes={nodesWithSelection}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        snapToGrid
        snapGrid={SNAP_GRID}
        fitView
        fitViewOptions={FIT_VIEW_OPTS}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onNodeClick={onNodeClick}
        onPaneClick={() => onSelectNode(null)}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls position="top-left" showInteractive={false} />
        {nodes.length > 8 && <MiniMap pannable zoomable />}

        {/*
          Undo/redo overlay — top-right so it sits opposite React Flow's
          Controls. Lives outside the ReactFlow children that follow each
          other vertically because react-flow's <Panel> doesn't snap to
          arbitrary corners cleanly.
        */}
        <div className="absolute top-3 right-3 z-10 flex gap-1 rounded-md border bg-card/95 shadow-sm p-0.5 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={history.undo}
            disabled={!history.canUndo}
            title="Undo (⌘Z)"
            aria-label="Undo"
          >
            <Undo2 className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={history.redo}
            disabled={!history.canRedo}
            title="Redo (⇧⌘Z)"
            aria-label="Redo"
          >
            <Redo2 className="size-3.5" />
          </Button>
        </div>
      </ReactFlow>
    </WorkflowRunnerProvider>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// (FE seedFromScenes() was removed — the backend's AnalyzeProjectWorkflow now
// seeds workflow.definition with the full source → analyze → N scenes → target
// graph at the tail of analyze. If the workflow loads empty, the FE just shows
// an empty canvas and the polling loop picks up the seeded graph once analyze
// completes.)
// ────────────────────────────────────────────────────────────────────────────
