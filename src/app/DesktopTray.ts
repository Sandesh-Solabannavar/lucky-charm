import { Menu, Tray, nativeImage } from 'electron';
import { ElectronApp } from '../electron/ElectronApp';
import { LuckyCharmApp } from './LuckyCharmApp';

export class DesktopTray {
  private tray: Tray | null = null;

  constructor(
    private readonly luckyCharmApp: LuckyCharmApp,
    private readonly electronApp: ElectronApp,
    private readonly onToggleCharm: () => void,
    private readonly onPerformRitual: () => void,
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
        { label: 'Toggle charm', click: () => this.onToggleCharm() },
        { label: 'Perform ritual', click: () => this.onPerformRitual() },
        { label: 'Quit', click: () => this.electronApp.quit() },
      ]),
    );
  }
}
