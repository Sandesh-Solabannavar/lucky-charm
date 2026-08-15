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
  customEmojiGlyph: string;
  darumaEyes: number;
  charmPositions: Record<string, number>;
  visible: boolean;
  launchAtStartup: boolean;
  animationIntensity: number;
  dragBoundary: number;
  fullDesktopOverlay: boolean;
  compactOverlaySize: { width: number; height: number };
  shortcuts: ShortcutConfig;
  galleryBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
};

export const DRAG_BOUNDARY_MIN = 0;
export const DRAG_BOUNDARY_MAX = 160;
export const COMPACT_OVERLAY_MIN_WIDTH = 240;
export const COMPACT_OVERLAY_MIN_HEIGHT = 360;
export const COMPACT_OVERLAY_MAX_WIDTH = 3840;
export const COMPACT_OVERLAY_MAX_HEIGHT = 2160;

const defaultSettings: AppSettings = {
  version: 1,
  selectedCharmId: 'nazar',
  customEmojiGlyph: '🍀',
  darumaEyes: 0,
  charmPositions: {},
  visible: true,
  launchAtStartup: false,
  animationIntensity: 1,
  dragBoundary: 8,
  fullDesktopOverlay: true,
  compactOverlaySize: { width: 420, height: 760 },
  shortcuts: {
    toggleCharm: 'CommandOrControl+Shift+D',
    performRitual: 'CommandOrControl+Shift+S',
    openGallery: 'CommandOrControl+Shift+G',
  },
  galleryBounds: null,
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

function normalizeSettings(value: unknown): AppSettings {
  const parsed = value && typeof value === 'object' ? value as Partial<AppSettings> : {};
  const positions = parsed.charmPositions && typeof parsed.charmPositions === 'object'
    ? Object.fromEntries(
      Object.entries(parsed.charmPositions).flatMap(([displayId, position]) =>
        isFiniteNumber(position) ? [[displayId, Math.max(0, Math.min(1, position))]] : [],
      ),
    )
    : {};
  const bounds = parsed.galleryBounds;
  const galleryBounds = bounds
    && isFiniteNumber(bounds.x)
    && isFiniteNumber(bounds.y)
    && isFiniteNumber(bounds.width)
    && isFiniteNumber(bounds.height)
    && bounds.width >= 820
    && bounds.height >= 560
    ? { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }
    : null;

  return {
    ...defaultSettings,
    version: defaultSettings.version,
    selectedCharmId: typeof parsed.selectedCharmId === 'string' ? parsed.selectedCharmId : defaultSettings.selectedCharmId,
    customEmojiGlyph: typeof parsed.customEmojiGlyph === 'string' && parsed.customEmojiGlyph.trim().length > 0
      ? parsed.customEmojiGlyph.trim()
      : defaultSettings.customEmojiGlyph,
    darumaEyes: isFiniteNumber(parsed.darumaEyes) && [0, 1, 2].includes(parsed.darumaEyes)
      ? parsed.darumaEyes
      : defaultSettings.darumaEyes,
    charmPositions: positions,
    visible: typeof parsed.visible === 'boolean' ? parsed.visible : defaultSettings.visible,
    launchAtStartup: typeof parsed.launchAtStartup === 'boolean' ? parsed.launchAtStartup : defaultSettings.launchAtStartup,
    animationIntensity: isFiniteNumber(parsed.animationIntensity)
      ? Math.max(0, Math.min(2, parsed.animationIntensity))
      : defaultSettings.animationIntensity,
    dragBoundary: isFiniteNumber(parsed.dragBoundary)
      ? Math.round(Math.max(DRAG_BOUNDARY_MIN, Math.min(DRAG_BOUNDARY_MAX, parsed.dragBoundary)))
      : defaultSettings.dragBoundary,
    fullDesktopOverlay: typeof parsed.fullDesktopOverlay === 'boolean'
      ? parsed.fullDesktopOverlay
      : defaultSettings.fullDesktopOverlay,
    compactOverlaySize: parsed.compactOverlaySize
      && isFiniteNumber(parsed.compactOverlaySize.width)
      && isFiniteNumber(parsed.compactOverlaySize.height)
      ? {
        width: Math.round(Math.max(COMPACT_OVERLAY_MIN_WIDTH, Math.min(COMPACT_OVERLAY_MAX_WIDTH, parsed.compactOverlaySize.width))),
        height: Math.round(Math.max(COMPACT_OVERLAY_MIN_HEIGHT, Math.min(COMPACT_OVERLAY_MAX_HEIGHT, parsed.compactOverlaySize.height))),
      }
      : defaultSettings.compactOverlaySize,
    shortcuts: {
      toggleCharm: typeof parsed.shortcuts?.toggleCharm === 'string' ? parsed.shortcuts.toggleCharm : defaultSettings.shortcuts.toggleCharm,
      performRitual: typeof parsed.shortcuts?.performRitual === 'string' ? parsed.shortcuts.performRitual : defaultSettings.shortcuts.performRitual,
      openGallery: typeof parsed.shortcuts?.openGallery === 'string' ? parsed.shortcuts.openGallery : defaultSettings.shortcuts.openGallery,
    },
    galleryBounds,
  };
}

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
      this.settings = normalizeSettings(JSON.parse(raw));
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
    this.settings = normalizeSettings({
      ...this.settings,
      ...partial,
      shortcuts: { ...this.settings.shortcuts, ...(partial.shortcuts ?? {}) },
    });
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
