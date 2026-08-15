import { describe, expect, it } from 'vitest';
import { LuckyCharmApp } from './LuckyCharmApp';

describe('LuckyCharmApp', () => {
  it('defaults to nazar when no initial ID is provided', () => {
    const app = new LuckyCharmApp();
    expect(app.getSelected().id).toBe('nazar');
  });

  it('initializes with the specified saved charm ID', () => {
    const app = new LuckyCharmApp('hamsa');
    expect(app.getSelected().id).toBe('hamsa');
  });

  it('falls back to default if saved charm ID is invalid', () => {
    const app = new LuckyCharmApp('invalid-nonexistent-id');
    expect(app.getSelected().id).toBe('nazar');
  });

  it('updates selected charm and returns the new selection', () => {
    const app = new LuckyCharmApp('nazar');
    const selected = app.select('daruma');
    expect(selected?.id).toBe('daruma');
    expect(app.getSelected().id).toBe('daruma');
  });

  it('handles ID aliases like custom -> emoji', () => {
    const app = new LuckyCharmApp('custom');
    expect(app.getSelected().id).toBe('emoji');
  });

  it('rotates Daruma eyes and ritual text through the wishing cycle', () => {
    const app = new LuckyCharmApp('daruma');
    expect(app.getSelected().darumaEyes).toBe(0);
    expect(app.getSelected().ritual).toBe('Make a wish');

    app.performRitual();
    expect(app.getSelected().darumaEyes).toBe(1);
    expect(app.getSelected().ritual).toBe('Wish granted');

    app.performRitual();
    expect(app.getSelected().darumaEyes).toBe(2);
    expect(app.getSelected().ritual).toBe('Make a wish');

    app.performRitual();
    expect(app.getSelected().darumaEyes).toBe(0);
    expect(app.getSelected().ritual).toBe('Make a wish');
  });

  it('supports custom emoji glyphs', () => {
    const app = new LuckyCharmApp('emoji', undefined, '✨');
    const art1 = app.getSelected().art;
    expect(art1.type === 'emoji' ? art1.glyph : '').toBe('✨');

    app.setCustomEmoji('🚀');
    const art2 = app.getSelected().art;
    expect(art2.type === 'emoji' ? art2.glyph : '').toBe('🚀');
  });

  it('includes layerAsset for maneki-neko and scarab', () => {
    const app = new LuckyCharmApp('maneki-neko');
    expect(app.getSelected().layerAsset).toBeDefined();

    app.select('scarab');
    expect(app.getSelected().layerAsset).toBeDefined();
  });
});
