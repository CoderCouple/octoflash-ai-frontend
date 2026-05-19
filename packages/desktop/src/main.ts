import { app, BrowserWindow, nativeTheme } from "electron";
import path from "node:path";
import { loadConfig } from "./config";
import { registerIpcHandlers } from "./ipc-handlers";
import { buildAppMenu } from "./menu";
import { initTray } from "./tray";
import { registerShortcuts, unregisterShortcuts } from "./shortcuts";
import { initUpdater } from "./updater";

const isDev = process.argv.includes("--dev") || !app.isPackaged;
let mainWindow: BrowserWindow | null = null;

function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 680,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#0a0a0a" : "#ffffff",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  win.once("ready-to-show", () => win.show());

  if (isDev) {
    win.loadURL("http://localhost:5173").catch((err) => {
      console.error("Failed to load Vite dev server:", err);
    });
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    // electron-builder copies packages/web/dist into resources/web-dist
    win.loadFile(path.join(process.resourcesPath, "web-dist", "index.html"));
  }

  win.on("closed", () => {
    if (mainWindow === win) mainWindow = null;
  });

  return win;
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

app.whenReady().then(() => {
  loadConfig();
  registerIpcHandlers();
  mainWindow = createMainWindow();
  buildAppMenu(mainWindow);
  initTray(() => mainWindow ?? createMainWindow());
  registerShortcuts(() => mainWindow ?? createMainWindow());
  initUpdater();

  app.on("activate", () => {
    if (!mainWindow) mainWindow = createMainWindow();
    else mainWindow.show();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => {
  unregisterShortcuts();
});
