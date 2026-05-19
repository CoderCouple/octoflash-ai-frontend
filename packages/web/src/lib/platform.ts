/**
 * Detects whether the app is running inside Electron and exposes a typed
 * bridge to the desktop preload script. In a plain browser, every method
 * resolves to a no-op so callers never have to branch on `isDesktop`.
 */

import type { DesktopBridge } from "@octoflash/core";

export const isDesktop =
  typeof window !== "undefined" && Boolean(window.octoflash);

function noop<T>(value: T): () => Promise<T> {
  return () => Promise.resolve(value);
}

const browserShim: DesktopBridge = {
  config: { apiUrl: "" },
  platform: "darwin",
  versions: { app: "web", electron: "", chrome: "", node: "" },
  project: {
    open: noop(null),
    save: () => Promise.resolve(),
    saveAs: noop(null),
    recent: noop([]),
  },
  render: { local: () => Promise.reject(new Error("local render is desktop-only")) },
  export: { reveal: () => Promise.resolve() },
  app: {
    openExternal: async (url) => {
      window.open(url, "_blank", "noopener,noreferrer");
    },
    setWindowTitle: (title) => {
      document.title = title;
    },
  },
  updater: {
    check: noop({ available: false }),
    download: () => Promise.resolve(),
    install: () => undefined,
  },
};

export const desktop: DesktopBridge =
  (typeof window !== "undefined" && (window.octoflash as unknown as DesktopBridge)) ||
  browserShim;
