/**
 * Project + project-level endpoints.
 *
 * Field shapes mirror the backend's Pydantic models, but in camelCase
 * (the client adapter handles snake↔camel both ways). Prefixed UUIDs:
 *   prj_<uuid> for project ids.
 */

import { api } from "./client.js";
import type { SceneResponse } from "./scenes.js";
import type { Job } from "./jobs.js";

export type Project = {
  id: string;
  title: string;
  sourceUrl: string | null;
  ownerId: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WorkflowNodeResponse = {
  id: string;
  projectId: string;
  kind: "start" | "scene" | "branch" | "merge" | "end";
  x: number;
  y: number;
  w: number | null;
  h: number | null;
  label: string | null;
  sceneId: string | null;
  styleOverride: string | null;
  branchLabel: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkflowEdgeResponse = {
  id: string;
  projectId: string;
  fromNodeId: string;
  toNodeId: string;
  kind: string;
  createdAt: string;
};

export type ProjectDetail = Project & {
  scenes: SceneResponse[];
  workflow: { nodes: WorkflowNodeResponse[]; edges: WorkflowEdgeResponse[] } | null;
};

export type CreateProjectInput = {
  title: string;
  sourceUrl?: string | null;
  prompt?: string | null;
};

export type UpdateProjectInput = {
  title?: string;
  sourceUrl?: string | null;
};

export type ExportFormat = "mp4" | "mov";

export const projectsApi = {
  create: (input: CreateProjectInput) =>
    api.post<Project>("/api/v1/projects", input),

  list: (params?: { offset?: number; limit?: number; ownerId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.offset !== undefined) qs.set("offset", String(params.offset));
    if (params?.limit !== undefined) qs.set("limit", String(params.limit));
    if (params?.ownerId) qs.set("owner_id", params.ownerId);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return api.get<{ items: Project[]; total: number; offset: number; limit: number }>(
      `/api/v1/projects${suffix}`,
    );
  },

  get: (id: string) => api.get<ProjectDetail>(`/api/v1/projects/${id}`),

  patch: (id: string, body: UpdateProjectInput) =>
    api.patch<Project>(`/api/v1/projects/${id}`, body),

  delete: (id: string) => api.del<void>(`/api/v1/projects/${id}`),

  // Render the project's selected variations into a low-quality stitched MP4.
  // Returns a Job; poll via jobsApi.get(jobId) until status === "done".
  preview: (id: string) => api.post<Job>(`/api/v1/projects/${id}/preview`, {}),

  // Full-quality stitched + re-encoded final deliverable. Same Job contract.
  export: (id: string, format: ExportFormat = "mp4") =>
    api.post<Job>(`/api/v1/projects/${id}/export`, { format }),
};
