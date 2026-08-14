import type { BrowserWindow } from 'electron';
import { screen } from 'electron';
import * as path from 'node:path';
import { ElectronWindow } from '../electron/ElectronWindow';

export class DesktopGalleryWindow {
  private window: BrowserWindow | null = null;

  constructor(
    private readonly electronWindow: ElectronWindow,
    private readonly getInitialBounds: () => { x: number; y: number; width: number; height: number } | null,
    private readonly onBoundsChanged: (bounds: { x: number; y: number; width: number; height: number }) => void,
    private readonly onOpenChanged?: (open: boolean) => void,
  ) {}

  ensure() {
    if (this.window && !this.window.isDestroyed()) {
      return this.window;
    }

    const display = screen.getPrimaryDisplay();
    const fallbackWidth = 1000;
    const fallbackHeight = 700;
    const fallbackX = display.workArea.x + Math.max(20, Math.round((display.workArea.width - fallbackWidth) / 2));
    const fallbackY = display.workArea.y + Math.max(20, Math.round((display.workArea.height - fallbackHeight) / 2));
    const saved = this.getInitialBounds();

    this.window = this.electronWindow.create({
      x: saved?.x ?? fallbackX,
      y: saved?.y ?? fallbackY,
      width: saved?.width ?? fallbackWidth,
      height: saved?.height ?? fallbackHeight,
      minWidth: 820,
      minHeight: 560,
      show: false,
      frame: true,
      transparent: false,
      backgroundColor: '#11151f',
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        additionalArguments: ['--window=gallery'],
      },
    });

    void this.window.loadURL('about:blank');

    this.window.on('resize', () => {
      if (!this.window || this.window.isDestroyed()) return;
      const [x = 0, y = 0] = this.window.getPosition();
      const [width = 1000, height = 700] = this.window.getSize();
      this.onBoundsChanged({ x, y, width, height });
    });

    this.window.on('move', () => {
      if (!this.window || this.window.isDestroyed()) return;
      const [x = 0, y = 0] = this.window.getPosition();
      const [width = 1000, height = 700] = this.window.getSize();
      this.onBoundsChanged({ x, y, width, height });
    });

    this.window.on('closed', () => {
      this.onOpenChanged?.(false);
      this.window = null;
    });

    return this.window;
  }

  open(tab: 'gallery' | 'general' | 'about' = 'gallery') {
    const window = this.ensure();
    window.show();
    window.focus();
    this.onOpenChanged?.(true);
    window.webContents.send('gallery-tab', tab);
  }

  close() {
    this.window?.close();
  }

  send(channel: string, payload?: unknown) {
    this.window?.webContents.send(channel, payload);
  }
}
