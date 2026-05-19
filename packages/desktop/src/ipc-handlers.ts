import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "./config";
import { paths } from "./paths";

type Recent = { id: string; title: string; path: string; openedAt: string };

function readRecents(): Recent[] {
  const f = paths.recentsFile();
  if (!fs.existsSync(f)) return [];
  try {
    return JSON.parse(fs.readFileSync(f, "utf8")) as Recent[];
  } catch {
    return [];
  }
}

function writeRecents(list: Recent[]): void {
  fs.writeFileSync(paths.recentsFile(), JSON.stringify(list.slice(0, 20), null, 2));
}

function pushRecent(entry: Recent): void {
  const others = readRecents().filter((r) => r.path !== entry.path);
  writeRecents([entry, ...others]);
}

export function registerIpcHandlers(): void {
  // Synchronous bootstrap read so preload can hand the config to the renderer
  // before the first paint.
  ipcMain.on("config:read", (event) => {
    event.returnValue = loadConfig();
  });

  ipcMain.handle("project:open", async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) ?? undefined;
    const result = await dialog.showOpenDialog(win!, {
      title: "Open project",
      defaultPath: paths.projects(),
      filters: [{ name: "Octoflash project", extensions: ["octoflash", "json"] }],
      properties: ["openFile"],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const filePath = result.filePaths[0];
    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw);
    pushRecent({
      id: data.id ?? path.basename(filePath, path.extname(filePath)),
      title: data.title ?? path.basename(filePath),
      path: filePath,
      openedAt: new Date().toISOString(),
    });
    return { path: filePath, data };
  });

  ipcMain.handle("project:save", async (_event, filePath: string, data: unknown) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  });

  ipcMain.handle("project:save-as", async (event, data: unknown) => {
    const win = BrowserWindow.fromWebContents(event.sender) ?? undefined;
    const result = await dialog.showSaveDialog(win!, {
      title: "Save project as",
      defaultPath: path.join(paths.projects(), "untitled.octoflash"),
      filters: [{ name: "Octoflash project", extensions: ["octoflash"] }],
    });
    if (result.canceled || !result.filePath) return null;
    fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2));
    return { path: result.filePath };
  });

  ipcMain.handle("project:recent", async () => readRecents());

  ipcMain.handle("render:local", async (_event, _sceneId: string) => {
    // TODO: spawn local manim/ffmpeg sidecar. Returns a jobId the renderer
    // can poll via the same FastAPI /jobs/{id} endpoint.
    throw new Error("local render not implemented");
  });

  ipcMain.handle("export:reveal", async (_event, args: { path: string }) => {
    shell.showItemInFolder(args.path);
  });

  ipcMain.handle("app:open-external", async (_event, url: string) => {
    await shell.openExternal(url);
  });

  ipcMain.on("window:set-title", (event, title: string) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.setTitle(title ? `${title} — Octoflash AI` : "Octoflash AI");
  });

  ipcMain.on("app:quit", () => app.quit());
}
