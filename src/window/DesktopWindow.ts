import { screen } from 'electron';
import * as path from 'node:path';
import { ElectronWindow } from '../electron/ElectronWindow';

export class DesktopWindow {
  private overlayInteractive = false;
  private displayId = '';
  private normalizedX = 0.85;

  constructor(
    private readonly electronWindow: ElectronWindow,
    private readonly onPositionChanged?: (displayId: string, normalizedX: number) => void,
    private readonly onVisibilityChanged?: (visible: boolean) => void,
  ) {}

  setInitialNormalizedX(value: number) {
    this.normalizedX = Math.max(0, Math.min(1, value));
  }

  getDisplayId() {
    return this.displayId;
  }

  createMain() {
    const display = screen.getPrimaryDisplay();
    const { x: displayX, y: displayY, width } = display.workArea;
    this.displayId = String(display.id);
    const minX = displayX + 20;
    const maxX = displayX + Math.max(20, width - 420 - 20);
    const positionedX = Math.round(minX + (maxX - minX) * this.normalizedX);

    const window = this.electronWindow.create({
      width: 420,
      height: 760,
      x: positionedX,
      y: displayY + 12,
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
    window.setIgnoreMouseEvents(true, { forward: true });
    window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    this.electronWindow.setMain(window);

    window.on('closed', () => {
      this.electronWindow.clearMain(window);
    });

    return window;
  }

  ensureMain() {
    return this.electronWindow.currentMainOrFirst() ?? this.createMain();
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

    window.setPosition(nextX, display.workArea.y + 12);

    const normalized = maxX === minX ? 0.5 : (nextX - minX) / (maxX - minX);
    this.normalizedX = Math.max(0, Math.min(1, normalized));
    this.displayId = String(display.id);
    this.onPositionChanged?.(this.displayId, this.normalizedX);
  }

  setOverlayInteractive(interactive: boolean) {
    const window = this.electronWindow.currentMainOrFirst();
    if (!window) return;
    if (this.overlayInteractive === interactive) return;
    this.overlayInteractive = interactive;
    window.setIgnoreMouseEvents(!interactive, { forward: true });
  }

  sendToMain(channel: string, payload?: unknown) {
    const window = this.electronWindow.currentMainOrFirst();
    if (!window) return;
    window.webContents.send(channel, payload);
  }
}
