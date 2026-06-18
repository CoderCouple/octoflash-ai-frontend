/**
 * Scene (= clip) endpoints.
 *
 * One Scene = one Manim render = one MP4. The final video is the ordered
 * concat of all Scenes for a project. Editing a single Scene's prompt and
 * calling `regenerate(id)` re-renders just that clip + auto-restitches the
 * project — that's the atomic re-render invariant.
 *
 * Polling pattern: after `regenerate`, watch the returned Job; when it flips
 * to `done`, re-fetch `GET /scenes/{id}` to see the new `videoUrl` and use
 * `previewUrl(id)` to load the MP4 in a `<video>` element.
 */

import { getRuntimeConfig } from "../config.js";
import { api } from "./client.js";
import type { Execution } from "./executions.js";
import type { Orientation } from "./projects.js";

export type SceneStatus = "draft" | "scripting" | "rendering" | "ready" | "failed";

export type SceneResponse = {
  id: string;
  projectId: string;
  /** Which orientation this scene belongs to — scenes are now uniquely
   * keyed by (project, orientation, n), so one project can have parallel
   * portrait + landscape sets. */
  orientation: Orientation;
  n: number; // 1-indexed position in the final video

  title: string | null;
  prompt: string | null; // creative direction for this clip
  duration: number | null; // target seconds

  // Per-clip script + voice
  scriptCode: string | null;
  scriptFile: string | null; // path on disk
  scriptCodeHash: string | null; // sha256; skip-if-unchanged cache key
  voiceIdOverride: string | null; // null = inherit Project.voiceId

  // Render output
  videoUrl: string | null;
  renderMethod: string | null; // which fallback-chain path produced the MP4
  evalScore: number | null; // 0-10 vision-eval score
  evalFeedback: string | null;

  status: SceneStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateSceneInput = {
  title?: string | null;
  prompt?: string | null;
  duration?: number | null;
  /** Explicit ordering; defaults to next available slot. */
  n?: number | null;
};

export type UpdateSceneInput = {
  title?: string | null;
  prompt?: string | null;
  duration?: number | null;
};

export const scenesApi = {
  // ─── Scene CRUD ─────────────────────────────────────────────────────────
  create: (projectId: string, input: CreateSceneInput) =>
    api.post<SceneResponse>(`/api/v1/projects/${projectId}/scenes`, input),

  get: (sceneId: string) => api.get<SceneResponse>(`/api/v1/scenes/${sceneId}`),

  patch: (sceneId: string, input: UpdateSceneInput) =>
    api.patch<SceneResponse>(`/api/v1/scenes/${sceneId}`, input),

  delete: (sceneId: string) => api.del<void>(`/api/v1/scenes/${sceneId}`),

  // ─── Atomic per-clip re-render ──────────────────────────────────────────
  /**
   * Kick off RegenerateClipWorkflow — re-renders just this clip (skip-if-
   * unchanged guard applies based on `scriptCodeHash`) + auto-restitches
   * the orientation-specific final video. Typical flow: PATCH /scenes/{id}
   * to edit the prompt, then call this. Returns 202 + Execution; poll at
   * /executions/{id} until done.
   */
  regenerate: (sceneId: string) =>
    api.post<Execution>(`/api/v1/scenes/${sceneId}/regenerate`, {}),

  // ─── Per-clip preview URL (for <video src>) ─────────────────────────────
  /**
   * Absolute URL of the clip's MP4. Returns 404 if `videoUrl` isn't set yet
   * (clip is still draft/scripting/rendering or render failed). Use as the
   * `src` attribute of a `<video>` element in the workflow DAG nodes.
   */
  previewUrl: (sceneId: string): string =>
    `${getRuntimeConfig().apiUrl.replace(/\/$/, "")}/api/v1/scenes/${sceneId}/preview`,
};
