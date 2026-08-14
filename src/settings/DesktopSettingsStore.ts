import * as fs from 'node:fs';
import * as path from 'node:path';

export type ShortcutConfig = {
  toggleCharm: string;
  performRitual: string;
  openGallery: string;
};

export type AppSettings = {
  version: number;
  selectedCharmId: string;
  charmPositions: Record<string, number>;
  visible: boolean;
  launchAtStartup: boolean;
  animationIntensity: number;
  shortcuts: ShortcutConfig;
  galleryBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
};

const defaultSettings: AppSettings = {
  version: 1,
  selectedCharmId: 'nazar',
  charmPositions: {},
  visible: true,
  launchAtStartup: false,
  animationIntensity: 1,
  shortcuts: {
    toggleCharm: 'CommandOrControl+Shift+D',
    performRitual: 'CommandOrControl+Shift+S',
    openGallery: 'CommandOrControl+Shift+G',
  },
  galleryBounds: null,
};

export class DesktopSettingsStore {
  private readonly settingsFilePath: string;
  private settings: AppSettings = { ...defaultSettings };

  constructor(userDataPath: string) {
    this.settingsFilePath = path.join(userDataPath, 'settings.json');
  }

  load() {
    try {
      if (!fs.existsSync(this.settingsFilePath)) {
        this.save();
        return this.settings;
      }

      const raw = fs.readFileSync(this.settingsFilePath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      this.settings = {
        ...defaultSettings,
        ...parsed,
        shortcuts: {
          ...defaultSettings.shortcuts,
          ...(parsed.shortcuts ?? {}),
        },
      };
      return this.settings;
    } catch {
      this.settings = { ...defaultSettings };
      this.save();
      return this.settings;
    }
  }

  get() {
    return this.settings;
  }

  update(partial: Partial<AppSettings>) {
    this.settings = {
      ...this.settings,
      ...partial,
      shortcuts: {
        ...this.settings.shortcuts,
        ...(partial.shortcuts ?? {}),
      },
    };
    this.save();
    return this.settings;
  }

  setSelectedCharmId(charmId: string) {
    this.settings.selectedCharmId = charmId;
    this.save();
  }

  setVisible(visible: boolean) {
    this.settings.visible = visible;
    this.save();
  }

  setCharmPosition(displayId: string, normalizedX: number) {
    this.settings.charmPositions[displayId] = Math.max(0, Math.min(1, normalizedX));
    this.save();
  }

  setGalleryBounds(bounds: { x: number; y: number; width: number; height: number } | null) {
    this.settings.galleryBounds = bounds;
    this.save();
  }

  private save() {
    fs.mkdirSync(path.dirname(this.settingsFilePath), { recursive: true });
    fs.writeFileSync(this.settingsFilePath, JSON.stringify(this.settings, null, 2), 'utf8');
  }
}
