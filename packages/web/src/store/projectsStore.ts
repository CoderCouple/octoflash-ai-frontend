/**
 * Projects + scenes for the editor.
 *
 * Owns:
 *   - the list of projects (sidebar)
 *   - the currently-open project's detail (project + scenes + workflow)
 *   - basic CRUD that mutates both
 *
 * Job polling (variation render, preview, export) is intentionally NOT in
 * this store — it lives in its own `jobsStore.ts` because polling lifecycle
 * differs from CRUD lifecycle. Components combine the two as needed.
 */

import { create } from "zustand";

import {
  projectsApi,
  scenesApi,
  type CreateProjectInput,
  type CreateSceneInput,
  type Project,
  type ProjectDetail,
  type SceneResponse,
  type UpdateProjectInput,
  type UpdateSceneInput,
} from "@octoflash/core";

interface ProjectsState {
  projects: Project[];
  currentProject: ProjectDetail | null;
  loading: boolean;
  error: string | null;
}

interface ProjectsActions {
  // ─── List ──────────────────────────────────────────────────────────────
  loadProjects(): Promise<void>;

  // ─── Single project ────────────────────────────────────────────────────
  openProject(id: string): Promise<ProjectDetail>;
  createProject(input: CreateProjectInput): Promise<Project>;
  renameCurrent(title: string): Promise<void>;
  deleteProject(id: string): Promise<void>;

  // ─── Scenes within currentProject ──────────────────────────────────────
  addScene(input: CreateSceneInput): Promise<SceneResponse>;
  patchScene(sceneId: string, patch: UpdateSceneInput, force?: boolean): Promise<SceneResponse>;
  removeScene(sceneId: string): Promise<void>;
  selectVariation(sceneId: string, variationId: string): Promise<SceneResponse>;
}

export const useProjectsStore = create<ProjectsState & ProjectsActions>(
  (set, get) => ({
    projects: [],
    currentProject: null,
    loading: false,
    error: null,

    // ─── List ────────────────────────────────────────────────────────────
    async loadProjects() {
      set({ loading: true, error: null });
      try {
        const page = await projectsApi.list({ limit: 100 });
        set({ projects: page.items, loading: false });
      } catch (e) {
        set({ loading: false, error: (e as Error).message });
        throw e;
      }
    },

    // ─── Single project ──────────────────────────────────────────────────
    async openProject(id) {
      set({ loading: true, error: null });
      try {
        const detail = await projectsApi.get(id);
        set({ currentProject: detail, loading: false });
        return detail;
      } catch (e) {
        set({ loading: false, error: (e as Error).message });
        throw e;
      }
    },

    async createProject(input) {
      const created = await projectsApi.create(input);
      set((s) => ({ projects: [created, ...s.projects] }));
      return created;
    },

    async renameCurrent(title) {
      const cur = get().currentProject;
      if (!cur) return;
      const updated = await projectsApi.patch(cur.id, { title } as UpdateProjectInput);
      set((s) => ({
        projects: s.projects.map((p) => (p.id === updated.id ? updated : p)),
        currentProject: s.currentProject
          ? { ...s.currentProject, ...updated }
          : null,
      }));
    },

    async deleteProject(id) {
      await projectsApi.delete(id);
      set((s) => ({
        projects: s.projects.filter((p) => p.id !== id),
        currentProject: s.currentProject?.id === id ? null : s.currentProject,
      }));
    },

    // ─── Scenes within currentProject ────────────────────────────────────
    async addScene(input) {
      const cur = get().currentProject;
      if (!cur) throw new Error("addScene: no currentProject open");
      const scene = await scenesApi.create(cur.id, input);
      set((s) => ({
        currentProject: s.currentProject
          ? { ...s.currentProject, scenes: [...s.currentProject.scenes, scene] }
          : null,
      }));
      return scene;
    },

    async patchScene(sceneId, patch, force) {
      const updated = await scenesApi.patch(sceneId, patch, { force });
      set((s) => ({
        currentProject: s.currentProject
          ? {
              ...s.currentProject,
              scenes: s.currentProject.scenes.map((sc) =>
                sc.id === sceneId ? updated : sc,
              ),
            }
          : null,
      }));
      return updated;
    },

    async removeScene(sceneId) {
      await scenesApi.delete(sceneId);
      set((s) => ({
        currentProject: s.currentProject
          ? {
              ...s.currentProject,
              scenes: s.currentProject.scenes.filter((sc) => sc.id !== sceneId),
            }
          : null,
      }));
    },

    async selectVariation(sceneId, variationId) {
      const updated = await scenesApi.selectVariation(sceneId, variationId);
      set((s) => ({
        currentProject: s.currentProject
          ? {
              ...s.currentProject,
              scenes: s.currentProject.scenes.map((sc) =>
                sc.id === sceneId ? updated : sc,
              ),
            }
          : null,
      }));
      return updated;
    },
  }),
);
