/**
 * Queue for the "Use as source" button on the source-detail page.
 *
 * Clicking the button enqueues the video; the store drains the queue
 * one at a time, calling `projectsApi.fromSource` (which kicks the
 * analyze workflow server-side). This avoids hammering the backend
 * when a user clicks on five videos in quick succession.
 *
 * VideoRow subscribes to:
 *   - `currentId`        — show "Creating…" on the row that's processing
 *   - `pendingIds`       — show "Queued" on rows waiting
 *   - `errorById[id]`    — show the inline failure message
 */

import { create } from "zustand";

import { projectsApi, type SourceVideo } from "@octoflash/core";

type State = {
  /** FIFO of videos still waiting to be processed. */
  queue: SourceVideo[];
  /** Video currently being processed (POST in flight). */
  current: SourceVideo | null;
  /** Per-video last error message. Cleared on a successful (re)try. */
  errorById: Record<string, string>;
  /** Last project we created — useful for "show me the result" toasts. */
  lastCreatedProjectId: string | null;
};

type Actions = {
  enqueue(video: SourceVideo): void;
  /** Drop a queued (not-yet-running) item — UI cancel. */
  cancel(videoId: string): void;
  /** Internal — promoted to public so tests can force a single drain. */
  _drain(): Promise<void>;
};

export const useAsSourceQueueStore = create<State & Actions>((set, get) => ({
  queue: [],
  current: null,
  errorById: {},
  lastCreatedProjectId: null,

  enqueue(video) {
    const { queue, current } = get();
    // De-dupe: ignore if this video is already pending or currently
    // running. A user clicking the same button twice shouldn't fire
    // two creates.
    if (current?.id === video.id || queue.some((v) => v.id === video.id)) {
      return;
    }
    // Clear any prior error for this video — we're giving it another go.
    const errorById = { ...get().errorById };
    delete errorById[video.id];
    set({ queue: [...queue, video], errorById });
    // Kick the drain. If one is already running it will pick up the new
    // item on its next iteration; the `current` guard below stops two
    // drains running in parallel.
    void get()._drain();
  },

  cancel(videoId) {
    set((s) => ({ queue: s.queue.filter((v) => v.id !== videoId) }));
  },

  async _drain() {
    // Only one drain loop at a time. The check + set is synchronous so
    // races between two `enqueue` calls can't both start a drain.
    if (get().current) return;
    while (true) {
      const next = get().queue[0];
      if (!next) {
        set({ current: null });
        return;
      }
      set((s) => ({
        current: next,
        queue: s.queue.slice(1),
      }));
      try {
        const { project } = await projectsApi.fromSource({
          sourceUrl: next.sourceUrl,
          title: next.title,
        });
        set({ lastCreatedProjectId: project.id });
      } catch (e) {
        set((s) => ({
          errorById: {
            ...s.errorById,
            [next.id]: (e as Error).message ?? "Couldn't create project.",
          },
        }));
      }
    }
  },
}));

// Selector helpers for hot paths — subscribing to the whole store would
// re-render every row on every queue mutation, which is overkill.
export const useIsCurrent = (id: string) =>
  useAsSourceQueueStore((s) => s.current?.id === id);
export const useIsPending = (id: string) =>
  useAsSourceQueueStore((s) => s.queue.some((v) => v.id === id));
export const useError = (id: string) =>
  useAsSourceQueueStore((s) => s.errorById[id]);
