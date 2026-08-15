import type { BrowserWindow } from 'electron';
import { screen } from 'electron';
import * as path from 'node:path';
import { ElectronWindow } from '../electron/ElectronWindow';

export class DesktopGalleryWindow {
  private window: BrowserWindow | null = null;
  private boundsPersistTimer: NodeJS.Timeout | null = null;

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
    const saved = this.reconcileBounds(this.getInitialBounds());

    const isMac = process.platform === 'darwin';
    const titleBarOptions = isMac
      ? {
        titleBarStyle: 'hiddenInset' as const,
        trafficLightPosition: { x: 16, y: 18 },
      }
      : {
        titleBarStyle: 'hidden' as const,
        titleBarOverlay: {
          color: '#0f1424',
          symbolColor: '#f1f5f9',
          height: 52,
        },
      };

    this.window = this.electronWindow.create({
      x: saved?.x ?? fallbackX,
      y: saved?.y ?? fallbackY,
      width: saved?.width ?? fallbackWidth,
      height: saved?.height ?? fallbackHeight,
      minWidth: 820,
      minHeight: 560,
      show: false,
      backgroundColor: '#0b0f19',
      autoHideMenuBar: true,
      ...titleBarOptions,
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        additionalArguments: ['--window=gallery'],
      },
    });

    void this.window.loadURL('about:blank');
    this.electronWindow.lockToLocalDocument(this.window);

    const scheduleBoundsPersist = () => {
      if (this.boundsPersistTimer) {
        clearTimeout(this.boundsPersistTimer);
      }
      this.boundsPersistTimer = setTimeout(() => {
        this.boundsPersistTimer = null;
        this.persistCurrentBounds();
      }, 250);
    };

    this.window.on('resize', scheduleBoundsPersist);
    this.window.on('move', scheduleBoundsPersist);

    this.window.on('close', () => {
      if (this.boundsPersistTimer) {
        clearTimeout(this.boundsPersistTimer);
        this.boundsPersistTimer = null;
      }
      this.persistCurrentBounds();
    });

    this.window.on('closed', () => {
      this.onOpenChanged?.(false);
      this.window = null;
    });

    return this.window;
  }

  private persistCurrentBounds() {
    if (!this.window || this.window.isDestroyed()) return;
    const [x = 0, y = 0] = this.window.getPosition();
    const [width = 1000, height = 700] = this.window.getSize();
    this.onBoundsChanged({ x, y, width, height });
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

  private reconcileBounds(bounds: { x: number; y: number; width: number; height: number } | null) {
    if (!bounds) return null;
    const display = screen.getDisplayNearestPoint({
      x: Math.round(bounds.x + bounds.width / 2),
      y: Math.round(bounds.y + bounds.height / 2),
    });
    const area = display.workArea;
    const width = Math.min(bounds.width, area.width);
    const height = Math.min(bounds.height, area.height);
    return {
      width,
      height,
      x: Math.max(area.x, Math.min(bounds.x, area.x + area.width - width)),
      y: Math.max(area.y, Math.min(bounds.y, area.y + area.height - height)),
    };
  }
}
