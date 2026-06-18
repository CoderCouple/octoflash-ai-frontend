/**
 * /playground — preset catalog + ad-hoc ManimGL render.
 *
 * Renders run synchronously on the backend (it returns when manimgl exits
 * or times out). The default backend mode is the hardened Docker sandbox;
 * a `dev-only` local mode is also available via PLAYGROUND_SANDBOX_MODE on
 * the backend. The frontend doesn't pick a mode — whatever the server is
 * configured for is what runs, and the response echoes it back via
 * `sandboxMode` so the UI can label the run.
 */

import { getRuntimeConfig } from "../config.js";
import { api } from "./client.js";

export type PlaygroundPreset = {
  id: string;
  label: string;
  duration: string;
  preview: string;
  code: string;
};

export type PlaygroundRenderInput = {
  code: string;
  sceneName?: string;
  quality?: "480p" | "720p" | "1080p" | "1440p" | "2160p";
};

export type PlaygroundRenderResult = {
  renderId: string;
  /** Server-relative path. Use `playgroundApi.absoluteVideoUrl(...)` for `<video src>`. */
  videoUrl: string;
  sceneClass: string;
  quality: string;
  tookMs: number;
  logLines: string[];
  sandboxMode: "docker" | "local";
};

export const playgroundApi = {
  /** Built-in scene presets — same list the FE dropdown shows. */
  listPresets: () => api.get<PlaygroundPreset[]>("/api/v1/playground/presets"),

  /** Submit code to ManimGL inside the configured sandbox. */
  render: (input: PlaygroundRenderInput) =>
    api.post<PlaygroundRenderResult>("/api/v1/playground/render", input),

  /** Turn the server-relative `videoUrl` into a fully-qualified URL the browser can fetch. */
  absoluteVideoUrl: (videoUrl: string): string => {
    const base = getRuntimeConfig().apiUrl.replace(/\/$/, "");
    return videoUrl.startsWith("http") ? videoUrl : `${base}${videoUrl}`;
  },
};
