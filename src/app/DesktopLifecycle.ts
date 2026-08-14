import { ElectronApp } from '../electron/ElectronApp';
import { DesktopWindow } from '../window/DesktopWindow';
import type { ShortcutConfig } from '../settings/DesktopSettingsStore';

export class DesktopLifecycle {
  constructor(
    private readonly electronApp: ElectronApp,
    private readonly desktopWindow: DesktopWindow,
    private readonly shortcuts: ShortcutConfig,
    private readonly onRitualShortcut: () => void,
    private readonly onGalleryShortcut: () => void,
  ) {}

  register() {
    this.electronApp.registerShortcut(this.shortcuts.toggleCharm, () => {
      this.desktopWindow.toggleMain();
    });

    this.electronApp.registerShortcut(this.shortcuts.performRitual, () => {
      this.onRitualShortcut();
    });

    this.electronApp.registerShortcut(this.shortcuts.openGallery, () => {
      this.onGalleryShortcut();
    });

    this.electronApp.on('activate', () => {
      this.desktopWindow.activate();
    });

    this.electronApp.on('open-url', (_event, url: string) => {
      if (!url.includes('luckycharm://')) return;
      this.desktopWindow.activate();
      this.onRitualShortcut();
    });

    this.electronApp.on('will-quit', () => {
      this.electronApp.unregisterAllShortcuts();
    });
  }
}
