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
    this.registerShortcut('Toggle charm', this.shortcuts.toggleCharm, () => {
      this.desktopWindow.toggleMain();
    });

    this.registerShortcut('Perform ritual', this.shortcuts.performRitual, () => {
      this.onRitualShortcut();
    });

    this.registerShortcut('Open gallery', this.shortcuts.openGallery, () => {
      this.onGalleryShortcut();
    });

    this.electronApp.on('activate', () => {
      this.desktopWindow.activate();
    });

    this.electronApp.on('open-url', (_event, url: string) => {
      this.handleProtocolUrl(url);
    });

    this.electronApp.on('will-quit', () => {
      this.electronApp.unregisterAllShortcuts();
    });
  }

  handleProtocolUrl(url: string) {
    if (!url.startsWith('luckycharm://')) return;
    this.desktopWindow.activate();
    this.onRitualShortcut();
  }

  private registerShortcut(label: string, accelerator: string, callback: () => void) {
    if (!this.electronApp.registerShortcut(accelerator, callback)) {
      console.warn(`${label} shortcut could not be registered: ${accelerator}`);
    }
  }
}
