import { ipcMain } from 'electron';
import { LuckyCharmApp } from '../app/LuckyCharmApp';
import { ElectronApp } from '../electron/ElectronApp';

export class LuckyCharmIpc {
  constructor(
    private app: LuckyCharmApp,
    private electronApp: ElectronApp,
    private windowManager: {
      send: (channel: string, payload?: unknown) => void;
      toggle: () => boolean;
      move: (dx: number, dy: number) => void;
      setOverlayInteractive: (interactive: boolean) => void;
      openGallery: (tab?: 'gallery' | 'general' | 'about') => void;
      closeGallery: () => void;
    },
    private onCharmChanged?: () => void,
  ) {}

  install() {
    ipcMain.handle('get-charms', () => this.app.getAll());

    ipcMain.handle('select-charm', (_event, charmId: string) => {
      const selected = this.app.select(charmId);
      if (selected) {
        this.onCharmChanged?.();
        this.windowManager.send('charm-selected', selected);
      }
      return selected;
    });

    ipcMain.handle('toggle-window', () => {
      return this.windowManager.toggle();
    });

    ipcMain.handle('toggle-gallery', () => {
      const isOpen = this.app.toggleGallery();
      if (isOpen) {
        this.windowManager.openGallery('gallery');
      } else {
        this.windowManager.closeGallery();
      }
      this.windowManager.send('gallery-updated', isOpen);
      return isOpen;
    });

    ipcMain.handle('set-gallery-open', (_event, open: boolean) => {
      const isOpen = this.app.setGalleryOpen(Boolean(open));
      if (isOpen) {
        this.windowManager.openGallery('gallery');
      } else {
        this.windowManager.closeGallery();
      }
      this.windowManager.send('gallery-updated', isOpen);
      return isOpen;
    });

    ipcMain.handle('trigger-ritual', () => {
      const selected = this.app.performRitual();
      this.onCharmChanged?.();
      this.windowManager.send('charm-selected', selected);
      this.windowManager.send('ritual-triggered', selected);
      return selected;
    });

    ipcMain.handle('move-window', (_event, deltaX: number, deltaY: number) => {
      this.windowManager.move(Number(deltaX) || 0, Number(deltaY) || 0);
      return true;
    });

    ipcMain.handle('set-overlay-interactive', (_event, interactive: boolean) => {
      this.windowManager.setOverlayInteractive(Boolean(interactive));
      return true;
    });

    ipcMain.handle('toggle-undangle', () => {
      const undangled = this.app.toggleUndangled();
      this.windowManager.send('undangle-updated', undangled);
      return undangled;
    });

    ipcMain.handle('open-settings', () => {
      this.app.setGalleryOpen(true);
      this.windowManager.openGallery('general');
      this.windowManager.send('settings-opened', true);
      return true;
    });

    ipcMain.handle('check-updates', () => {
      const updateStatus = this.app.getUpdateStatus();
      this.windowManager.send('update-status', updateStatus);
      return updateStatus;
    });

    ipcMain.handle('quit-app', () => {
      this.electronApp.quit();
      return true;
    });
  }
}
