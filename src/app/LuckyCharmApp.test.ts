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
});
