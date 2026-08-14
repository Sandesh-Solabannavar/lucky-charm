import { contextBridge, ipcRenderer } from 'electron';

type Charm = {
  id: string;
  name: string;
  region: string;
  description: string;
  ritual: string;
  emoji: string;
  accent: string;
  glow: string;
};

contextBridge.exposeInMainWorld('electronAPI', {
  getCharms: () => ipcRenderer.invoke('get-charms') as Promise<Charm[]>,
  selectCharm: (id: string) => ipcRenderer.invoke('select-charm', id) as Promise<Charm>,
  toggleWindow: () => ipcRenderer.invoke('toggle-window') as Promise<boolean>,
  toggleGallery: () => ipcRenderer.invoke('toggle-gallery') as Promise<boolean>,
  triggerRitual: () => ipcRenderer.invoke('trigger-ritual') as Promise<Charm>,
  moveWindow: (deltaX: number, deltaY: number) => ipcRenderer.invoke('move-window', deltaX, deltaY) as Promise<boolean>,
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
  }
});

declare global {
  interface Window {
    electronAPI: {
      getCharms: () => Promise<Charm[]>;
      selectCharm: (id: string) => Promise<Charm>;
      toggleWindow: () => Promise<boolean>;
      toggleGallery: () => Promise<boolean>;
      triggerRitual: () => Promise<Charm>;
      moveWindow: (deltaX: number, deltaY: number) => Promise<boolean>;
      onCharmsUpdated: (callback: (charms: Charm[]) => void) => void;
      onCharmSelected: (callback: (charm: Charm) => void) => void;
      onVisibleUpdated: (callback: (visible: boolean) => void) => void;
      onGalleryUpdated: (callback: (isOpen: boolean) => void) => void;
      onRitualTriggered: (callback: (charm: Charm) => void) => void;
    };
  }
}
