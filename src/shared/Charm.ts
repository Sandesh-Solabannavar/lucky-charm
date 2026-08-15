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
  /** Optional layer artwork rendered over or with the base charm (e.g. maneki arm, scarab wings). */
  layerAsset?: string;
  /** State for multi-stage rituals like Daruma eyes. */
  darumaEyes?: number;
};

export type GalleryTab = 'gallery' | 'general' | 'about';
