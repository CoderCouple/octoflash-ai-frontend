/**
 * Targets — user's output destinations (YouTube channels, TikTok accounts,
 * Instagram profiles, LinkedIn pages, X accounts) where generated videos
 * get published.
 *
 * OAuth blobs live server-side as encrypted credential rows; the FE never
 * sees them. The `hasCredential` flag is the FE's "is this account actually
 * connected?" signal. The connect flow uses
 *   GET /api/v1/targets/oauth/{platform}/authorize → returns authorize_url
 *   browser redirects to that URL → user consents → provider redirects to
 *   /oauth/callback/{platform} on the backend → 303 to FE
 *     {frontend_url}/targets?connected=<id>  on success
 *     {frontend_url}/targets?error=…&detail=…  on failure
 */

import { api } from "./client.js";
import type { Execution } from "./executions.js";

export type TargetPlatform =
  | "youtube"
  | "tiktok"
  | "instagram"
  | "linkedin"
  | "x";
export type TargetStatus = "active" | "disconnected" | "expired";

export type Target = {
  id: string;
  userId: string;
  platform: TargetPlatform;
  externalId: string | null;
  handle: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  status: TargetStatus;
  credentialId: string | null;
  hasCredential: boolean;
  connectedAt: string | null;
  disconnectedAt: string | null;
  lastSyncedAt: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateTargetInput = {
  platform: TargetPlatform;
  handle?: string | null;
  externalId?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  /** OAuth blob (JSON-serialised). Test/dev only — real flow is OAuth callback. */
  credentialValue?: string | null;
};

export type UpdateTargetInput = {
  handle?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  status?: TargetStatus;
  credentialId?: string | null;
  /** Rotates the OAuth blob or attaches one if none exists. */
  credentialValue?: string | null;
};

export type AuthorizeResponse = {
  authorizeUrl: string;
  state: string;
  redirectUri: string;
};

export type PublishTargetInput = {
  projectId: string;
  orientation: "portrait" | "landscape";
  title: string;
  description?: string;
  tags?: string[];
  /** YouTube: 'public' | 'unlisted' | 'private'. Other platforms ignore or remap. */
  privacy?: "public" | "unlisted" | "private";
  /** Platform-specific extras (YT categoryId, IG caption, ...) */
  extra?: Record<string, unknown>;
};

export const targetsApi = {
  list: (params?: { offset?: number; limit?: number; userId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.offset !== undefined) qs.set("offset", String(params.offset));
    if (params?.limit !== undefined) qs.set("limit", String(params.limit));
    if (params?.userId) qs.set("user_id", params.userId);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return api.get<{ items: Target[]; total: number; offset: number; limit: number }>(
      `/api/v1/targets${suffix}`,
    );
  },

  get: (targetId: string) => api.get<Target>(`/api/v1/targets/${targetId}`),

  create: (input: CreateTargetInput) => api.post<Target>("/api/v1/targets", input),

  update: (targetId: string, input: UpdateTargetInput) =>
    api.patch<Target>(`/api/v1/targets/${targetId}`, input),

  delete: (targetId: string) => api.del<void>(`/api/v1/targets/${targetId}`),

  /**
   * Build the OAuth authorize URL for this platform. The caller redirects
   * the browser to `authorizeUrl`; after consent the backend's
   * `/oauth/callback/{platform}` handler upserts the Target and 303s back
   * to `{frontend_url}/targets?connected=<id>` (or `?error=…`).
   *
   * Throws ApiError 501 if the platform's client_id/secret aren't set.
   */
  authorize: (platform: TargetPlatform) =>
    api.get<AuthorizeResponse>(
      `/api/v1/targets/oauth/${platform}/authorize`,
    ),

  /**
   * Publish the project's final render (for the chosen orientation) to
   * this target. Returns 202 with the Execution; poll via executionsApi.
   *
   * Throws 409 when the target lacks credentials / the project has no
   * final video. Throws 401 when the stored token can't refresh —
   * surface a "reconnect" CTA.
   */
  publish: (targetId: string, body: PublishTargetInput) =>
    api.post<Execution>(`/api/v1/targets/${targetId}/publish`, body),
};
