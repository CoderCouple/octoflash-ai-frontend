/**
 * Project + project-level endpoints.
 *
 * Field shapes mirror the backend's Pydantic models (snake_case there,
 * camelCase here — `client.ts` converts both ways automatically). Prefixed
 * UUIDs: `prj_<uuid>` for project ids.
 *
 * Lifecycle (driven by Temporal workflows; FE polls `/executions/{id}`):
 *   POST /projects/from-source  → AnalyzeProjectWorkflow (single execution)
 *      → status: queued → analyzing → analyzed
 *      → Project.{transcript, description, manimPrompt, sourceDuration} populated
 *   POST /projects/{id}/generate → GenerateVideoWorkflow per orientation
 *      → status: analyzed → generating → generated
 *      → Project.finalPortraitVideoUrl + finalLandscapeVideoUrl populated
 *      → Scene rows created per (orientation, n)
 *   GET  /projects/{id}/preview?orientation=…  → streams the stitched MP4
 */

import { getRuntimeConfig } from "../config.js";
import { api } from "./client.js";
import type { Execution } from "./executions.js";
import type { SceneResponse } from "./scenes.js";

export type ProjectStatus =
  | "queued"
  | "analyzing"
  | "analyzed"
  | "generating"
  | "generated"
  | "published"
  | "failed";

export type Orientation = "portrait" | "landscape";

