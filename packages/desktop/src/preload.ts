import { contextBridge, ipcRenderer } from "electron";

const invoke = (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args);

// Mirror of packages/core/src/desktop-bridge.ts (DesktopBridge type).
// Keep these in sync — they are the contract between renderer and main.
const bridge = {
  config: ipcRenderer.sendSync("config:read") as { apiUrl: string },
  platform: process.platform,
  versions: {
    app: process.env.npm_package_version ?? "",
    electron: process.versions.electron ?? "",
    chrome: process.versions.chrome ?? "",
    node: process.versions.node ?? "",
  },

  project: {
    open: () => invoke("project:open"),
    save: (filePath: string, data: unknown) => invoke("project:save", filePath, data),
    saveAs: (data: unknown) => invoke("project:save-as", data),
    recent: () => invoke("project:recent"),
  },

  render: {
    local: (sceneId: string) => invoke("render:local", sceneId),
  },

  export: {
    reveal: (args: { path: string }) => invoke("export:reveal", args),
  },

  app: {
    openExternal: (url: string) => invoke("app:open-external", url),
    setWindowTitle: (title: string) => ipcRenderer.send("window:set-title", title),
  },

  updater: {
    check: () => invoke("updater:check"),
    download: () => invoke("updater:download"),
    install: () => ipcRenderer.send("updater:install"),
  },
};

contextBridge.exposeInMainWorld("octoflash", bridge);
