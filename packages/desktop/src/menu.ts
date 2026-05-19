import { app, BrowserWindow, Menu, shell, type MenuItemConstructorOptions } from "electron";

const isMac = process.platform === "darwin";

function send(win: BrowserWindow | null, channel: string, ...args: unknown[]) {
  win?.webContents.send(channel, ...args);
}

export function buildAppMenu(getWindow: BrowserWindow | null | (() => BrowserWindow | null)): void {
  const resolveWin = () =>
    typeof getWindow === "function" ? getWindow() : getWindow;

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" as const },
              { type: "separator" as const },
              { role: "services" as const },
              { type: "separator" as const },
              { role: "hide" as const },
              { role: "hideOthers" as const },
              { role: "unhide" as const },
              { type: "separator" as const },
              { role: "quit" as const },
            ],
          },
        ]
      : []),
    {
      label: "File",
      submenu: [
        {
          label: "New project",
          accelerator: "CmdOrCtrl+N",
          click: () => send(resolveWin(), "menu:new-project"),
        },
        {
          label: "Open project…",
          accelerator: "CmdOrCtrl+O",
          click: () => send(resolveWin(), "menu:open-project"),
        },
        { type: "separator" },
        {
          label: "Save",
          accelerator: "CmdOrCtrl+S",
          click: () => send(resolveWin(), "menu:save"),
        },
        {
          label: "Save as…",
          accelerator: "CmdOrCtrl+Shift+S",
          click: () => send(resolveWin(), "menu:save-as"),
        },
        { type: "separator" },
        {
          label: "Export…",
          accelerator: "CmdOrCtrl+E",
          click: () => send(resolveWin(), "menu:export"),
        },
        ...(isMac
          ? []
          : [{ type: "separator" as const }, { role: "quit" as const }]),
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        ...(isMac ? [{ role: "pasteAndMatchStyle" as const }] : []),
        { role: "delete" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Toggle command menu",
          accelerator: "CmdOrCtrl+K",
          click: () => send(resolveWin(), "menu:command-palette"),
        },
        { type: "separator" },
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        ...(isMac
          ? [
              { type: "separator" as const },
              { role: "front" as const },
              { type: "separator" as const },
              { role: "window" as const },
            ]
          : [{ role: "close" as const }]),
      ],
    },
    {
      role: "help",
      submenu: [
        {
          label: "Octoflash docs",
          click: () => shell.openExternal("https://github.com/CoderCouple/octoflash-ai"),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
