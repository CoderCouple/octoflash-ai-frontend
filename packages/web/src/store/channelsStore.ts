/**
 * Channels — list + open + create-from-URL + sync.
 *
 * Channels are owned per-channel: `videosById[channelId]` holds the currently-
 * loaded videos, keyed by id. The store always loads the FULL recent video
 * set; consumers filter by kind in their selectors.
 *
 * Sync is a synchronous backend call (1–30s). We expose `syncing` so the UI
 * can show a spinner. No Temporal job polling — channels don't go through
 * the workflow runner.
 */

import { create } from "zustand";

import {
  channelsApi,
  type Channel,
  type ChannelDetail,
  type ChannelVideo,
  type CreateChannelInput,
} from "@octoflash/core";

interface ChannelsState {
  channels: Channel[];
  currentChannel: ChannelDetail | null;
  videosById: Record<string, ChannelVideo[]>;
  loading: boolean;
  syncing: boolean;
  error: string | null;
}

interface ChannelsActions {
  // ─── list ──────────────────────────────────────────────────────────────
  loadChannels(): Promise<void>;

  // ─── detail / open ─────────────────────────────────────────────────────
  openChannel(channelId: string): Promise<ChannelDetail>;

  // ─── paste URL → create + load videos ──────────────────────────────────
  /**
   * Paste a channel URL, persist metadata, then trigger a video sync and
   * navigate the store's `currentChannel` to the new one. Returns the
   * created/updated Channel.
   */
  createAndSync(input: CreateChannelInput, opts?: { maxVideos?: number }): Promise<Channel>;

  // ─── manual refresh ────────────────────────────────────────────────────
  refresh(channelId: string, opts?: { maxVideos?: number }): Promise<number>;

  // ─── videos (with optional kind filter via selector) ───────────────────
  loadVideos(channelId: string): Promise<ChannelVideo[]>;

  deleteChannel(channelId: string): Promise<void>;
}

export const useChannelsStore = create<ChannelsState & ChannelsActions>(
  (set, get) => ({
    channels: [],
    currentChannel: null,
    videosById: {},
    loading: false,
    syncing: false,
    error: null,

    async loadChannels() {
      set({ loading: true, error: null });
      try {
        const page = await channelsApi.list({ limit: 100 });
        set({ channels: page.items, loading: false });
      } catch (e) {
        set({ loading: false, error: (e as Error).message });
        throw e;
      }
    },

    async openChannel(channelId) {
      set({ loading: true, error: null });
      try {
        const detail = await channelsApi.get(channelId);
        set((s) => ({
          currentChannel: detail,
          videosById: { ...s.videosById, [channelId]: detail.videos },
          loading: false,
        }));
        return detail;
      } catch (e) {
        set({ loading: false, error: (e as Error).message });
        throw e;
      }
    },

    async createAndSync(input, opts) {
      set({ syncing: true, error: null });
      try {
        const channel = await channelsApi.create(input);
        // Update the channels list (insert at top, or replace if existing).
        set((s) => {
          const without = s.channels.filter((c) => c.id !== channel.id);
          return { channels: [channel, ...without] };
        });

        // Kick a video sync. This is sync on the backend — ~1–30s.
        await channelsApi.sync(channel.id, opts);

        // Re-load the channel detail so currentChannel has the fresh videos.
        const detail = await channelsApi.get(channel.id);
        set((s) => ({
          currentChannel: detail,
          videosById: { ...s.videosById, [channel.id]: detail.videos },
          syncing: false,
        }));
        return channel;
      } catch (e) {
        set({ syncing: false, error: (e as Error).message });
        throw e;
      }
    },

    async refresh(channelId, opts) {
      set({ syncing: true, error: null });
      try {
        const { videosUpserted } = await channelsApi.sync(channelId, opts);
        // Re-pull the full video list after the sync.
        const detail = await channelsApi.get(channelId);
        set((s) => ({
          currentChannel:
            s.currentChannel?.id === channelId ? detail : s.currentChannel,
          videosById: { ...s.videosById, [channelId]: detail.videos },
          syncing: false,
        }));
        return videosUpserted;
      } catch (e) {
        set({ syncing: false, error: (e as Error).message });
        throw e;
      }
    },

    async loadVideos(channelId) {
      // Pull a wider page than the detail endpoint embeds (which caps at 100).
      const page = await channelsApi.listVideos(channelId, { limit: 500 });
      set((s) => ({
        videosById: { ...s.videosById, [channelId]: page.items },
      }));
      return page.items;
    },

    async deleteChannel(channelId) {
      await channelsApi.delete(channelId);
      set((s) => ({
        channels: s.channels.filter((c) => c.id !== channelId),
        currentChannel: s.currentChannel?.id === channelId ? null : s.currentChannel,
        videosById: Object.fromEntries(
          Object.entries(s.videosById).filter(([k]) => k !== channelId),
        ),
      }));
    },
  }),
);
