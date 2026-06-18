/**
 * Voices catalog cache.
 *
 * The catalog is small (~20 voices), server-side static, and doesn't change
 * between calls — load it once on first read, hold it for the session.
 * The voice picker UI groups by accent; we cache that derived list too.
 */

import { create } from "zustand";

import { voicesApi, type Voice } from "@octoflash/core";

interface VoicesState {
  voices: Voice[];
  loading: boolean;
  error: string | null;
}

interface VoicesActions {
  /** Fetch the catalog. Idempotent — no-ops after the first success. */
  load(): Promise<void>;
  /** Force-refresh (e.g. after backend deploy adds new voices). */
  refresh(): Promise<void>;
  /** Derived: voices grouped by accent, in catalog order. */
  byAccent(): Record<string, Voice[]>;
  /** Find one by id. */
  find(id: string | null | undefined): Voice | null;
}

export const useVoicesStore = create<VoicesState & VoicesActions>(
  (set, get) => ({
    voices: [],
    loading: false,
    error: null,

    async load() {
      if (get().voices.length > 0 || get().loading) return;
      await get().refresh();
    },

    async refresh() {
      set({ loading: true, error: null });
      try {
        const voices = await voicesApi.list();
        set({ voices, loading: false });
      } catch (e) {
        set({ loading: false, error: (e as Error).message });
        throw e;
      }
    },

    byAccent() {
      const out: Record<string, Voice[]> = {};
      for (const v of get().voices) {
        (out[v.accent] ??= []).push(v);
      }
      return out;
    },

    find(id) {
      if (!id) return null;
      return get().voices.find((v) => v.id === id) ?? null;
    },
  }),
);
