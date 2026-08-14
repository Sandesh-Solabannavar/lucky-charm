import { ipcMain } from 'electron';
import { LuckyCharmApp } from '../app/LuckyCharmApp';
import { DesktopCommands } from '../app/DesktopCommands';
import { ElectronApp } from '../electron/ElectronApp';

export class LuckyCharmIpc {
  constructor(
    private app: LuckyCharmApp,
    private electronApp: ElectronApp,
    private readonly commands: DesktopCommands,
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
