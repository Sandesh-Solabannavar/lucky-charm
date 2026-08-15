import type { Charm } from './Charm';

export type HangerPart =
  | { type: 'bead'; size: number; color: string; shadow: string; striped?: boolean }
  | { type: 'horse'; source?: string }
  | { type: 'clover' };

const gold = { type: 'bead', size: 12, color: '#f7c743', shadow: '#bd7a16' } as const;
const white = { type: 'bead', size: 14, color: '#f8f8fc', shadow: '#c7ccd8' } as const;

export const attachmentTopRatio: Record<string, number> = {
  nazar: 18 / 74,
  hamsa: 16 / 400,
  'nimbu-mirchi': 38 / 275,
  'drishti-bommai': 15 / 400,
  daruma: 12 / 400,
  'maneki-neko': 11 / 400,
  horseshoe: 54 / 400,
  scarab: 53 / 304,
  emoji: 18 / 74,
};

export function hangerPartsFor(charm: Charm): HangerPart[] {
  switch (charm.id) {
    case 'hamsa':
      return [gold, { type: 'bead', size: 19, color: '#2d58bc', shadow: '#13296d' }, gold, { ...gold, size: 8 }];
    case 'nimbu-mirchi':
      return [];
    case 'drishti-bommai':
      return [gold, { type: 'bead', size: 19, color: '#d8211d', shadow: '#8e1110', striped: true }, gold];
    case 'daruma':
      return [gold, white, gold];
    case 'maneki-neko':
      return [gold, { type: 'bead', size: 19, color: '#e63831', shadow: '#8e1715' }, gold];
    case 'horseshoe':
      return charm.hangerAsset ? [{ type: 'horse', source: charm.hangerAsset }] : [gold];
    case 'scarab':
      return [gold, { type: 'bead', size: 19, color: '#24b9bb', shadow: '#0b6d74' }, gold, { ...gold, size: 8 }];
    case 'emoji':
      return [white, { type: 'clover' }, white];
    default:
      return [white, { type: 'bead', size: 19, color: '#2356c7', shadow: '#152a8a' }, white];
  }
}
