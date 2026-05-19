import { BrowserWindow, Menu, Tray, app, nativeImage } from "electron";
import path from "node:path";

let tray: Tray | null = null;

export function initTray(getWindow: () => BrowserWindow): void {
  // Placeholder icon. Replace with packages/desktop/assets/trayTemplate.png
  // (16×16 / 32×32, monochrome on macOS).
  const iconPath = path.join(__dirname, "..", "assets", "trayTemplate.png");
  let image = nativeImage.createFromPath(iconPath);
  if (image.isEmpty()) image = nativeImage.createEmpty();

  tray = new Tray(image);
  tray.setToolTip("Octoflash AI");

  const menu = Menu.buildFromTemplate([
    {
      label: "Show Octoflash",
      click: () => {
        const win = getWindow();
        if (win.isMinimized()) win.restore();
        win.show();
        win.focus();
      },
    },
    {
      label: "New project",
      click: () => getWindow().webContents.send("menu:new-project"),
    },
    { type: "separator" },
    { label: "Quit", click: () => app.quit() },
  ]);

  tray.setContextMenu(menu);
}

export function destroyTray(): void {
  tray?.destroy();
  tray = null;
}
