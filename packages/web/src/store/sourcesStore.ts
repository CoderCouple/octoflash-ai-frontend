/**
 * Sources — list + open + create-from-URL + sync.
 *
 * State is keyed per source: `videosById[sourceId]` holds the currently-
 * loaded videos. The store always loads the FULL recent video set via the
 * detail endpoint; consumers filter by kind in their selectors.
 *
 * Sync is a synchronous backend call (1–30s). We expose `syncing` so the UI
 * can show a spinner. No Temporal job polling — sources don't go through the
 * workflow runner.
 */

import { create } from "zustand";

import {
  sourcesApi,
  type Source,
  type SourceDetail,
  type SourceVideo,
  type CreateSourceInput,
} from "@octoflash/core";

interface SourcesState {
  sources: Source[];
  currentSource: SourceDetail | null;
  videosById: Record<string, SourceVideo[]>;
  loading: boolean;
  syncing: boolean;
  error: string | null;
}

interface SourcesActions {
  loadSources(): Promise<void>;
  openSource(sourceId: string): Promise<SourceDetail>;

  /**
   * Paste a URL, persist metadata, then trigger a video sync and navigate
   * the store's `currentSource` to the new one. Returns the created/updated
   * Source.
   */
  createAndSync(input: CreateSourceInput): Promise<Source>;

  /** Re-sync videos for a source; refreshes `videosById` and `currentSource`. */
  refresh(sourceId: string): Promise<void>;

  deleteSource(sourceId: string): Promise<void>;
}

export const useSourcesStore = create<SourcesState & SourcesActions>(
  (set, get) => ({
    sources: [],
    currentSource: null,
    videosById: {},
    loading: false,
    syncing: false,
    error: null,

    async loadSources() {
      set({ loading: true, error: null });
      try {
        const page = await sourcesApi.list({ limit: 100 });
        set({ sources: page.items, loading: false });
      } catch (e) {
        set({ loading: false, error: (e as Error).message });
        throw e;
      }
    },

    async openSource(sourceId) {
      set({ loading: true, error: null });
      try {
        const detail = await sourcesApi.get(sourceId);
        set((s) => ({
          currentSource: detail,
          videosById: { ...s.videosById, [sourceId]: detail.videos },
          loading: false,
        }));
        return detail;
      } catch (e) {
        set({ loading: false, error: (e as Error).message });
        throw e;
      }
    },

    async createAndSync(input) {
      set({ syncing: true, error: null });
      try {
        const source = await sourcesApi.create(input);
        // Insert at top (or replace if existing).
        set((s) => {
          const without = s.sources.filter((c) => c.id !== source.id);
          return { sources: [source, ...without] };
        });

        // Backend sync is sync — ~1–30s.
        await sourcesApi.sync(source.id);

        // Re-load detail so currentSource has fresh videos.
        const detail = await sourcesApi.get(source.id);
        set((s) => ({
          currentSource: detail,
          videosById: { ...s.videosById, [source.id]: detail.videos },
          syncing: false,
        }));
        return source;
      } catch (e) {
        set({ syncing: false, error: (e as Error).message });
        throw e;
      }
    },

    async refresh(sourceId) {
      set({ syncing: true, error: null });
      try {
        await sourcesApi.sync(sourceId);
        const detail = await sourcesApi.get(sourceId);
        set((s) => ({
          currentSource:
            s.currentSource?.id === sourceId ? detail : s.currentSource,
          videosById: { ...s.videosById, [sourceId]: detail.videos },
          syncing: false,
        }));
      } catch (e) {
        set({ syncing: false, error: (e as Error).message });
        throw e;
      }
    },

    async deleteSource(sourceId) {
      await sourcesApi.delete(sourceId);
      set((s) => ({
        sources: s.sources.filter((c) => c.id !== sourceId),
        currentSource: s.currentSource?.id === sourceId ? null : s.currentSource,
        videosById: Object.fromEntries(
          Object.entries(s.videosById).filter(([k]) => k !== sourceId),
        ),
      }));
    },
  }),
);
