import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Charm } from '../shared/Charm';

export type { Charm } from '../shared/Charm';

const websiteAsset = (relativePath: string) => `https://luckydangle.app${relativePath}`;

const idAliases: Record<string, string> = {
  nimbu: 'nimbu-mirchi',
  drishti: 'drishti-bommai',
  maneki: 'maneki-neko',
  custom: 'emoji',
};

const baseCharms: Charm[] = [
  {
    id: 'nazar',
    name: 'Nazar boncugu',
    region: 'Turkey and the Mediterranean',
    description: 'A glass eye worn against the evil eye. Give it a flick when you want a little cover.',
    ritual: 'Give it a flick',
    art: {
      type: 'emoji',
      glyph: '\uD83E\uDDFF',
      fontSize: 58,
      frame: [64, 64],
    },
    accent: '#f2b64d',
    glow: '#d69d38',
  },
  {
    id: 'hamsa',
    name: 'Hamsa',
    region: 'Middle East & North Africa',
    description: 'An open hand carried for protection and good fortune. Give it a flick to send bad luck on its way.',
    ritual: 'Give it a flick',
    art: {
      type: 'image',
      src: websiteAsset('/charms/hamsa.png'),
      frame: [64, 84],
    },
    accent: '#f59e7a',
    glow: '#ea7d52',
  },
  {
    id: 'nimbu-mirchi',
    name: 'Nimbu Mirchi',
    region: 'India',
    description: 'Seven chilies and a lemon hung at the threshold to turn away misfortune. Replace it with a fresh one when the week is up.',
    ritual: 'Hang a fresh garland',
    art: {
      type: 'image',
      src: websiteAsset('/charms/nimbu-mirchi.png'),
      frame: [80, 92],
    },
    accent: '#f3c96e',
    glow: '#dca544',
  },
  {
    id: 'drishti-bommai',
    name: 'Drishti bommai',
    region: 'South India',
    description: 'A fierce guardian painted to meet the first bad glance. Repaint it through seven colors whenever you want a fresh start.',
    ritual: 'Repaint the guardian',
    art: {
      type: 'image',
      src: websiteAsset('/charms/drishti-bommai.png'),
      frame: [64, 84],
    },
    accent: '#7ad3ff',
    glow: '#46a3d9',
  },
  {
    id: 'daruma',
    name: 'Daruma',
    region: 'Japan',
    description: 'A wishing doll for goals that take some grit. Paint one eye when you make a wish and the other when it comes true.',
    ritual: 'Make a wish',
    art: {
      type: 'image',
      src: websiteAsset('/charms/daruma.png'),
      frame: [64, 64],
    },
    accent: '#8ad0a0',
    glow: '#5ac27e',
  },
  {
    id: 'maneki-neko',
    name: 'Maneki Neko',
    region: 'Japan',
    description: 'A beckoning cat that invites good fortune in. Call on it and watch its raised paw wave.',
    ritual: 'Beckon good fortune',
    art: {
      type: 'image',
      src: websiteAsset('/charms/maneki-neko.png'),
      frame: [64, 84],
    },
    accent: '#ffc76a',
    glow: '#dca550',
  },
  {
    id: 'horseshoe',
    name: 'Horseshoe',
    region: 'Europe and the Americas',
    description: 'Hung points up so the luck stays put. A good flick is all this one needs.',
    ritual: 'Give it a flick',
    art: {
      type: 'image',
      src: websiteAsset('/charms/horseshoe.png'),
      frame: [64, 84],
    },
    accent: '#c9a4ff',
    glow: '#9b73d9',
    hangerAsset: websiteAsset('/charms/horse-head-bead.png'),
  },
  {
    id: 'scarab',
    name: 'Scarab',
    region: 'Ancient Egypt',
    description: 'An ancient amulet for renewal and new beginnings. Spread its ceremonial wings for a moment, then let them rest.',
    ritual: 'Spread the wings',
    art: {
      type: 'image',
      src: websiteAsset('/charms/scarab.png'),
      frame: [140, 107],
    },
    accent: '#ff9aad',
    glow: '#dd6f8d',
  },
  {
    id: 'emoji',
    name: 'Emoji',
    region: 'Yours',
    description: 'Choose any emoji and make the ritual your own. Hang the one that feels lucky to you.',
    ritual: 'Pick an emoji',
    art: {
      type: 'emoji',
      glyph: '\uD83C\uDF40',
      fontSize: 58,
      frame: [64, 64],
    },
    accent: '#e7d778',
    glow: '#d1b845',
  },
];

