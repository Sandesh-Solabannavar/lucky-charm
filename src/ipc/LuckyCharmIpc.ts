import { ipcMain } from 'electron';
import { LuckyCharmApp } from '../app/LuckyCharmApp';
import { DesktopCommands } from '../app/DesktopCommands';
import { ElectronApp } from '../electron/ElectronApp';
import {
  DRAG_BOUNDARY_MAX,
  DRAG_BOUNDARY_MIN,
  DesktopSettingsStore,
} from '../settings/DesktopSettingsStore';
import { IPC_CHANNEL, IPC_EVENT } from './channels';
import { isBoolean, isCompactOverlaySize, isFiniteNumberInRange, isIntegerInRange } from './validation';
import type { UpdateStatus } from '../updates/DesktopUpdates';

export class LuckyCharmIpc {
  constructor(
    private app: LuckyCharmApp,
    private electronApp: ElectronApp,
    private readonly commands: DesktopCommands,
    private readonly settingsStore: DesktopSettingsStore,
    private readonly checkForUpdates: () => Promise<UpdateStatus>,
    private readonly downloadUpdate: () => Promise<UpdateStatus>,
    private readonly installUpdate: () => UpdateStatus,
  ) {}

  install() {
    ipcMain.handle(IPC_CHANNEL.getCharms, () => this.app.getAll());

    ipcMain.handle(IPC_CHANNEL.getSelectedCharm, () => this.app.getSelected());

    ipcMain.handle(IPC_CHANNEL.selectCharm, (_event, charmId: string) => {
      if (typeof charmId !== 'string' || charmId.length === 0 || charmId.length > 100) return undefined;
      return this.commands.selectCharm(charmId);
    });

    ipcMain.handle(IPC_CHANNEL.toggleWindow, () => {
      return this.commands.toggleCharm();
    });

    ipcMain.handle(IPC_CHANNEL.toggleGallery, () => {
      return this.commands.toggleGallery();
    });

    ipcMain.handle(IPC_CHANNEL.setGalleryOpen, (_event, open: boolean) => {
      if (!isBoolean(open)) return false;
      return this.commands.setGalleryOpen(open);
    });

    ipcMain.handle(IPC_CHANNEL.triggerRitual, () => {
      return this.commands.performRitual();
    });

    ipcMain.handle(IPC_CHANNEL.moveWindow, (_event, deltaX: number, deltaY: number) => {
      if (!isFiniteNumberInRange(deltaX, -10_000, 10_000) || !isFiniteNumberInRange(deltaY, -10_000, 10_000)) {
        return false;
      }
      this.commands.moveCharm(deltaX, deltaY);
      return true;
    });

    ipcMain.handle(IPC_CHANNEL.setOverlayInteractive, (_event, interactive: boolean) => {
      if (!isBoolean(interactive)) return false;
      this.commands.setOverlayInteractive(interactive);
      return true;
    });

    ipcMain.handle(IPC_CHANNEL.getDragBoundary, () => this.settingsStore.get().dragBoundary);

    ipcMain.handle(IPC_CHANNEL.setDragBoundary, (_event, dragBoundary: unknown) => {
      if (!isIntegerInRange(dragBoundary, DRAG_BOUNDARY_MIN, DRAG_BOUNDARY_MAX)) {
        return this.settingsStore.get().dragBoundary;
      }
      const next = this.settingsStore.update({ dragBoundary }).dragBoundary;
      this.commands.notify(IPC_EVENT.dragBoundaryUpdated, next);
      return next;
    });

    ipcMain.handle(IPC_CHANNEL.getFullDesktopOverlay, () => this.settingsStore.get().fullDesktopOverlay);

    ipcMain.handle(IPC_CHANNEL.setFullDesktopOverlay, (_event, enabled: unknown) => {
      if (!isBoolean(enabled)) {
        return this.settingsStore.get().fullDesktopOverlay;
      }
      const next = this.settingsStore.update({ fullDesktopOverlay: enabled }).fullDesktopOverlay;
      this.commands.setFullDesktopOverlay(next);
      this.commands.notify(IPC_EVENT.fullDesktopOverlayUpdated, next);
      return next;
    });

    ipcMain.handle(IPC_CHANNEL.getCompactOverlaySize, () => this.settingsStore.get().compactOverlaySize);

    ipcMain.handle(IPC_CHANNEL.setCompactOverlaySize, (_event, size: unknown) => {
      if (!isCompactOverlaySize(size)) {
        return this.settingsStore.get().compactOverlaySize;
      }
      const next = this.settingsStore.update({ compactOverlaySize: size }).compactOverlaySize;
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

    ipcMain.handle(IPC_CHANNEL.checkUpdates, async () => {
      const updateStatus = await this.checkForUpdates();
      this.commands.notify(IPC_EVENT.updateStatus, updateStatus);
      return updateStatus;
    });

    ipcMain.handle(IPC_CHANNEL.downloadUpdate, async () => {
      const updateStatus = await this.downloadUpdate();
      this.commands.notify(IPC_EVENT.updateStatus, updateStatus);
      return updateStatus;
    });

    ipcMain.handle(IPC_CHANNEL.installUpdate, () => {
      const updateStatus = this.installUpdate();
      this.commands.notify(IPC_EVENT.updateStatus, updateStatus);
      return updateStatus;
    });

    ipcMain.handle(IPC_CHANNEL.quitApp, () => {
      this.electronApp.quit();
      return true;
    });
  }
}
