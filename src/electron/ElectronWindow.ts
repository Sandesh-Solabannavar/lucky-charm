import { BrowserWindow } from 'electron';
import type { BrowserWindowConstructorOptions } from 'electron';

export class ElectronWindow {
  private overlayWindow: BrowserWindow | null = null;

  create(options: BrowserWindowConstructorOptions) {
    return new BrowserWindow(options);
  }

  setOverlay(window: BrowserWindow) {
    this.overlayWindow = window;
  }

  clearOverlay(window: BrowserWindow) {
    if (this.overlayWindow === window) {
      this.overlayWindow = null;
    }
  }

  overlay() {
    return this.overlayWindow && !this.overlayWindow.isDestroyed()
      ? this.overlayWindow
      : null;
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
