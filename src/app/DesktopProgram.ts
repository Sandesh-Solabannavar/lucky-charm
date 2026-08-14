import { screen } from 'electron';
import * as path from 'node:path';
import { ElectronApp } from '../electron/ElectronApp';
import { ElectronWindow } from '../electron/ElectronWindow';
import { LuckyCharmIpc } from '../ipc/LuckyCharmIpc';
import { DesktopSettingsStore } from '../settings/DesktopSettingsStore';
import { DesktopGalleryWindow } from '../window/DesktopGalleryWindow';
import { DesktopWindow } from '../window/DesktopWindow';
import { LuckyCharmApp } from './LuckyCharmApp';
import { DesktopTray } from './DesktopTray';
import { DesktopLifecycle } from './DesktopLifecycle';

export async function runDesktopProgram() {
  const electronApp = new ElectronApp();
  const electronWindow = new ElectronWindow();

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

    const galleryWindow = new DesktopGalleryWindow(
      electronWindow,
      () => settingsStore.get().galleryBounds,
      (bounds) => settingsStore.setGalleryBounds(bounds),
      (open) => {
        luckyCharmApp.setGalleryOpen(open);
        desktopWindow.sendToMain('gallery-updated', open);
      },
    );

    const desktopTray = new DesktopTray(luckyCharmApp, desktopWindow, electronApp);

    const broadcast = (channel: string, payload?: unknown) => {
      desktopWindow.sendToMain(channel, payload);
      galleryWindow.send(channel, payload);
    };

    const openGallery = (tab: 'gallery' | 'general' | 'about' = 'gallery') => {
      luckyCharmApp.setGalleryOpen(true);
      galleryWindow.open(tab);
      broadcast('charms-updated', luckyCharmApp.getAll());
      broadcast('charm-selected', luckyCharmApp.getSelected());
      broadcast('gallery-updated', true);
    };

    const closeGallery = () => {
      luckyCharmApp.setGalleryOpen(false);
      galleryWindow.close();
      broadcast('gallery-updated', false);
    };

    const lifecycle = new DesktopLifecycle(
      electronApp,
      desktopWindow,
      settings.shortcuts,
      () => {
        const selected = luckyCharmApp.performRitual();
        settingsStore.setSelectedCharmId(selected.id);
        desktopTray.refresh();
        broadcast('charm-selected', selected);
        broadcast('ritual-triggered', selected);
      },
      () => openGallery('gallery'),
    );

    const ipc = new LuckyCharmIpc(
      luckyCharmApp,
      electronApp,
      {
        send: (channel, payload) => broadcast(channel, payload),
        toggle: () => {
          desktopWindow.toggleMain();
          return desktopWindow.isMainVisible();
        },
        move: (dx, dy) => desktopWindow.moveMain(dx, dy),
        setOverlayInteractive: (interactive) => desktopWindow.setOverlayInteractive(interactive),
        openGallery,
        closeGallery,
      },
      () => {
        settingsStore.setSelectedCharmId(luckyCharmApp.getSelected().id);
        desktopTray.refresh();
      },
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

    broadcast('charms-updated', luckyCharmApp.getAll());
    broadcast('charm-selected', luckyCharmApp.getSelected());
  } catch (error) {
    console.error('Lucky Charm failed to start:', error);
    electronApp.quit();
  }
}
