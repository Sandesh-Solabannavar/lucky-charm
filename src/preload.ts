import { contextBridge, ipcRenderer } from 'electron';
import { mountLuckyCharmRenderer, type RendererElectronApi } from './renderer/LuckyCharmRendererApp';
import {
  mountLuckyCharmGalleryRenderer,
  type GalleryRendererElectronApi,
} from './renderer/LuckyCharmGalleryRendererApp';

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
  getCharms: () => ipcRenderer.invoke('get-charms') as Promise<Charm[]>,
  selectCharm: (id: string) => ipcRenderer.invoke('select-charm', id) as Promise<Charm | undefined>,
  toggleWindow: () => ipcRenderer.invoke('toggle-window') as Promise<boolean>,
  toggleGallery: () => ipcRenderer.invoke('toggle-gallery') as Promise<boolean>,
  setGalleryOpen: (open: boolean) => ipcRenderer.invoke('set-gallery-open', open) as Promise<boolean>,
  triggerRitual: () => ipcRenderer.invoke('trigger-ritual') as Promise<Charm>,
  moveWindow: (deltaX: number, deltaY: number) => ipcRenderer.invoke('move-window', deltaX, deltaY) as Promise<boolean>,
  setOverlayInteractive: (interactive: boolean) => ipcRenderer.invoke('set-overlay-interactive', interactive) as Promise<boolean>,
  toggleUndangle: () => ipcRenderer.invoke('toggle-undangle') as Promise<boolean>,
  openSettings: () => ipcRenderer.invoke('open-settings') as Promise<boolean>,
  checkUpdates: () => ipcRenderer.invoke('check-updates') as Promise<{ status: string; message: string; version: string }>,
  quitApp: () => ipcRenderer.invoke('quit-app') as Promise<boolean>,
  onCharmsUpdated: (callback: (charms: Charm[]) => void) => {
    ipcRenderer.on('charms-updated', (_event, charms) => callback(charms));
  },
  onCharmSelected: (callback: (charm: Charm) => void) => {
    ipcRenderer.on('charm-selected', (_event, charm) => callback(charm));
  },
  onVisibleUpdated: (callback: (visible: boolean) => void) => {
    ipcRenderer.on('visibility-updated', (_event, visible) => callback(Boolean(visible)));
  },
  onGalleryUpdated: (callback: (isOpen: boolean) => void) => {
    ipcRenderer.on('gallery-updated', (_event, isOpen) => callback(Boolean(isOpen)));
  },
  onRitualTriggered: (callback: (charm: Charm) => void) => {
    ipcRenderer.on('ritual-triggered', (_event, charm) => callback(charm));
  },
  onUndangleUpdated: (callback: (undangled: boolean) => void) => {
    ipcRenderer.on('undangle-updated', (_event, undangled) => callback(Boolean(undangled)));
  },
  onSettingsOpened: (callback: () => void) => {
    ipcRenderer.on('settings-opened', () => callback());
  },
  onUpdateStatus: (callback: (status: { status: string; message: string; version: string }) => void) => {
    ipcRenderer.on('update-status', (_event, status) => callback(status));
  },
  onGalleryTab: (callback: (tab: 'gallery' | 'general' | 'about') => void) => {
    ipcRenderer.on('gallery-tab', (_event, tab) => callback(tab as 'gallery' | 'general' | 'about'));
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
      selectCharm: (id: string) => Promise<Charm | undefined>;
      toggleWindow: () => Promise<boolean>;
      toggleGallery: () => Promise<boolean>;
      setGalleryOpen: (open: boolean) => Promise<boolean>;
      triggerRitual: () => Promise<Charm>;
      moveWindow: (deltaX: number, deltaY: number) => Promise<boolean>;
      setOverlayInteractive: (interactive: boolean) => Promise<boolean>;
      toggleUndangle: () => Promise<boolean>;
      openSettings: () => Promise<boolean>;
      checkUpdates: () => Promise<{ status: string; message: string; version: string }>;
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
    };
  }
}
