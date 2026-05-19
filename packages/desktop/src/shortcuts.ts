import { BrowserWindow, globalShortcut } from "electron";

export function registerShortcuts(getWindow: () => BrowserWindow): void {
  // Cmd/Ctrl+Shift+O — show/hide the main window from anywhere.
  globalShortcut.register("CommandOrControl+Shift+O", () => {
    const win = getWindow();
    if (win.isVisible() && win.isFocused()) win.hide();
    else {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    }
  });
}

export function unregisterShortcuts(): void {
  globalShortcut.unregisterAll();
}
