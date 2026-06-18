/**
 * WorkflowRunnerContext — exposes the current workflow id + per-node run
 * callback to every node renderer inside the FlowEditor.
 *
 * React Flow's custom-node API only hands the renderer `{id, data, ...}`,
 * not the surrounding workflow's id. Rather than thread workflowId through
 * every node's `data`, we provide it once at the FlowEditor and pull it
 * back inside NodeHeader via useWorkflowRunner().
 *
 * The callback also handles the in-flight execution that the node has
 * spawned, so the NodeHeader can show a spinner while a run is live and
 * surface failed state to enable a "Retry" click.
 */

import { createContext, useContext } from "react";

import type { Execution } from "@octoflash/core";

export type RunStatus =
  | { state: "idle" }
  | { state: "running"; executionId: string }
  | { state: "completed"; executionId: string }
  | { state: "failed"; executionId: string; message?: string };

export type WorkflowRunnerValue = {
  workflowId: string | null;
  /** Trigger Run / Regenerate / Retry for one node. Returns the Execution. */
  runNode: (nodeId: string) => Promise<Execution>;
  /** Most recent run status per node id, populated by `runNode` + polling. */
  runByNode: Record<string, RunStatus>;
};

const WorkflowRunnerContext = createContext<WorkflowRunnerValue | null>(null);

export function WorkflowRunnerProvider({
  value,
  children,
}: {
  value: WorkflowRunnerValue;
  children: React.ReactNode;
}) {
  return (
    <WorkflowRunnerContext.Provider value={value}>
      {children}
    </WorkflowRunnerContext.Provider>
  );
}

export function useWorkflowRunner(): WorkflowRunnerValue {
  const ctx = useContext(WorkflowRunnerContext);
  if (ctx === null) {
    // Renderer must be wrapped by WorkflowRunnerProvider (FlowEditor does
    // this). Default to a no-op so tests / standalone previews don't crash.
    return {
      workflowId: null,
      runNode: async () => {
        throw new Error("WorkflowRunnerProvider missing");
      },
      runByNode: {},
    };
  }
  return ctx;
}
