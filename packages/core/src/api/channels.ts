/**
 * Channels — paste a YouTube URL, get back channel metadata + videos.
 *
 * The backend de-dupes by (platform, external_id), so re-pasting the same
 * channel refreshes its metadata and returns the existing row.
 *
 * Video sync is a separate sync call (~1–10s). Once synced, the videos are
 * persisted in the DB; clients filter by `kind` (short / landscape).
 */

import { api } from "./client.js";

export type ChannelVideoKind = "short" | "landscape";

export type Channel = {
  id: string;
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
  ownerId: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ChannelVideo = {
  id: string;
  channelId: string;
  externalId: string;
  sourceUrl: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  kind: ChannelVideoKind;
  durationSeconds: number | null;
  viewCount: number | null;
  publishedAt: string | null;
  fetchedAt: string;
  createdAt: string;
};

export type ChannelDetail = Channel & {
  videos: ChannelVideo[];
};

export type CreateChannelInput = {
  sourceUrl: string;
};

export type SyncChannelResult = {
  channelId: string;
  videosUpserted: number;
};

export const channelsApi = {
  /** Paste a YouTube URL → resolve metadata → persist (or de-dupe). ~1–3s. */
  create: (input: CreateChannelInput) =>
    api.post<Channel>("/api/v1/channels", input),

  list: (params?: { offset?: number; limit?: number; ownerId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.offset !== undefined) qs.set("offset", String(params.offset));
    if (params?.limit !== undefined) qs.set("limit", String(params.limit));
    if (params?.ownerId) qs.set("owner_id", params.ownerId);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return api.get<{ items: Channel[]; total: number; offset: number; limit: number }>(
      `/api/v1/channels${suffix}`,
    );
  },

  get: (channelId: string) =>
    api.get<ChannelDetail>(`/api/v1/channels/${channelId}`),

  /** Re-fetch recent videos from YouTube. Sync — request holds for ~1–30s. */
  sync: (channelId: string, opts?: { maxVideos?: number }) =>
    api.post<SyncChannelResult>(`/api/v1/channels/${channelId}/sync`, {
      maxVideos: opts?.maxVideos ?? null,
    }),

  listVideos: (
    channelId: string,
    params?: { kind?: ChannelVideoKind; offset?: number; limit?: number },
  ) => {
    const qs = new URLSearchParams();
    if (params?.kind) qs.set("kind", params.kind);
    if (params?.offset !== undefined) qs.set("offset", String(params.offset));
    if (params?.limit !== undefined) qs.set("limit", String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return api.get<{
      items: ChannelVideo[];
      total: number;
      offset: number;
      limit: number;
    }>(`/api/v1/channels/${channelId}/videos${suffix}`);
  },

  delete: (channelId: string) =>
    api.del<void>(`/api/v1/channels/${channelId}`),
};
