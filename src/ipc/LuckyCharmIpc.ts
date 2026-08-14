import { ipcMain } from 'electron';
import { LuckyCharmApp } from '../app/LuckyCharmApp';
import { DesktopCommands } from '../app/DesktopCommands';
import { ElectronApp } from '../electron/ElectronApp';
import { DesktopSettingsStore } from '../settings/DesktopSettingsStore';

export class LuckyCharmIpc {
  constructor(
    private app: LuckyCharmApp,
    private electronApp: ElectronApp,
    private readonly commands: DesktopCommands,
    private readonly settingsStore: DesktopSettingsStore,
  ) {}

  install() {
    ipcMain.handle('get-charms', () => this.app.getAll());

    ipcMain.handle('select-charm', (_event, charmId: string) => {
      return this.commands.selectCharm(charmId);
    });

    ipcMain.handle('toggle-window', () => {
      return this.commands.toggleCharm();
    });

    ipcMain.handle('toggle-gallery', () => {
      return this.commands.toggleGallery();
    });

    ipcMain.handle('set-gallery-open', (_event, open: boolean) => {
      return this.commands.setGalleryOpen(Boolean(open));
    });

    ipcMain.handle('trigger-ritual', () => {
      return this.commands.performRitual();
    });

    ipcMain.handle('move-window', (_event, deltaX: number, deltaY: number) => {
      this.commands.moveCharm(Number(deltaX) || 0, Number(deltaY) || 0);
      return true;
    });

    ipcMain.handle('set-overlay-interactive', (_event, interactive: boolean) => {
      this.commands.setOverlayInteractive(Boolean(interactive));
      return true;
    });

    ipcMain.handle('get-drag-boundary', () => this.settingsStore.get().dragBoundary);

    ipcMain.handle('set-drag-boundary', (_event, dragBoundary: unknown) => {
      if (typeof dragBoundary !== 'number' || !Number.isFinite(dragBoundary)) {
        return this.settingsStore.get().dragBoundary;
      }
      const next = this.settingsStore.update({ dragBoundary }).dragBoundary;
      this.commands.notify('drag-boundary-updated', next);
      return next;
    });

    ipcMain.handle('get-full-desktop-overlay', () => this.settingsStore.get().fullDesktopOverlay);

    ipcMain.handle('set-full-desktop-overlay', (_event, enabled: unknown) => {
      if (typeof enabled !== 'boolean') {
        return this.settingsStore.get().fullDesktopOverlay;
      }
      const next = this.settingsStore.update({ fullDesktopOverlay: enabled }).fullDesktopOverlay;
      this.commands.setFullDesktopOverlay(next);
      this.commands.notify('full-desktop-overlay-updated', next);
      return next;
    });

    ipcMain.handle('get-compact-overlay-size', () => this.settingsStore.get().compactOverlaySize);

    ipcMain.handle('set-compact-overlay-size', (_event, size: unknown) => {
      if (!size || typeof size !== 'object') {
        return this.settingsStore.get().compactOverlaySize;
      }
      const { width, height } = size as { width?: unknown; height?: unknown };
      if (typeof width !== 'number' || !Number.isFinite(width) || typeof height !== 'number' || !Number.isFinite(height)) {
        return this.settingsStore.get().compactOverlaySize;
      }
      const next = this.settingsStore.update({ compactOverlaySize: { width, height } }).compactOverlaySize;
      this.commands.setCompactOverlaySize(next);
      this.commands.notify('compact-overlay-size-updated', next);
      return next;
    });

    ipcMain.handle('toggle-undangle', () => {
      const undangled = this.app.toggleUndangled();
      this.commands.notify('undangle-updated', undangled);
      return undangled;
    });

    ipcMain.handle('open-settings', () => {
      this.commands.setGalleryOpen(true, 'general');
      return true;
    });

    ipcMain.handle('check-updates', () => {
      const updateStatus = this.app.getUpdateStatus();
      this.commands.notify('update-status', updateStatus);
      return updateStatus;
    });

    ipcMain.handle('quit-app', () => {
      this.electronApp.quit();
      return true;
    });
  }
}
