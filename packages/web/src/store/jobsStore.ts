/**
 * In-flight Temporal jobs (variations / preview / export).
 *
 * Components don't generally use this store directly — they call
 * `startVariationsJob` / `startPreviewJob` etc. which kick off the backend
 * workflow AND register a poller. Subscribe to `jobs[jobId]` to watch
 * progress and `outputUrl` when status flips to `done`.
 *
 * Polling stops automatically when the job hits a terminal state (`done` /
 * `failed`) or when `clear(jobId)` is called.
 */

import { create } from "zustand";

import {
  jobsApi,
  scenesApi,
  projectsApi,
  type ExportFormat,
  type GenerateVariationsInput,
  type Job,
} from "@octoflash/core";

interface JobsState {
  /** All jobs we're tracking, keyed by job id. */
  jobs: Record<string, Job>;
  /** Active poller ids — internal bookkeeping. */
  _pollers: Record<string, ReturnType<typeof setInterval>>;
}

interface JobsActions {
  // ─── Kicks — start a workflow + auto-poll ────────────────────────────
  startVariations(sceneId: string, input?: GenerateVariationsInput): Promise<Job>;
  startPreview(projectId: string): Promise<Job>;
  startExport(projectId: string, format?: ExportFormat): Promise<Job>;

  // ─── Manual control ───────────────────────────────────────────────────
  /** Begin polling an existing job (idempotent — no-op if already polling). */
  track(jobId: string, intervalMs?: number): void;
  /** Stop polling + drop from local state. */
  clear(jobId: string): void;
  /** Stop polling all jobs (e.g. on logout). */
  clearAll(): void;
}

const DEFAULT_INTERVAL = 1500;

export const useJobsStore = create<JobsState & JobsActions>((set, get) => ({
  jobs: {},
  _pollers: {},

  async startVariations(sceneId, input) {
    const job = await scenesApi.generateVariations(sceneId, input);
    set((s) => ({ jobs: { ...s.jobs, [job.id]: job } }));
    get().track(job.id);
    return job;
  },

  async startPreview(projectId) {
    const job = await projectsApi.preview(projectId);
    set((s) => ({ jobs: { ...s.jobs, [job.id]: job } }));
    get().track(job.id);
    return job;
  },

  async startExport(projectId, format = "mp4") {
    const job = await projectsApi.export(projectId, format);
    set((s) => ({ jobs: { ...s.jobs, [job.id]: job } }));
    get().track(job.id);
    return job;
  },

  track(jobId, intervalMs = DEFAULT_INTERVAL) {
    if (get()._pollers[jobId]) return;

    const tick = async () => {
      try {
        const job = await jobsApi.get(jobId);
        set((s) => ({ jobs: { ...s.jobs, [jobId]: job } }));
        if (job.status === "done" || job.status === "failed") {
          // Stop polling but keep the row so the UI can react to the final state.
          const poller = get()._pollers[jobId];
          if (poller) clearInterval(poller);
          set((s) => {
            const { [jobId]: _drop, ..._pollers } = s._pollers;
            return { _pollers };
          });
        }
      } catch (e) {
        // Transient error — leave poller running; next tick may recover.
        console.warn(`[jobsStore] poll failed for ${jobId}:`, e);
      }
    };

    const handle = setInterval(tick, intervalMs);
    set((s) => ({ _pollers: { ...s._pollers, [jobId]: handle } }));
    // Fire one immediate tick so UI doesn't wait `intervalMs` for first state.
    void tick();
  },

  clear(jobId) {
    const poller = get()._pollers[jobId];
    if (poller) clearInterval(poller);
    set((s) => {
      const { [jobId]: _droppedJob, ...jobs } = s.jobs;
      const { [jobId]: _droppedPoller, ..._pollers } = s._pollers;
      return { jobs, _pollers };
    });
  },

  clearAll() {
    for (const p of Object.values(get()._pollers)) clearInterval(p);
    set({ jobs: {}, _pollers: {} });
  },
}));
