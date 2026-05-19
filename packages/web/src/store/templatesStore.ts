/**
 * Templates catalog cache.
 *
 * Pattern mirrors octonote's `projectStore.ts`: a Zustand store that owns
 * fetch lifecycle + in-memory cache for a single resource. Components call
 * `useTemplatesStore(...)` and trigger `loadCatalog()` once on mount.
 *
 * Catalog is loaded eagerly on first read and cached for the session — the
 * backend returns 127 entries, ~10KB total, so caching is trivially worth it.
 */

import { create } from "zustand";

import { templatesApi, type TemplateDetail, type TemplateSummary } from "@octoflash/core";

interface TemplatesState {
  catalog: TemplateSummary[];
  /** Loaded TemplateDetails keyed by id; populated by `loadDetail`. */
  detailsById: Record<string, TemplateDetail>;
  loading: boolean;
  error: string | null;
}

interface TemplatesActions {
  /** Fetch the full catalog. Idempotent: no-ops after the first success. */
  loadCatalog(): Promise<void>;
  /** Force-refresh the catalog (e.g. after backend deploys a new template). */
  refreshCatalog(): Promise<void>;
  /** Fetch the full TemplateDetail for one template; cached after first call. */
  loadDetail(templateId: string): Promise<TemplateDetail>;
  /** Helpers — derived selectors composed by components. */
  byCategory(): Record<string, TemplateSummary[]>;
}

export const useTemplatesStore = create<TemplatesState & TemplatesActions>(
  (set, get) => ({
    catalog: [],
    detailsById: {},
    loading: false,
    error: null,

    async loadCatalog() {
      if (get().catalog.length > 0 || get().loading) return;
      set({ loading: true, error: null });
      try {
        const catalog = await templatesApi.list();
        set({ catalog, loading: false });
      } catch (e) {
        set({ loading: false, error: (e as Error).message });
        throw e;
      }
    },

    async refreshCatalog() {
      set({ loading: true, error: null });
      try {
        const catalog = await templatesApi.list();
        set({ catalog, loading: false });
      } catch (e) {
        set({ loading: false, error: (e as Error).message });
        throw e;
      }
    },

    async loadDetail(templateId) {
      const cached = get().detailsById[templateId];
      if (cached) return cached;
      const detail = await templatesApi.get(templateId);
      set((s) => ({ detailsById: { ...s.detailsById, [templateId]: detail } }));
      return detail;
    },

    byCategory() {
      const out: Record<string, TemplateSummary[]> = {};
      for (const t of get().catalog) {
        (out[t.category] ??= []).push(t);
      }
      return out;
    },
  }),
);
