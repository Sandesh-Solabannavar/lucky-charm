import { contextBridge, ipcRenderer } from 'electron';
import { mountLuckyCharmRenderer, type RendererElectronApi } from './renderer/LuckyCharmRendererApp';
import {
  mountLuckyCharmGalleryRenderer,
  type GalleryRendererElectronApi,
} from './renderer/LuckyCharmGalleryRendererApp';
import { IPC_CHANNEL, IPC_EVENT } from './ipc/channels';

type Charm = {
  id: string;
  name: string;
  region: string;
  description: string;
  ritual: string;
  art:
    | {
      type: 'emoji';
      glyph: string;
      fontSize: number;
      frame: [number, number];
    }
    | {
      type: 'image';
      src: string;
      frame: [number, number];
    };
  accent: string;
  glow: string;
};

type PreloadElectronApi = RendererElectronApi & GalleryRendererElectronApi;

const electronApi: PreloadElectronApi = {
  getCharms: () => ipcRenderer.invoke(IPC_CHANNEL.getCharms) as Promise<Charm[]>,
  getSelectedCharm: () => ipcRenderer.invoke(IPC_CHANNEL.getSelectedCharm) as Promise<Charm>,
  selectCharm: (id: string) => ipcRenderer.invoke(IPC_CHANNEL.selectCharm, id) as Promise<Charm | undefined>,
  toggleWindow: () => ipcRenderer.invoke(IPC_CHANNEL.toggleWindow) as Promise<boolean>,
  toggleGallery: () => ipcRenderer.invoke(IPC_CHANNEL.toggleGallery) as Promise<boolean>,
  setGalleryOpen: (open: boolean) => ipcRenderer.invoke(IPC_CHANNEL.setGalleryOpen, open) as Promise<boolean>,
  triggerRitual: () => ipcRenderer.invoke(IPC_CHANNEL.triggerRitual) as Promise<Charm>,
  moveWindow: (deltaX: number, deltaY: number) => ipcRenderer.invoke(IPC_CHANNEL.moveWindow, deltaX, deltaY) as Promise<boolean>,
  setOverlayInteractive: (interactive: boolean) => ipcRenderer.invoke(IPC_CHANNEL.setOverlayInteractive, interactive) as Promise<boolean>,
  getDragBoundary: () => ipcRenderer.invoke(IPC_CHANNEL.getDragBoundary) as Promise<number>,
  getFullDesktopOverlay: () => ipcRenderer.invoke(IPC_CHANNEL.getFullDesktopOverlay) as Promise<boolean>,
  setFullDesktopOverlay: (enabled: boolean) => ipcRenderer.invoke(IPC_CHANNEL.setFullDesktopOverlay, enabled) as Promise<boolean>,
  getCompactOverlaySize: () => ipcRenderer.invoke(IPC_CHANNEL.getCompactOverlaySize) as Promise<{ width: number; height: number }>,
  setCompactOverlaySize: (size: { width: number; height: number }) => ipcRenderer.invoke(IPC_CHANNEL.setCompactOverlaySize, size) as Promise<{ width: number; height: number }>,
  toggleUndangle: () => ipcRenderer.invoke(IPC_CHANNEL.toggleUndangle) as Promise<boolean>,
  openSettings: () => ipcRenderer.invoke(IPC_CHANNEL.openSettings) as Promise<boolean>,
  checkUpdates: () => ipcRenderer.invoke(IPC_CHANNEL.checkUpdates) as Promise<{ status: string; message: string; version: string }>,
  downloadUpdate: () => ipcRenderer.invoke(IPC_CHANNEL.downloadUpdate) as Promise<{ status: string; message: string; version: string }>,
  installUpdate: () => ipcRenderer.invoke(IPC_CHANNEL.installUpdate) as Promise<{ status: string; message: string; version: string }>,
  quitApp: () => ipcRenderer.invoke(IPC_CHANNEL.quitApp) as Promise<boolean>,
  onCharmsUpdated: (callback: (charms: Charm[]) => void) => {
    ipcRenderer.on(IPC_EVENT.charmsUpdated, (_event, charms) => callback(charms));
  },
  onCharmSelected: (callback: (charm: Charm) => void) => {
    ipcRenderer.on(IPC_EVENT.charmSelected, (_event, charm) => callback(charm));
  },
  onVisibleUpdated: (callback: (visible: boolean) => void) => {
    ipcRenderer.on(IPC_EVENT.visibilityUpdated, (_event, visible) => callback(Boolean(visible)));
  },
  onGalleryUpdated: (callback: (isOpen: boolean) => void) => {
    ipcRenderer.on(IPC_EVENT.galleryUpdated, (_event, isOpen) => callback(Boolean(isOpen)));
  },
  onRitualTriggered: (callback: (charm: Charm) => void) => {
    ipcRenderer.on(IPC_EVENT.ritualTriggered, (_event, charm) => callback(charm));
  },
  onUndangleUpdated: (callback: (undangled: boolean) => void) => {
    ipcRenderer.on(IPC_EVENT.undangleUpdated, (_event, undangled) => callback(Boolean(undangled)));
  },
  onSettingsOpened: (callback: () => void) => {
    ipcRenderer.on(IPC_EVENT.settingsOpened, () => callback());
  },
  onUpdateStatus: (callback: (status: { status: string; message: string; version: string }) => void) => {
    ipcRenderer.on(IPC_EVENT.updateStatus, (_event, status) => callback(status));
  },
  onGalleryTab: (callback: (tab: 'gallery' | 'general' | 'about') => void) => {
    ipcRenderer.on(IPC_EVENT.galleryTab, (_event, tab) => callback(tab as 'gallery' | 'general' | 'about'));
  },
  onDragBoundaryUpdated: (callback: (dragBoundary: number) => void) => {
    ipcRenderer.on(IPC_EVENT.dragBoundaryUpdated, (_event, dragBoundary) => callback(Number(dragBoundary)));
  },
  onFullDesktopOverlayUpdated: (callback: (enabled: boolean) => void) => {
    ipcRenderer.on(IPC_EVENT.fullDesktopOverlayUpdated, (_event, enabled) => callback(Boolean(enabled)));
  },
  onCompactOverlaySizeUpdated: (callback: (size: { width: number; height: number }) => void) => {
    ipcRenderer.on(IPC_EVENT.compactOverlaySizeUpdated, (_event, size) => callback(size as { width: number; height: number }));
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronApi);

window.addEventListener('DOMContentLoaded', () => {
  const isGalleryWindow = process.argv.includes('--window=gallery');
  if (isGalleryWindow) {
    mountLuckyCharmGalleryRenderer(electronApi);
    return;
  }
  mountLuckyCharmRenderer(electronApi);
});

declare global {
  interface Window {
    electronAPI: {
      getCharms: () => Promise<Charm[]>;
      getSelectedCharm: () => Promise<Charm>;
      selectCharm: (id: string) => Promise<Charm | undefined>;
      toggleWindow: () => Promise<boolean>;
      toggleGallery: () => Promise<boolean>;
      setGalleryOpen: (open: boolean) => Promise<boolean>;
      triggerRitual: () => Promise<Charm>;
      moveWindow: (deltaX: number, deltaY: number) => Promise<boolean>;
      setOverlayInteractive: (interactive: boolean) => Promise<boolean>;
      getDragBoundary: () => Promise<number>;
      getFullDesktopOverlay: () => Promise<boolean>;
      setFullDesktopOverlay: (enabled: boolean) => Promise<boolean>;
      getCompactOverlaySize: () => Promise<{ width: number; height: number }>;
      setCompactOverlaySize: (size: { width: number; height: number }) => Promise<{ width: number; height: number }>;
      toggleUndangle: () => Promise<boolean>;
      openSettings: () => Promise<boolean>;
      checkUpdates: () => Promise<{ status: string; message: string; version: string }>;
      downloadUpdate: () => Promise<{ status: string; message: string; version: string }>;
      installUpdate: () => Promise<{ status: string; message: string; version: string }>;
      quitApp: () => Promise<boolean>;
      onCharmsUpdated: (callback: (charms: Charm[]) => void) => void;
      onCharmSelected: (callback: (charm: Charm) => void) => void;
      onVisibleUpdated: (callback: (visible: boolean) => void) => void;
      onGalleryUpdated: (callback: (isOpen: boolean) => void) => void;
      onRitualTriggered: (callback: (charm: Charm) => void) => void;
      onUndangleUpdated: (callback: (undangled: boolean) => void) => void;
      onSettingsOpened: (callback: () => void) => void;
      onUpdateStatus: (callback: (status: { status: string; message: string; version: string }) => void) => void;
      onGalleryTab: (callback: (tab: 'gallery' | 'general' | 'about') => void) => void;
      onDragBoundaryUpdated: (callback: (dragBoundary: number) => void) => void;
      onFullDesktopOverlayUpdated: (callback: (enabled: boolean) => void) => void;
      onCompactOverlaySizeUpdated: (callback: (size: { width: number; height: number }) => void) => void;
    };
  }
}
