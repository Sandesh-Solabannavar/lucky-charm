import { describe, expect, it } from 'vitest';
import {
  isBoolean,
  isCompactOverlaySize,
  isFiniteNumberInRange,
  isIntegerInRange,
} from './validation';

describe('IPC validation', () => {
  it('accepts only booleans', () => {
    expect(isBoolean(true)).toBe(true);
    expect(isBoolean(false)).toBe(true);
    expect(isBoolean(1)).toBe(false);
    expect(isBoolean('true')).toBe(false);
  });

  it('requires finite numbers within an inclusive range', () => {
    expect(isFiniteNumberInRange(-10, -10, 10)).toBe(true);
    expect(isFiniteNumberInRange(10, -10, 10)).toBe(true);
    expect(isFiniteNumberInRange(Number.NaN, -10, 10)).toBe(false);
    expect(isFiniteNumberInRange(Infinity, -10, 10)).toBe(false);
    expect(isFiniteNumberInRange(11, -10, 10)).toBe(false);
  });

  it('requires whole numbers where settings require pixel values', () => {
    expect(isIntegerInRange(8, 0, 160)).toBe(true);
    expect(isIntegerInRange(8.5, 0, 160)).toBe(false);
  });

  it('validates compact overlay dimensions', () => {
    expect(isCompactOverlaySize({ width: 420, height: 760 })).toBe(true);
    expect(isCompactOverlaySize({ width: 239, height: 760 })).toBe(false);
    expect(isCompactOverlaySize({ width: 420, height: 359 })).toBe(false);
    expect(isCompactOverlaySize({ width: 420.5, height: 760 })).toBe(false);
    expect(isCompactOverlaySize({ width: '420', height: 760 })).toBe(false);
  });
});
