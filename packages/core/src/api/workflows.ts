/**
 * Workflow DAG endpoints.
 *
 * Each project has exactly one workflow (1:1). The `definition` field is the
 * React Flow `toObject()` payload — server stores it as JSONB verbatim and
 * also maintains projection rows in `workflow_node_instance` +
 * `workflow_edge_instance` for queryability.
 *
 *   GET /projects/{id}/workflow   → load (auto-creates an empty workflow row)
 *   GET /workflows/{id}           → load by workflow id
 *   PUT /workflows/{id}           → replace definition + name/description
 *
 * Client convention: generate `wni_<uuid>` ids for nodes and `we_<uuid>` for
 * edges (via `crypto.randomUUID()` — `createFlowNode()` does this in the web
 * package). The server accepts them as the PK.
 */

import { api } from "./client.js";
import type { Execution } from "./executions.js";

export type WorkflowStatus = "DRAFT" | "PUBLISHED";

export type WorkflowRecord = {
  id: string;
  projectId: string;
  userId: string;
  name: string | null;
  description: string | null;
  /** React Flow toObject() payload — passed back verbatim. */
  definition: Record<string, unknown> | null;
  executionPlan: Record<string, unknown> | null;
  status: WorkflowStatus;
  cron: string | null;
  lastRunAt: string | null;
  lastRunId: string | null;
  lastRunStatus: string | null;
  nextRunAt: string | null;
  nodes: unknown[];
  edges: unknown[];
  createdAt: string;
  updatedAt: string;
};

export type PutWorkflowInput = {
  definition: Record<string, unknown>;
  name?: string | null;
  description?: string | null;
};

export type RunNodeInput = {
  /** Override the node's saved config for this one run. Omit for "run as saved". */
  inputs?: Record<string, unknown>;
};

export const workflowsApi = {
  getForProject: (projectId: string) =>
    api.get<WorkflowRecord>(`/api/v1/projects/${projectId}/workflow`),

  get: (workflowId: string) =>
    api.get<WorkflowRecord>(`/api/v1/workflows/${workflowId}`),

  put: (workflowId: string, body: PutWorkflowInput) =>
    api.put<WorkflowRecord>(`/api/v1/workflows/${workflowId}`, body),

  /**
   * Trigger one DAG node — kicks the corresponding Temporal workflow.
   * Same call for first-run / re-run / retry-after-failure: identical
   * `inputs` while a prior run is in-flight returns the existing Execution
   * (coalesced); edited `inputs` start a new run; clicking after a closed
   * run reuses the same id and is a fresh run from step 1.
   */
  runNode: (
    workflowId: string,
    nodeInstanceId: string,
    body: RunNodeInput = {},
  ) =>
    api.post<Execution>(
      `/api/v1/workflows/${workflowId}/nodes/${nodeInstanceId}/run`,
      body,
    ),

  /** Delete the whole workflow — cascades to the parent project (1:1). */
  delete: (workflowId: string) =>
    api.del<null>(`/api/v1/workflows/${workflowId}`),

  /** Delete one node from the DAG (and any edges touching it). */
  deleteNode: (workflowId: string, nodeInstanceId: string) =>
    api.del<null>(
      `/api/v1/workflows/${workflowId}/nodes/${nodeInstanceId}`,
    ),
};
