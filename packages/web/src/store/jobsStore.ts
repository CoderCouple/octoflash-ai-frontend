/**
 * In-flight Temporal executions (analyze / generate / regenerate).
 *
 * Filename + hook name kept as `jobsStore` / `useJobsStore` to avoid touching
 * every consumer; internally everything is now an `Execution` row from the
 * backend's `workflow_execution` table (polling URL `/api/v1/executions/:id`,
 * uppercase ExecutionStatus enum).
 *
 * Components don't generally use this store directly — they call
 * `startAnalyze` / `startGenerate` / `startRegenerate` which kick off the
 * backend workflow AND register a poller. Subscribe to `jobs[executionId]`
 * to watch progress; when status flips terminal (COMPLETED / FAILED /
 * CANCELED / TERMINATED / TIMED_OUT), refetch the relevant project or scene.
 *
 * `startGenerate` now returns `Execution[]` because the backend kicks one
 * workflow per requested orientation (default = both portrait + landscape).
 * Each execution gets polled independently.
 */

import { create } from "zustand";

import {
  executionsApi,
  isTerminalExecutionStatus,
  projectsApi,
  scenesApi,
  type CreateFromSourceInput,
  type CreateFromSourceResponse,
  type Execution,
  type Orientation,
} from "@octoflash/core";

interface JobsState {
  /** All executions we're tracking, keyed by execution id. */
  jobs: Record<string, Execution>;
  /** Active poller handles — internal bookkeeping. */
  _pollers: Record<string, ReturnType<typeof setInterval>>;
}

interface JobsActions {
  // ─── Kicks — start a workflow + auto-poll ────────────────────────────
  /**
   * `POST /projects/from-source` — creates an empty Project + kicks off
   * AnalyzeProjectWorkflow. Returns the full response (project + sourceType
   * + execution). Polling begins immediately if an execution came back;
   * subscribe to `jobs[response.execution.id]`.
   */
  startAnalyze(input: CreateFromSourceInput): Promise<CreateFromSourceResponse>;

  /**
   * `POST /projects/{id}/generate` — kicks off ONE GenerateVideoWorkflow per
   * requested orientation (default = both). Returns the list of executions
   * (one per orientation); polling begins immediately for each.
   */
  startGenerate(
    projectId: string,
    maxClips?: number,
    orientations?: Orientation[],
  ): Promise<Execution[]>;

  /**
   * `POST /scenes/{id}/regenerate` — kicks off RegenerateClipWorkflow for
   * one clip + auto-restitches its orientation-specific final video.
   */
  startRegenerate(sceneId: string): Promise<Execution>;

  // ─── Manual control ───────────────────────────────────────────────────
  /** Begin polling an existing execution (idempotent — no-op if already polling). */
  track(executionId: string, intervalMs?: number): void;
  /** Stop polling + drop from local state. */
  clear(executionId: string): void;
  /** Stop polling all executions (e.g. on logout). */
  clearAll(): void;
}

const DEFAULT_INTERVAL = 1500;

export const useJobsStore = create<JobsState & JobsActions>((set, get) => ({
  jobs: {},
  _pollers: {},

  async startAnalyze(input) {
    const response = await projectsApi.fromSource(input);
    if (response.execution) {
      const e = response.execution;
      set((s) => ({ jobs: { ...s.jobs, [e.id]: e } }));
      get().track(e.id);
    }
    return response;
  },

  async startGenerate(projectId, maxClips, orientations) {
    const executions = await projectsApi.generate(projectId, { maxClips, orientations });
    set((s) => {
      const merged = { ...s.jobs };
      for (const e of executions) merged[e.id] = e;
      return { jobs: merged };
    });
    for (const e of executions) get().track(e.id);
    return executions;
  },

  async startRegenerate(sceneId) {
    const execution = await scenesApi.regenerate(sceneId);
    set((s) => ({ jobs: { ...s.jobs, [execution.id]: execution } }));
    get().track(execution.id);
    return execution;
  },

  track(executionId, intervalMs = DEFAULT_INTERVAL) {
    if (get()._pollers[executionId]) return;

    const tick = async () => {
      try {
        const execution = await executionsApi.get(executionId);
        set((s) => ({ jobs: { ...s.jobs, [executionId]: execution } }));
        if (isTerminalExecutionStatus(execution.status)) {
          // Stop polling but keep the row so the UI can react to the final state.
          const poller = get()._pollers[executionId];
          if (poller) clearInterval(poller);
          set((s) => {
            const { [executionId]: _drop, ..._pollers } = s._pollers;
            return { _pollers };
          });
        }
      } catch (e) {
        // Transient error — leave poller running; next tick may recover.
        console.warn(`[jobsStore] poll failed for ${executionId}:`, e);
      }
    };

    const handle = setInterval(tick, intervalMs);
    set((s) => ({ _pollers: { ...s._pollers, [executionId]: handle } }));
    // Fire one immediate tick so UI doesn't wait `intervalMs` for first state.
    void tick();
  },

  clear(executionId) {
    const poller = get()._pollers[executionId];
    if (poller) clearInterval(poller);
    set((s) => {
      const { [executionId]: _droppedJob, ...jobs } = s.jobs;
      const { [executionId]: _droppedPoller, ..._pollers } = s._pollers;
      return { jobs, _pollers };
    });
  },

  clearAll() {
    for (const p of Object.values(get()._pollers)) clearInterval(p);
    set({ jobs: {}, _pollers: {} });
  },
}));
