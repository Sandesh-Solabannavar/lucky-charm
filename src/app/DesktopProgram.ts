import { screen } from 'electron';
import * as path from 'node:path';
import { ElectronApp } from '../electron/ElectronApp';
import { ElectronWindow } from '../electron/ElectronWindow';
import { LuckyCharmIpc } from '../ipc/LuckyCharmIpc';
import { DesktopSettingsStore } from '../settings/DesktopSettingsStore';
import { DesktopGalleryWindow } from '../window/DesktopGalleryWindow';
import { DesktopWindow } from '../window/DesktopWindow';
import { LuckyCharmApp } from './LuckyCharmApp';
import { DesktopCommands } from './DesktopCommands';
import { DesktopTray } from './DesktopTray';
import { DesktopUpdates } from '../updates/DesktopUpdates';
import { DesktopLifecycle } from './DesktopLifecycle';

export async function runDesktopProgram() {
  const electronApp = new ElectronApp();
  const electronWindow = new ElectronWindow();
  if (!electronApp.requestSingleInstanceLock()) {
    electronApp.quit();
    return;
  }

  let handleExternalUrl: (url: string) => void = () => undefined;
  electronApp.on('second-instance', (_event, arguments_: string[]) => {
    const url = arguments_.find((argument) => argument.startsWith('luckycharm://'));
    if (url) handleExternalUrl(url);
  });

  try {
    await electronApp.whenReady();

    const settingsStore = new DesktopSettingsStore(electronApp.getPath('userData'));
    const settings = settingsStore.load();
    const charmAssetsDirectory = path.join(electronApp.metadata.appPath, 'assets', 'charms');
    const luckyCharmApp = new LuckyCharmApp(settings.selectedCharmId, charmAssetsDirectory);

    const primaryDisplay = screen.getPrimaryDisplay();
    const primaryDisplayId = String(primaryDisplay.id);

    const desktopWindow = new DesktopWindow(
      electronWindow,
      (displayId, normalizedX) => settingsStore.setCharmPosition(displayId, normalizedX),
      (visible) => settingsStore.setVisible(visible),
    );
    const initialX = settings.charmPositions[primaryDisplayId];
    if (typeof initialX === 'number') {
      desktopWindow.setInitialNormalizedX(initialX);
    }
    desktopWindow.setCompactOverlaySize(settings.compactOverlaySize);
    desktopWindow.setFullDesktopOverlay(settings.fullDesktopOverlay);

    const galleryWindow = new DesktopGalleryWindow(
      electronWindow,
      () => settingsStore.get().galleryBounds,
      (bounds) => settingsStore.setGalleryBounds(bounds),
      (open) => {
        luckyCharmApp.setGalleryOpen(open);
        desktopWindow.sendToMain('gallery-updated', open);
      },
    );

    const broadcast = (channel: string, payload?: unknown) => {
      desktopWindow.sendToMain(channel, payload);
      galleryWindow.send(channel, payload);
    };

    let commands: DesktopCommands;
    const desktopTray = new DesktopTray(
      luckyCharmApp,
      electronApp,
      () => commands.toggleCharm(),
      () => commands.performRitual(),
    );
    commands = new DesktopCommands(luckyCharmApp, {
      setCharmVisible: () => {
        desktopWindow.toggleMain();
        return desktopWindow.isMainVisible();
      },
      moveCharm: (dx, dy) => desktopWindow.moveMain(dx, dy),
      setFullDesktopOverlay: (enabled) => desktopWindow.setFullDesktopOverlay(enabled),
      setCompactOverlaySize: (size) => desktopWindow.setCompactOverlaySize(size),
      setOverlayInteractive: (interactive) => desktopWindow.setOverlayInteractive(interactive),
      openGalleryWindow: (tab) => galleryWindow.open(tab),
      closeGalleryWindow: () => galleryWindow.close(),
      refreshTray: () => desktopTray.refresh(),
      persistSelectedCharm: (id) => settingsStore.setSelectedCharmId(id),
      broadcast,
    });

    const lifecycle = new DesktopLifecycle(
      electronApp,
      desktopWindow,
      settings.shortcuts,
      () => commands.performRitual(),
      () => commands.setGalleryOpen(true),
    );

    const ipc = new LuckyCharmIpc(
      luckyCharmApp,
      electronApp,
      commands,
      settingsStore,
      () => new DesktopUpdates(electronApp.metadata.isPackaged, electronApp.metadata.version).check(),
    );

    electronApp.setAccessoryActivationPolicyOnMac();
    electronApp.setAsDefaultProtocolClient('luckycharm');

    desktopTray.create();
    desktopWindow.createMain();
    if (!settings.visible) {
      desktopWindow.hideMain();
    }
    ipc.install();
    lifecycle.register();
    handleExternalUrl = (url) => lifecycle.handleProtocolUrl(url);
    const startupProtocolUrl = process.argv.find((argument) => argument.startsWith('luckycharm://'));
    if (startupProtocolUrl) handleExternalUrl(startupProtocolUrl);

    broadcast('charms-updated', luckyCharmApp.getAll());
    broadcast('charm-selected', luckyCharmApp.getSelected());
  } catch (error) {
    console.error('Lucky Charm failed to start:', error);
    electronApp.quit();
  }
}
