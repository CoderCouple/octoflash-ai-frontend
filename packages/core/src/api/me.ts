/**
 * `/me` — current user profile + active tenancy context + preferences.
 *
 *   GET   /api/v1/me              → user + active org/workspace/role
 *                                   (`user.preferences` is included inline)
 *   PATCH /api/v1/me              → update display_name + avatar_url
 *                                   (email is Cognito-owned; not settable here)
 *   PUT   /api/v1/me/context      → switch active org / workspace
 *   PATCH /api/v1/me/preferences  → sparse partial update of preferences blob
 *                                   (only present keys written; `null` clears)
 *
 * Preferences shape is the backend's `UserPreferences` Pydantic model —
 * keep this `UserPreferences` type in lockstep with it. Adding a new pref
 * is a one-line edit on both sides; no DB migration required.
 */

import { api } from "./client.js";

import type { Orientation } from "./projects.js";

export type UserPreferences = {
  defaultOrientation?: Orientation | null;
  defaultVoiceId?: string | null;
  // Add new preferences here.
};

export type Me = {
  id: string;
  cognitoSub: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  defaultOrgId: string | null;
  defaultWorkspaceId: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  preferences: UserPreferences;
};

export type MeContext = {
  user: Me;
  organizationId: string | null;
  workspaceId: string | null;
  role: string | null;
};

export type UpdateProfileInput = {
  displayName?: string | null;
  avatarUrl?: string | null;
};

export type SwitchContextInput = {
  organizationId?: string | null;
  workspaceId?: string | null;
};

/** Partial preferences update. Omit a key to leave it untouched; set to
 *  `null` to clear it. Mirrors the backend `UpdatePreferencesRequest`. */
export type UpdatePreferencesInput = Partial<UserPreferences>;

export const meApi = {
  get: () => api.get<MeContext>("/api/v1/me"),
  update: (body: UpdateProfileInput) => api.patch<Me>("/api/v1/me", body),
  switchContext: (body: SwitchContextInput) =>
    api.put<Me>("/api/v1/me/context", body),
  updatePreferences: (body: UpdatePreferencesInput) =>
    api.patch<UserPreferences>("/api/v1/me/preferences", body),
};
