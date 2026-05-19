/**
 * Job — the polling shape every async operation returns.
 *
 * Backend kicks off a Temporal workflow per Job; `workflowId` + `runId` are
 * persisted on the row so the Temporal Cloud UI can be cross-referenced.
 * Frontend should poll `jobsApi.get(id)` until `status` is `done` or `failed`.
 */

import { api } from "./client.js";

export type JobKind =
  | "variations"
  | "rerender"
  | "preview"
  | "export"
  | "transcribe"
  | "plan";

export type JobStatus = "queued" | "running" | "done" | "failed";

export type JobLogEntry = {
  errorType?: string;
  errorMessage?: string;
  [extra: string]: unknown;
};

export type Job = {
  id: string;
  kind: JobKind;
  projectId: string | null;
  sceneId: string | null;
  status: JobStatus;
  /** 0–100 integer. */
  progress: number;
  logs: JobLogEntry[];
  /** Set when status === "done" (preview/export jobs only). */
  outputUrl: string | null;
  /** Temporal handles — useful for cross-referencing in Temporal Cloud UI. */
  workflowId: string | null;
  runId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
};

export const jobsApi = {
  get: (id: string) => api.get<Job>(`/api/v1/jobs/${id}`),
};

/** Convenience: poll until terminal state, with adjustable cadence + timeout. */
export async function pollJob(
  id: string,
  opts: {
    intervalMs?: number;
    timeoutMs?: number;
    onTick?: (job: Job) => void;
    signal?: AbortSignal;
  } = {},
): Promise<Job> {
  const interval = opts.intervalMs ?? 1500;
  const deadline = Date.now() + (opts.timeoutMs ?? 10 * 60 * 1000);

  while (true) {
    if (opts.signal?.aborted) {
      throw new DOMException("Polling aborted", "AbortError");
    }
    if (Date.now() > deadline) {
      throw new Error(`Job ${id} timed out before reaching terminal state`);
    }

    const job = await jobsApi.get(id);
    opts.onTick?.(job);
    if (job.status === "done" || job.status === "failed") return job;

    await new Promise((r) => setTimeout(r, interval));
  }
}
