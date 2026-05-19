/**
 * Scene + scene-level endpoints (variations, select).
 *
 * NL editing endpoints (/instruct, /collapse, /discard, /instructions) live
 * in a separate `instructions.ts` so callers can ignore them when not needed.
 */

import { api } from "./client.js";
import type { Job } from "./jobs.js";

export type SceneResponse = {
  id: string;
  projectId: string;
  n: number;
  title: string | null;
  template: string;
  params: Record<string, unknown>;
  prompt: string | null;
  duration: number | null;
  style: string | null;
  motion: string | null;
  status: string;
  selectedVariationId: string | null;
  extraSteps: Record<string, unknown>[];
  mode: "structured" | "advanced";
  createdAt: string;
  updatedAt: string;
};

export type VariationResponse = {
  id: string;
  sceneId: string;
  paramsSnapshot: Record<string, unknown>;
  videoUrl: string | null;
  audioUrl: string | null;
  duration: number | null;
  frameCount: number | null;
  fileSize: number | null;
  status: string;
  renderedAt: string | null;
  createdAt: string;
};

export type CreateSceneInput = {
  template: string;
  title?: string | null;
  prompt?: string | null;
  params?: Record<string, unknown>;
  duration?: number | null;
  style?: string | null;
  motion?: string | null;
  /** Explicit ordering; defaults to next available slot. */
  n?: number | null;
};

export type UpdateSceneInput = {
  title?: string | null;
  template?: string;
  prompt?: string | null;
  params?: Record<string, unknown>;
  duration?: number | null;
  style?: string | null;
  motion?: string | null;
};

export type GenerateVariationsInput = {
  n?: number;
  seed?: number | null;
};

export const scenesApi = {
  // ─── Scene CRUD (rooted under a project for create) ─────────────────────
  create: (projectId: string, input: CreateSceneInput) =>
    api.post<SceneResponse>(`/api/v1/projects/${projectId}/scenes`, input),

  patch: (
    sceneId: string,
    input: UpdateSceneInput,
    opts?: { force?: boolean },
  ) => {
    const qs = opts?.force ? "?force=true" : "";
    return api.patch<SceneResponse>(`/api/v1/scenes/${sceneId}${qs}`, input);
  },

  delete: (sceneId: string) => api.del<void>(`/api/v1/scenes/${sceneId}`),

  // ─── Variations under a scene ───────────────────────────────────────────
  generateVariations: (sceneId: string, input: GenerateVariationsInput = {}) =>
    api.post<Job>(`/api/v1/scenes/${sceneId}/variations`, {
      n: input.n ?? 4,
      seed: input.seed ?? null,
    }),

  listVariations: (sceneId: string) =>
    api.get<VariationResponse[]>(`/api/v1/scenes/${sceneId}/variations`),

  selectVariation: (sceneId: string, variationId: string) =>
    api.patch<SceneResponse>(`/api/v1/scenes/${sceneId}/select-variation`, {
      variationId,
    }),
};

// ─── Standalone variation operations ────────────────────────────────────────

export const variationsApi = {
  /** Re-render an existing variation (optionally with overridden params). */
  rerender: (variationId: string, paramsOverride?: Record<string, unknown>) =>
    api.post<Job>(`/api/v1/variations/${variationId}/render`, {
      paramsOverride: paramsOverride ?? null,
    }),
};
