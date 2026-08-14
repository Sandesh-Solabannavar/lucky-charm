import { ipcMain } from 'electron';
import { LuckyCharmApp } from '../app/LuckyCharmApp';
import { DesktopCommands } from '../app/DesktopCommands';
import { ElectronApp } from '../electron/ElectronApp';
import { DesktopSettingsStore } from '../settings/DesktopSettingsStore';
import { IPC_CHANNEL, IPC_EVENT } from './channels';

export class LuckyCharmIpc {
  constructor(
    private app: LuckyCharmApp,
    private electronApp: ElectronApp,
    private readonly commands: DesktopCommands,
    private readonly settingsStore: DesktopSettingsStore,
  ) {}

  install() {
    ipcMain.handle(IPC_CHANNEL.getCharms, () => this.app.getAll());

    ipcMain.handle(IPC_CHANNEL.selectCharm, (_event, charmId: string) => {
      return this.commands.selectCharm(charmId);
    });

    ipcMain.handle(IPC_CHANNEL.toggleWindow, () => {
      return this.commands.toggleCharm();
    });

    ipcMain.handle(IPC_CHANNEL.toggleGallery, () => {
      return this.commands.toggleGallery();
    });

    ipcMain.handle(IPC_CHANNEL.setGalleryOpen, (_event, open: boolean) => {
      return this.commands.setGalleryOpen(Boolean(open));
    });

    ipcMain.handle(IPC_CHANNEL.triggerRitual, () => {
      return this.commands.performRitual();
    });

    ipcMain.handle(IPC_CHANNEL.moveWindow, (_event, deltaX: number, deltaY: number) => {
      this.commands.moveCharm(Number(deltaX) || 0, Number(deltaY) || 0);
      return true;
    });

    ipcMain.handle(IPC_CHANNEL.setOverlayInteractive, (_event, interactive: boolean) => {
      this.commands.setOverlayInteractive(Boolean(interactive));
      return true;
    });

    ipcMain.handle(IPC_CHANNEL.getDragBoundary, () => this.settingsStore.get().dragBoundary);

    ipcMain.handle(IPC_CHANNEL.setDragBoundary, (_event, dragBoundary: unknown) => {
      if (typeof dragBoundary !== 'number' || !Number.isFinite(dragBoundary)) {
        return this.settingsStore.get().dragBoundary;
      }
      const next = this.settingsStore.update({ dragBoundary }).dragBoundary;
      this.commands.notify(IPC_EVENT.dragBoundaryUpdated, next);
      return next;
    });

    ipcMain.handle(IPC_CHANNEL.getFullDesktopOverlay, () => this.settingsStore.get().fullDesktopOverlay);

    ipcMain.handle(IPC_CHANNEL.setFullDesktopOverlay, (_event, enabled: unknown) => {
      if (typeof enabled !== 'boolean') {
        return this.settingsStore.get().fullDesktopOverlay;
      }
      const next = this.settingsStore.update({ fullDesktopOverlay: enabled }).fullDesktopOverlay;
      this.commands.setFullDesktopOverlay(next);
      this.commands.notify(IPC_EVENT.fullDesktopOverlayUpdated, next);
      return next;
    });

    ipcMain.handle(IPC_CHANNEL.getCompactOverlaySize, () => this.settingsStore.get().compactOverlaySize);

    ipcMain.handle(IPC_CHANNEL.setCompactOverlaySize, (_event, size: unknown) => {
      if (!size || typeof size !== 'object') {
        return this.settingsStore.get().compactOverlaySize;
      }
      const { width, height } = size as { width?: unknown; height?: unknown };
      if (typeof width !== 'number' || !Number.isFinite(width) || typeof height !== 'number' || !Number.isFinite(height)) {
        return this.settingsStore.get().compactOverlaySize;
      }
      const next = this.settingsStore.update({ compactOverlaySize: { width, height } }).compactOverlaySize;
      this.commands.setCompactOverlaySize(next);
      this.commands.notify(IPC_EVENT.compactOverlaySizeUpdated, next);
      return next;
    });

    ipcMain.handle(IPC_CHANNEL.toggleUndangle, () => {
      const undangled = this.app.toggleUndangled();
      this.commands.notify(IPC_EVENT.undangleUpdated, undangled);
      return undangled;
    });

    ipcMain.handle(IPC_CHANNEL.openSettings, () => {
      this.commands.setGalleryOpen(true, 'general');
      return true;
    });

    ipcMain.handle(IPC_CHANNEL.checkUpdates, () => {
      const updateStatus = this.app.getUpdateStatus();
      this.commands.notify(IPC_EVENT.updateStatus, updateStatus);
      return updateStatus;
    });

    ipcMain.handle(IPC_CHANNEL.quitApp, () => {
      this.electronApp.quit();
      return true;
    });
  }
}
