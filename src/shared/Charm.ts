export type CharmArt =
  | {
    type: 'emoji';
    glyph: string;
    fontSize: number;
    frame: [number, number];
  }
  | {
    type: 'image';
    src: string;
    frame: [number, number];
  };

export type Charm = {
  id: string;
  name: string;
  region: string;
  description: string;
  ritual: string;
  art: CharmArt;
  accent: string;
  glow: string;
  /** Optional local artwork used by a charm-specific hanging assembly. */
  hangerAsset?: string;
};

export type GalleryTab = 'gallery' | 'general' | 'about';
