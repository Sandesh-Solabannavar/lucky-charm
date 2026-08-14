import type { Charm, GalleryTab } from '../shared/Charm';
import { LuckyCharmApp } from './LuckyCharmApp';

export type DesktopCommandPorts = {
  setCharmVisible: () => boolean;
  moveCharm: (deltaX: number, deltaY: number) => void;
  setFullDesktopOverlay: (enabled: boolean) => void;
  setCompactOverlaySize: (size: { width: number; height: number }) => void;
  setOverlayInteractive: (interactive: boolean) => void;
  openGalleryWindow: (tab: GalleryTab) => void;
  closeGalleryWindow: () => void;
  refreshTray: () => void;
  persistSelectedCharm: (id: string) => void;
  broadcast: (channel: string, payload?: unknown) => void;
};

/** Coordinates desktop commands so every adapter observes the same state transition. */
export class DesktopCommands {
  constructor(
    private readonly charmApp: LuckyCharmApp,
    private readonly ports: DesktopCommandPorts,
  ) {}

  selectCharm(id: string): Charm | undefined {
    const selected = this.charmApp.select(id);
    if (!selected) return undefined;
    this.persistAndPublishSelection(selected);
    return selected;
  }

  performRitual(): Charm {
    const selected = this.charmApp.performRitual();
    this.persistAndPublishSelection(selected);
    this.ports.broadcast('ritual-triggered', selected);
    return selected;
  }

  toggleCharm() {
    return this.ports.setCharmVisible();
  }

  moveCharm(deltaX: number, deltaY: number) {
    this.ports.moveCharm(deltaX, deltaY);
  }

  setFullDesktopOverlay(enabled: boolean) {
    this.ports.setFullDesktopOverlay(enabled);
  }

  setCompactOverlaySize(size: { width: number; height: number }) {
    this.ports.setCompactOverlaySize(size);
  }

  setOverlayInteractive(interactive: boolean) {
    this.ports.setOverlayInteractive(interactive);
  }

  notify(channel: string, payload?: unknown) {
    this.ports.broadcast(channel, payload);
  }

  setGalleryOpen(open: boolean, tab: GalleryTab = 'gallery') {
    this.charmApp.setGalleryOpen(open);
    if (open) {
      this.ports.openGalleryWindow(tab);
      this.ports.broadcast('charms-updated', this.charmApp.getAll());
      this.ports.broadcast('charm-selected', this.charmApp.getSelected());
    } else {
      this.ports.closeGalleryWindow();
    }
    this.ports.broadcast('gallery-updated', open);
    return open;
  }

  toggleGallery() {
    return this.setGalleryOpen(!this.charmApp.isGalleryOpen());
  }

  private persistAndPublishSelection(selected: Charm) {
    this.ports.persistSelectedCharm(selected.id);
    this.ports.refreshTray();
    this.ports.broadcast('charm-selected', selected);
  }
}
