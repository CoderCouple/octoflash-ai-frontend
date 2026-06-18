/**
 * Execution — polling shape for every async backend operation.
 *
 * Replaces the old `Job` shape. Backend uses `workflow_execution` rows that
 * carry Temporal handles (stable workflow_id + rotating run_id) plus
 * Temporal-derived metadata (workflow_type, task_queue, history size, last
 * failure). The legacy /jobs/:id URL is gone — poll /executions/:id.
 *
 * Status values are the canonical Temporal workflow states (uppercase).
 * `kind` is the FE-facing semantic — what the run is *for* — independent of
 * the implementation class name in `temporalWorkflowType`.
 */

import { api } from "./client.js";

export type WorkflowKind =
  | "analyze"
  | "generate"
  | "regenerate_clip"
  | "export"
  | "preview"
  | "transcribe";

export type ExecutionStatus =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELED"
  | "TERMINATED"
  | "TIMED_OUT";

export type ExecutionTrigger = "MANUAL" | "CRON" | "API";

export type ExecutionPhaseStatus =
  | "CREATED"
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED";

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export type ExecutionPhase = {
  id: string;
  workflowExecutionId: string;
  status: ExecutionPhaseStatus;
  number: number;
  name: string | null;
  node: string | null;
  startedAt: string | null;
  completedAt: string | null;
  inputs: Record<string, unknown> | null;
  outputs: Record<string, unknown> | null;
  temporalActivityId: string | null;
  temporalActivityType: string | null;
  temporalAttempt: number | null;
  temporalMaxAttempts: number | null;
  temporalHeartbeatAt: string | null;
  temporalLastFailure: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type Execution = {
  id: string;
  workflowId: string;
  /** Parent project — populated by the BE when the workflow is bound
   *  to a project. Nullable for the rare case where the project link
   *  isn't resolvable. Use it to navigate after a create-and-run call. */
  projectId: string | null;
  userId: string;
  kind: WorkflowKind;
  triggerKind: ExecutionTrigger;
  status: ExecutionStatus;
  /** 0–100, derived server-side from completed-phase ratio. */
  progress: number;
  startedAt: string | null;
  completedAt: string | null;
  creditsConsumed: number | null;

  /** Temporal lineage — for cross-referencing in Temporal Cloud UI. */
  temporalWorkflowId: string;
  temporalRunId: string | null;
  temporalWorkflowType: string | null;
  temporalTaskQueue: string | null;
  temporalNamespace: string | null;
  temporalHistoryLength: number | null;
  temporalHistorySizeBytes: number | null;
  temporalLastFailure: Record<string, unknown> | null;

  phases: ExecutionPhase[];

  createdAt: string;
  updatedAt: string;
};

export const executionsApi = {
  get: (id: string) => api.get<Execution>(`/api/v1/executions/${id}`),
};

/** Terminal states — once status is one of these, polling can stop. */
export const TERMINAL_EXECUTION_STATUSES: readonly ExecutionStatus[] = [
  "COMPLETED",
  "FAILED",
  "CANCELED",
  "TERMINATED",
  "TIMED_OUT",
] as const;

export function isTerminalExecutionStatus(s: ExecutionStatus): boolean {
  return TERMINAL_EXECUTION_STATUSES.includes(s);
}

/** Convenience: poll until terminal state, with adjustable cadence + timeout. */
export async function pollExecution(
  id: string,
  opts: {
    intervalMs?: number;
    timeoutMs?: number;
    onTick?: (execution: Execution) => void;
    signal?: AbortSignal;
  } = {},
): Promise<Execution> {
  const interval = opts.intervalMs ?? 1500;
  const deadline = Date.now() + (opts.timeoutMs ?? 10 * 60 * 1000);

  while (true) {
    if (opts.signal?.aborted) {
      throw new DOMException("Polling aborted", "AbortError");
    }
    if (Date.now() > deadline) {
      throw new Error(`Execution ${id} timed out before reaching terminal state`);
    }

    const execution = await executionsApi.get(id);
    opts.onTick?.(execution);
    if (isTerminalExecutionStatus(execution.status)) return execution;

    await new Promise((r) => setTimeout(r, interval));
  }
}
