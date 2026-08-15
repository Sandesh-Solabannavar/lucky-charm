import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DesktopSettingsStore } from './DesktopSettingsStore';

describe('DesktopSettingsStore', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lucky-charm-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('loads default settings when no file exists', () => {
    const store = new DesktopSettingsStore(tempDir);
    const settings = store.load();
    expect(settings.selectedCharmId).toBe('nazar');
    expect(settings.fullDesktopOverlay).toBe(true);
    expect(settings.compactOverlaySize).toEqual({ width: 420, height: 760 });
  });

  it('persists and reloads selectedCharmId', () => {
    const store1 = new DesktopSettingsStore(tempDir);
    store1.load();
    store1.setSelectedCharmId('hamsa');

    const store2 = new DesktopSettingsStore(tempDir);
    const reloaded = store2.load();
    expect(reloaded.selectedCharmId).toBe('hamsa');
  });

  it('persists overlay settings across instances', () => {
    const store1 = new DesktopSettingsStore(tempDir);
    store1.load();
    store1.update({
      fullDesktopOverlay: false,
      compactOverlaySize: { width: 500, height: 800 },
    });

    const store2 = new DesktopSettingsStore(tempDir);
    const reloaded = store2.load();
    expect(reloaded.fullDesktopOverlay).toBe(false);
    expect(reloaded.compactOverlaySize).toEqual({ width: 500, height: 800 });
  });
});
