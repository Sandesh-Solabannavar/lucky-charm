import { Menu, Tray, nativeImage } from 'electron';
import { LuckyCharmApp } from './LuckyCharmApp';
import { DesktopWindow } from '../window/DesktopWindow';
import { ElectronApp } from '../electron/ElectronApp';

export class DesktopTray {
  private tray: Tray | null = null;

  constructor(
    private readonly luckyCharmApp: LuckyCharmApp,
    private readonly desktopWindow: DesktopWindow,
    private readonly electronApp: ElectronApp,
  ) {}

  create() {
    const icon = nativeImage.createFromDataURL(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABlQY1AAAAAXNSR0IArs4c6QAAAA1JREFUGFdjYAAAAAIAAeIhvAAAAABJRU5ErkJggg=='
    );

    this.tray = new Tray(icon.resize({ width: 18, height: 18 }));
    this.tray.setToolTip('Lucky Charm');
    this.refresh();
  }

  refresh() {
    if (!this.tray) return;

    const selected = this.luckyCharmApp.getSelected();
    this.tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: `Current charm: ${selected.name}`, enabled: false },
        { type: 'separator' },
        { label: 'Toggle charm', click: () => this.desktopWindow.toggleMain() },
        {
          label: 'Perform ritual',
          click: () => {
            const next = this.luckyCharmApp.performRitual();
            this.desktopWindow.sendToMain('charm-selected', next);
            this.desktopWindow.sendToMain('ritual-triggered', next);
            this.refresh();
          },
        },
        { label: 'Quit', click: () => this.electronApp.quit() },
      ]),
    );
  }
}
