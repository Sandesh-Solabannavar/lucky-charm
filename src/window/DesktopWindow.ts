import { screen } from 'electron';
import * as path from 'node:path';
import { ElectronWindow } from '../electron/ElectronWindow';

export class DesktopWindow {
  private overlayInteractive = false;
  private displayId = '';
  private normalizedX = 0.85;
  private fullDesktopOverlay = false;
  private compactOverlaySize = { width: 420, height: 760 };

  constructor(
    private readonly electronWindow: ElectronWindow,
    private readonly onPositionChanged?: (displayId: string, normalizedX: number) => void,
    private readonly onVisibilityChanged?: (visible: boolean) => void,
  ) {}

  setInitialNormalizedX(value: number) {
    this.normalizedX = Math.max(0, Math.min(1, value));
  }

  setFullDesktopOverlay(enabled: boolean) {
    this.fullDesktopOverlay = enabled;
    const window = this.electronWindow.overlay();
    if (!window) return;
    const [x = 0, y = 0] = window.getPosition();
    this.applyBounds(window, screen.getDisplayNearestPoint({ x, y }));
  }

  setCompactOverlaySize(size: { width: number; height: number }) {
    this.compactOverlaySize = size;
    if (this.fullDesktopOverlay) return;
    const window = this.electronWindow.overlay();
    if (!window) return;
    const [x = 0, y = 0] = window.getPosition();
    this.applyBounds(window, screen.getDisplayNearestPoint({ x, y }));
  }

  getDisplayId() {
    return this.displayId;
  }

  createMain() {
    const display = screen.getPrimaryDisplay();
    this.displayId = String(display.id);
    const bounds = this.boundsForDisplay(display);

    const window = this.electronWindow.create({
      ...bounds,
      frame: false,
      transparent: true,
      resizable: false,
      movable: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      show: true,
      hasShadow: false,
      backgroundColor: '#00000000',
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
      },
    });

    void window.loadURL('about:blank');
    this.electronWindow.lockToLocalDocument(window);
    window.setIgnoreMouseEvents(true, { forward: true });
    window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    this.electronWindow.setOverlay(window);

    window.on('closed', () => {
      this.electronWindow.clearOverlay(window);
    });

    return window;
  }

  private applyBounds(window: Electron.BrowserWindow, display: Electron.Display) {
    this.displayId = String(display.id);
    window.setBounds(this.boundsForDisplay(display));
  }

  private boundsForDisplay(display: Electron.Display) {
    const { x: displayX, y: displayY, width, height } = display.workArea;
    if (this.fullDesktopOverlay) {
      return { x: displayX, y: displayY, width, height };
    }
    const overlayWidth = Math.min(this.compactOverlaySize.width, width);
    const overlayHeight = Math.min(this.compactOverlaySize.height, height);
    const minX = displayX + 20;
    const maxX = displayX + Math.max(20, width - overlayWidth - 20);
    return {
      width: overlayWidth,
      height: overlayHeight,
      x: Math.round(minX + (maxX - minX) * this.normalizedX),
      y: displayY,
    };
  }

  ensureMain() {
    return this.electronWindow.overlay() ?? this.createMain();
  }

  activate() {
    const window = this.ensureMain();
    this.electronWindow.reveal(window);
  }

  toggleMain() {
    const window = this.ensureMain();
    if (window.isVisible()) {
      window.hide();
      this.onVisibilityChanged?.(false);
      return;
    }

    this.electronWindow.reveal(window);
    this.onVisibilityChanged?.(true);
  }

  showMain() {
    const window = this.ensureMain();
    this.electronWindow.reveal(window);
    this.onVisibilityChanged?.(true);
  }

  hideMain() {
    const window = this.ensureMain();
    window.hide();
    this.onVisibilityChanged?.(false);
  }

  isMainVisible() {
    return this.ensureMain().isVisible();
  }

  moveMain(deltaX: number, deltaY: number) {
    const window = this.ensureMain();
    const [x = 0] = window.getPosition();
    const display = screen.getDisplayNearestPoint({ x, y: 1 });
    const { x: displayX, width } = display.workArea;
    const minX = displayX + 20;
    const maxX = displayX + Math.max(20, width - 420 - 20);
    const nextX = Math.max(minX, Math.min(maxX, x + deltaX));

    window.setPosition(nextX, display.workArea.y);

    const normalized = maxX === minX ? 0.5 : (nextX - minX) / (maxX - minX);
    this.normalizedX = Math.max(0, Math.min(1, normalized));
    this.displayId = String(display.id);
    this.onPositionChanged?.(this.displayId, this.normalizedX);
  }

  setOverlayInteractive(interactive: boolean) {
    const window = this.electronWindow.overlay();
    if (!window) return;
    if (this.overlayInteractive === interactive) return;
    this.overlayInteractive = interactive;
    window.setIgnoreMouseEvents(!interactive, { forward: true });
  }

  sendToMain(channel: string, payload?: unknown) {
    const window = this.electronWindow.overlay();
    if (!window) return;
    window.webContents.send(channel, payload);
  }
}