export type Project = {
  id: string;
  title: string;
  sourceUrl: string | null;
  /** Renamed from `ownerId` — now a real FK to the `user` table. */
  userId: string;

  status: ProjectStatus;

  // User-chosen render options
  orientation: Orientation;
  quality: string; // "480p" | "720p" | "1080p"
  voiceover: boolean;
  voiceId: string | null;
  voiceGender: string | null;
  voiceAccent: string | null;
  targetDuration: number | null;

  // Analyze output (editable in the UI before /generate)
  transcript: string | null;
  description: string | null;
  manimPrompt: string | null;

  // Source metadata + final renders (now per-orientation).
  sourceDuration: number | null;
  framesDir: string | null;
  finalPortraitVideoUrl: string | null;
  finalLandscapeVideoUrl: string | null;

  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProjectDetail = Project & {
  scenes: SceneResponse[];
  /**
   * Workflow DAG is now fetched separately via GET /projects/{id}/workflow
   * (returns the React Flow JSON + projection rows). Field kept here as a
   * placeholder so existing consumers don't break — always null for now.
   */
  workflow: null;
};

// ─── Inputs ─────────────────────────────────────────────────────────────────

export type CreateProjectInput = {
  title: string;
  sourceUrl?: string | null;
};

export type UpdateProjectInput = {
  title?: string;
  sourceUrl?: string | null;
};

export type CreateFromSourceInput = {
  /** YouTube short, YouTube long-form, Medium, or Substack URL. */
  sourceUrl: string;
  /** Optional override; otherwise the analyze workflow sets it from the source's title. */
  title?: string | null;
  /** Optional render settings — stamped onto the new Project row so the
   *  first Generate doesn't need a follow-up PATCH. Omitted fields fall
   *  back to the backend's Project defaults (portrait, 720p, voiceover on). */
  orientation?: Orientation | null;
  quality?: string | null;          // "480p" | "720p" | "1080p"
  voiceover?: boolean | null;
  voiceId?: string | null;
  voiceGender?: string | null;
  voiceAccent?: string | null;
  targetDuration?: number | null;
};

/**
 * Returned by `POST /projects/from-source`. The project + classification land
 * synchronously; the analyze brief (transcript/description/manimPrompt) is
 * populated by the AnalyzeProjectWorkflow that the same call kicks off — poll
 * `execution.id` at `/executions/:id` until done, then re-fetch
 * `/projects/{project.id}` to see it.
 */
export type CreateFromSourceResponse = {
  project: Project;
  sourceType: "youtube_long" | "youtube_short" | "medium" | "substack";
  scenes: SceneResponse[];
  /** Renamed from `job` — single execution tracking the analyze workflow. */
  execution: Execution | null;
};

/**
 * Input for `POST /projects/from-text` — the YouTube-free entry point.
 * The brief becomes the manim_prompt directly; no analyze step, no
 * URL to download, no frames extraction.
 */
export type CreateFromTextInput = {
  /** What the video should be about. Min 50 chars so plan_clips has
   *  enough material to produce a real per-clip plan. */
  brief: string;
  /** Optional title; auto-derived from the first ~60 chars of brief
   *  when omitted. */
  title?: string | null;
  /** Render options — same shape as CreateFromSourceInput. Omitted
   *  fields fall back to the backend's Project defaults. */
  orientation?: Orientation | null;
  quality?: string | null;          // "480p" | "720p" | "1080p"
  voiceover?: boolean | null;
  voiceId?: string | null;
  voiceGender?: string | null;
  voiceAccent?: string | null;
  targetDuration?: number | null;
  maxClips?: number | null;
};

// ─── API ────────────────────────────────────────────────────────────────────

export const projectsApi = {
  /** Create an empty project (no source URL flow). */
  create: (input: CreateProjectInput) =>
    api.post<Project>("/api/v1/projects", input),

  /**
   * Paste a URL → kicks off AnalyzeProjectWorkflow. Returns 202 with the
   * (empty) Project + an Execution. Poll `execution.id`; when done,
   * `GET /projects/{id}` returns the populated brief.
   */
  fromSource: (input: CreateFromSourceInput) =>
    api.post<CreateFromSourceResponse>("/api/v1/projects/from-source", input),

  /**
   * Type a brief → kicks off GenerateVideoWorkflow directly (no analyze
   * step). Returns 202 with just an Execution; navigate to
   * `/projects/${execution.projectId}` once it lands.
   */
  fromText: (input: CreateFromTextInput) =>
    api.post<Execution>("/api/v1/projects/from-text", input),

  list: (params?: { offset?: number; limit?: number; userId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.offset !== undefined) qs.set("offset", String(params.offset));
    if (params?.limit !== undefined) qs.set("limit", String(params.limit));
    if (params?.userId) qs.set("user_id", params.userId);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return api.get<{ items: Project[]; total: number; offset: number; limit: number }>(
      `/api/v1/projects${suffix}`,
    );
  },

  get: (id: string) => api.get<ProjectDetail>(`/api/v1/projects/${id}`),

  patch: (id: string, body: UpdateProjectInput) =>
    api.patch<Project>(`/api/v1/projects/${id}`, body),

  delete: (id: string) => api.del<void>(`/api/v1/projects/${id}`),

  /**
   * Kicks off ONE GenerateVideoWorkflow per requested orientation (default
   * = both portrait + landscape). Requires the project to already be
   * `analyzed`. Returns 202 + a list of Executions — poll each one
   * independently. On completion, `Project.finalPortraitVideoUrl` and/or
   * `Project.finalLandscapeVideoUrl` point at the stitched MP4s.
   */
  generate: (
    id: string,
    opts: { maxClips?: number; orientations?: Orientation[] } = {},
  ) => {
    const qs = new URLSearchParams();
    qs.set("max_clips", String(opts.maxClips ?? 8));
    const orientations = opts.orientations ?? ["portrait", "landscape"];
    for (const o of orientations) qs.append("orientations", o);
    return api.post<Execution[]>(
      `/api/v1/projects/${id}/generate?${qs.toString()}`,
      {},
    );
  },

  /**
   * Absolute URL of the stitched final MP4 for `<video src>` consumption.
   * `orientation` defaults to portrait. Returns 404 if that orientation's
   * final hasn't been generated yet.
   */
  previewUrl: (id: string, orientation: Orientation = "portrait"): string =>
    `${getRuntimeConfig().apiUrl.replace(/\/$/, "")}/api/v1/projects/${id}/preview?orientation=${orientation}`,
};
