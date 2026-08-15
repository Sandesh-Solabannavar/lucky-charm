export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isFiniteNumberInRange(value: unknown, minimum: number, maximum: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= minimum && value <= maximum;
}

export function isIntegerInRange(value: unknown, minimum: number, maximum: number): value is number {
  return isFiniteNumberInRange(value, minimum, maximum) && Number.isInteger(value);
}

export function isCompactOverlaySize(value: unknown): value is { width: number; height: number } {
  if (!value || typeof value !== 'object') return false;
  const { width, height } = value as { width?: unknown; height?: unknown };
  return isIntegerInRange(width, COMPACT_OVERLAY_MIN_WIDTH, COMPACT_OVERLAY_MAX_WIDTH)
    && isIntegerInRange(height, COMPACT_OVERLAY_MIN_HEIGHT, COMPACT_OVERLAY_MAX_HEIGHT);
}
import {
  COMPACT_OVERLAY_MAX_HEIGHT,
  COMPACT_OVERLAY_MAX_WIDTH,
  COMPACT_OVERLAY_MIN_HEIGHT,
  COMPACT_OVERLAY_MIN_WIDTH,
} from '../settings/DesktopSettingsStore';
