import { autoUpdater } from 'electron-updater';

export type UpdateStatus = {
  status: 'available' | 'up-to-date' | 'unavailable' | 'error';
  message: string;
  version: string;
};

function updateRepository(value: string | undefined) {
  const match = value?.match(/^([\w.-]+)\/([\w.-]+)$/u);
  return match ? { owner: match[1]!, repo: match[2]! } : undefined;
}

export class DesktopUpdates {
  private readonly repository = updateRepository(process.env.LUCKY_CHARM_UPDATE_REPOSITORY);

  constructor(
    private readonly isPackaged: boolean,
    private readonly version: string,
  ) {}

  async check(): Promise<UpdateStatus> {
    if (!this.isPackaged || !this.repository) {
      return {
        status: 'unavailable',
        message: 'Updates are available only from configured signed releases.',
        version: this.version,
      };
    }

    try {
      autoUpdater.autoDownload = false;
      autoUpdater.autoInstallOnAppQuit = false;
      autoUpdater.setFeedURL({ provider: 'github', ...this.repository });
      const result = await autoUpdater.checkForUpdates();
      if (!result?.updateInfo) {
        return { status: 'up-to-date', message: 'Lucky Charm is up to date.', version: this.version };
      }
      return {
        status: 'available',
        message: `Lucky Charm ${result.updateInfo.version} is available.`,
        version: result.updateInfo.version,
      };
    } catch (error) {
      console.warn('Update check failed:', error);
      return { status: 'error', message: 'Unable to check for updates.', version: this.version };
    }
  }
}
