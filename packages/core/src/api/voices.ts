/**
 * Voices catalog — curated ElevenLabs voices the user can pick from.
 *
 * The catalog is server-side static (no DB) so the response shape is plain.
 * Each voice has gender + accent metadata for UI grouping/filtering.
 *
 *   GET /api/v1/voices              → full catalog (or filtered by query params)
 *   GET /api/v1/voices/accents      → distinct accent values
 */

import { api } from "./client.js";

export type Voice = {
  id: string;
  name: string;
  gender: "male" | "female";
  accent: string; // "British" | "American" | "Australian" | ...
  blurb: string;
};

export const voicesApi = {
  /** Full catalog with optional server-side filters. */
  list: (params?: { gender?: string; accent?: string }) => {
    const qs = new URLSearchParams();
    if (params?.gender) qs.set("gender", params.gender);
    if (params?.accent) qs.set("accent", params.accent);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return api.get<Voice[]>(`/api/v1/voices${suffix}`);
  },

  /** Distinct accent values — drives the UI accent grouping. */
  listAccents: () => api.get<string[]>("/api/v1/voices/accents"),
};
