import { BrowserWindow } from 'electron';
import type { BrowserWindowConstructorOptions } from 'electron';

export class ElectronWindow {
  private mainWindow: BrowserWindow | null = null;

  create(options: BrowserWindowConstructorOptions) {
    return new BrowserWindow(options);
  }

  setMain(window: BrowserWindow) {
    this.mainWindow = window;
  }

  clearMain(window: BrowserWindow) {
    if (this.mainWindow === window) {
      this.mainWindow = null;
    }
  }

  main() {
    return this.mainWindow;
  }

  currentMainOrFirst() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      return this.mainWindow;
    }

    const first = BrowserWindow.getAllWindows()[0];
    return first && !first.isDestroyed() ? first : null;
  }

  reveal(window: BrowserWindow) {
    if (window.isDestroyed()) return;
    if (window.isMinimized()) window.restore();
    if (!window.isVisible()) window.show();
    window.focus();
  }

  sendAll(channel: string, ...args: unknown[]) {
    for (const window of BrowserWindow.getAllWindows()) {
      if (window.isDestroyed()) continue;
      window.webContents.send(channel, ...args);
    }
  }

  destroyAll() {
    for (const window of BrowserWindow.getAllWindows()) {
      window.destroy();
    }
  }
}
