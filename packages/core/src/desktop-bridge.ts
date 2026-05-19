/**
 * Type contract for the Electron preload bridge.
 *
 * The desktop process exposes this object on `window.octoflash` via
 * `contextBridge.exposeInMainWorld`. Web code reads it through
 * `lib/platform.ts` in @octoflash/web, which returns a no-op shim when
 * `window.octoflash` is undefined (i.e. running in a normal browser).
 *
 * Add a new channel here AND in packages/desktop/src/ipc-handlers.ts.
 */

import type { RuntimeConfig } from "./config.js";

export type RecentProject = {
  id: string;
  title: string;
  path: string;
  openedAt: string;
};

export type ExportRevealArgs = {
  path: string;
};

export type DesktopBridge = {
  /** Read at startup; populated by the main process. */
  config: RuntimeConfig;
  platform: "darwin" | "win32" | "linux";
  /** App + electron version strings. */
  versions: { app: string; electron: string; chrome: string; node: string };

  project: {
    open: () => Promise<{ path: string; data: unknown } | null>;
    save: (path: string, data: unknown) => Promise<void>;
    saveAs: (data: unknown) => Promise<{ path: string } | null>;
    recent: () => Promise<RecentProject[]>;
  };

  render: {
    local: (sceneId: string) => Promise<{ jobId: string }>;
  };

  export: {
    reveal: (args: ExportRevealArgs) => Promise<void>;
  };

  app: {
    openExternal: (url: string) => Promise<void>;
    setWindowTitle: (title: string) => void;
  };

  updater: {
    check: () => Promise<{ available: boolean; version?: string }>;
    download: () => Promise<void>;
    install: () => void;
  };
};