const baseCharmVariants: Record<string, Array<Partial<Charm>>> = {
  'drishti-bommai': [
    { art: { type: 'image', src: websiteAsset('/charms/drishti-bommai.png'), frame: [64, 84] }, accent: '#7ad3ff', glow: '#46a3d9' },
    { art: { type: 'image', src: websiteAsset('/charms/drishti-blue.png'), frame: [64, 84] }, accent: '#7aa8ff', glow: '#4a7bd9' },
    { art: { type: 'image', src: websiteAsset('/charms/drishti-green.png'), frame: [64, 84] }, accent: '#93e08f', glow: '#53ac65' },
    { art: { type: 'image', src: websiteAsset('/charms/drishti-orange.png'), frame: [64, 84] }, accent: '#f8b17d', glow: '#d87f44' },
    { art: { type: 'image', src: websiteAsset('/charms/drishti-purple.png'), frame: [64, 84] }, accent: '#c39fff', glow: '#8b68d8' },
    { art: { type: 'image', src: websiteAsset('/charms/drishti-yellow.png'), frame: [64, 84] }, accent: '#f2d06d', glow: '#c89a34' },
    { art: { type: 'image', src: websiteAsset('/charms/drishti-black.png'), frame: [64, 84] }, accent: '#d2d7e6', glow: '#8d96ad' },
  ],
};

export class LuckyCharmApp {
  private selectedId: string;
  private selectedVariantIndexByCharm = new Map<string, number>();
  private galleryOpen = false;
  private undangled = false;
  private readonly charms: Charm[];
  private readonly charmVariants: Record<string, Array<Partial<Charm>>>;

  constructor(initialSelectedId?: string, assetsDirectory?: string) {
    const assetsDir = assetsDirectory ?? path.resolve(process.cwd(), 'assets', 'charms');
    this.charms = baseCharms.map((charm) => this.localizeCharm(charm, assetsDir));
    this.charmVariants = Object.fromEntries(
      Object.entries(baseCharmVariants).map(([charmId, variants]) => [
        charmId,
        variants.map((variant) => this.localizeVariant(variant, assetsDir)),
      ]),
    );

    const resolvedInitial = initialSelectedId ? (idAliases[initialSelectedId] ?? initialSelectedId) : undefined;
    const validInitial = resolvedInitial && this.charms.some((charm) => charm.id === resolvedInitial)
      ? resolvedInitial
      : this.charms[0]!.id;
    this.selectedId = validInitial;
  }

  private localizeCharm(charm: Charm, assetsDir: string): Charm {
    if (charm.art.type !== 'image') {
      return charm;
    }

    const hangerAsset = charm.hangerAsset
      ? this.toLocalAssetSource(charm.hangerAsset, assetsDir)
      : undefined;
    return {
      ...charm,
      art: {
        ...charm.art,
        src: this.toLocalAssetSource(charm.art.src, assetsDir),
      },
      ...(hangerAsset ? { hangerAsset } : {}),
    };
  }

  private localizeVariant(variant: Partial<Charm>, assetsDir: string): Partial<Charm> {
    if (!variant.art || variant.art.type !== 'image') {
      return variant;
    }

    return {
      ...variant,
      art: {
        ...variant.art,
        src: this.toLocalAssetSource(variant.art.src, assetsDir),
      },
    };
  }

  private toLocalAssetSource(sourceUrl: string, assetsDir: string): string {
    const fileName = sourceUrl.split('/').pop();
    if (!fileName) {
      return sourceUrl;
    }

    const filePath = path.join(assetsDir, fileName);
    if (!fs.existsSync(filePath)) {
      return sourceUrl;
    }

    const pngBuffer = fs.readFileSync(filePath);
    return `data:image/png;base64,${pngBuffer.toString('base64')}`;
  }

  private withVariant(charm: Charm): Charm {
    const variants = this.charmVariants[charm.id];
    if (!variants || variants.length === 0) return charm;
    const index = this.selectedVariantIndexByCharm.get(charm.id) ?? 0;
    const variant = variants[index % variants.length]!;
    return {
      ...charm,
      ...variant,
      accent: variant.accent ?? charm.accent,
      glow: variant.glow ?? charm.glow,
      art: variant.art ?? charm.art,
    };
  }

  getAll() {
    return this.charms;
  }

  getSelected() {
    const selected = this.charms.find((charm) => charm.id === this.selectedId) ?? this.charms[0]!;
    return this.withVariant(selected);
  }

  select(id: string) {
    const resolvedId = idAliases[id] ?? id;
    const match = this.charms.find((charm) => charm.id === resolvedId);
    if (!match) return;
    this.selectedId = match.id;
    return this.withVariant(match);
  }

  performRitual() {
    const selected = this.charms.find((charm) => charm.id === this.selectedId) ?? this.charms[0]!;
    const variants = this.charmVariants[selected.id];
    if (!variants || variants.length <= 1) {
      return this.withVariant(selected);
    }

    const current = this.selectedVariantIndexByCharm.get(selected.id) ?? 0;
    this.selectedVariantIndexByCharm.set(selected.id, (current + 1) % variants.length);
    return this.withVariant(selected);
  }

  toggleGallery() {
    this.galleryOpen = !this.galleryOpen;
    return this.galleryOpen;
  }

  setGalleryOpen(open: boolean) {
    this.galleryOpen = open;
    return this.galleryOpen;
  }

  isGalleryOpen() {
    return this.galleryOpen;
  }

  toggleUndangled() {
    this.undangled = !this.undangled;
    return this.undangled;
  }

  setUndangled(next: boolean) {
    this.undangled = next;
    return this.undangled;
  }

  isUndangled() {
    return this.undangled;
  }

}
