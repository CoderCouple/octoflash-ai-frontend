import { ipcMain } from "electron";
import { autoUpdater } from "electron-updater";
import { loadConfig } from "./config";

/**
 * Wires electron-updater. The release host is intentionally not configured
 * here — set it via `publish:` in electron-builder.yml when ready (GitHub
 * Releases, S3, generic feed). Until then, `check` resolves to no update.
 */
export function initUpdater(): void {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  ipcMain.handle("updater:check", async () => {
    if (!loadConfig().autoUpdate) return { available: false };
    try {
      const r = await autoUpdater.checkForUpdates();
      return {
        available: Boolean(r?.updateInfo?.version),
        version: r?.updateInfo?.version,
      };
    } catch {
      return { available: false };
    }
  });

  ipcMain.handle("updater:download", async () => {
    await autoUpdater.downloadUpdate();
  });

  ipcMain.on("updater:install", () => {
    autoUpdater.quitAndInstall();
  });
}
