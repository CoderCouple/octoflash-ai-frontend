import { BrowserWindow } from "electron";

/**
 * Multi-window helpers — placeholder. Today the app is single-window.
 * When we add detached preview windows or a project picker, the open/close
 * lifecycle goes here.
 */

const windows = new Set<BrowserWindow>();

export function track(win: BrowserWindow): void {
  windows.add(win);
  win.on("closed", () => windows.delete(win));
}

export function all(): BrowserWindow[] {
  return [...windows];
}
