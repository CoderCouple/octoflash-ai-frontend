/**
 * Sources — paste a video-source URL (currently a YouTube channel), get back
 * metadata + a slice of recent videos.
 *
 * The backend de-dupes by (platform, external_id), so re-pasting the same URL
 * refreshes metadata and returns the existing row.
 *
 * Video sync is a separate call (~1–10s). Once synced, videos are persisted
 * server-side; clients filter by `kind` (short / landscape).
 */

import { api } from "./client.js";

export type SourceVideoKind = "short" | "landscape";

export type Source = {
  id: string;
  userId: string;
  platform: string;
  sourceUrl: string;
  externalId: string | null;
  handle: string | null;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  subscriberCount: number | null;
  accentColor: string | null;
  lastSyncedAt: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SourceVideo = {
  id: string;
  sourceId: string;
  externalId: string;
  sourceUrl: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  kind: SourceVideoKind;
  durationSeconds: number | null;
  viewCount: number | null;
  publishedAt: string | null;
  fetchedAt: string;
  createdAt: string;
};

export type SourceDetail = Source & {
  videos: SourceVideo[];
};

export type CreateSourceInput = {
  sourceUrl: string;
};

export const sourcesApi = {
  /** Paste a URL → resolve metadata → persist (or de-dupe). ~1–3s. */
  create: (input: CreateSourceInput) =>
    api.post<Source>("/api/v1/sources", input),

  list: (params?: { offset?: number; limit?: number; userId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.offset !== undefined) qs.set("offset", String(params.offset));
    if (params?.limit !== undefined) qs.set("limit", String(params.limit));
    if (params?.userId) qs.set("user_id", params.userId);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return api.get<{ items: Source[]; total: number; offset: number; limit: number }>(
      `/api/v1/sources${suffix}`,
    );
  },

  /** Source + embedded recent videos (capped at `videoLimit`, default 50). */
  get: (sourceId: string, params?: { videoLimit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.videoLimit !== undefined) qs.set("video_limit", String(params.videoLimit));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return api.get<SourceDetail>(`/api/v1/sources/${sourceId}${suffix}`);
  },

  /** Re-fetch recent videos from the upstream platform. Sync; ~1–30s. */
  sync: (sourceId: string) =>
    api.post<void>(`/api/v1/sources/${sourceId}/sync`, {}),

  delete: (sourceId: string) =>
    api.del<void>(`/api/v1/sources/${sourceId}`),
};
