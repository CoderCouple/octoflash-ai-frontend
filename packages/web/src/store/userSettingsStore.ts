/**
 * Local user-settings store — persisted to localStorage so name, avatar, and
 * default render preferences survive reloads.
 *
 * v1: client-only. When the backend grows a PATCH /me + per-user
 * preferences endpoint, swap the setters here to also call the API; the
 * shape stays the same so consumers don't break.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Orientation } from "@octoflash/core";

interface UserSettingsState {
  displayName: string;
  email: string;
  avatarUrl: string;

  // Default rendering preferences — pre-fill new project forms with these.
  defaultOrientation: Orientation;
  defaultVoiceId: string;
}

interface UserSettingsActions {
  setDisplayName(name: string): void;
  setEmail(email: string): void;
  setAvatarUrl(url: string): void;
  setDefaultOrientation(o: Orientation): void;
  setDefaultVoiceId(id: string): void;
  reset(): void;
}

const INITIAL: UserSettingsState = {
  displayName: "Jamie Strand",
  email: "jamie@octoflash.ai",
  avatarUrl: "",
  defaultOrientation: "portrait",
  defaultVoiceId: "",
};

export const useUserSettingsStore = create<UserSettingsState & UserSettingsActions>()(
  persist(
    (set) => ({
      ...INITIAL,
      setDisplayName: (displayName) => set({ displayName }),
      setEmail: (email) => set({ email }),
      setAvatarUrl: (avatarUrl) => set({ avatarUrl }),
      setDefaultOrientation: (defaultOrientation) => set({ defaultOrientation }),
      setDefaultVoiceId: (defaultVoiceId) => set({ defaultVoiceId }),
      reset: () => set(INITIAL),
    }),
    {
      name: "octoflash.user-settings",
      version: 1,
    },
  ),
);
