type Charm = {
  id: string;
  name: string;
  region: string;
  description: string;
  ritual: string;
  art:
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
  accent: string;
  glow: string;
};

export type GalleryRendererElectronApi = {
  getCharms: () => Promise<Charm[]>;
  selectCharm: (id: string) => Promise<Charm | undefined>;
  setGalleryOpen: (open: boolean) => Promise<boolean>;
  onCharmsUpdated: (callback: (charms: Charm[]) => void) => void;
  onCharmSelected: (callback: (charm: Charm) => void) => void;
  onGalleryTab: (callback: (tab: 'gallery' | 'general' | 'about') => void) => void;
};

const css = `
* { box-sizing: border-box; }
html, body {
  margin: 0;
  width: 100%;
  height: 100%;
  background: #0f1526;
  color: #edf2ff;
  font-family: "Segoe UI", system-ui, sans-serif;
}
.app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.head {
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  background: #161e38;
}
.title {
  font-size: 14px;
  font-weight: 700;
}
.tabs {
  height: 44px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  background: #1c2747;
}
.tab-btn {
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px;
  background: rgba(255,255,255,0.04);
  color: #e7eeff;
  padding: 6px 10px;
  font-size: 11px;
  cursor: pointer;
}
.tab-btn.active {
  background: rgba(62, 104, 252, 0.34);
  border-color: rgba(124, 165, 255, 0.7);
}
.panel {
  flex: 1;
  overflow: auto;
}
.panel.hidden { display: none; }
.grid {
  padding: 14px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 12px;
}
.card {
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.11);
  background: linear-gradient(180deg, rgba(45, 58, 112, 0.84), rgba(22, 29, 62, 0.9));
  min-height: 180px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
  color: #e7ecff;
  cursor: pointer;
}
.card.selected {
  border-color: rgba(106, 167, 255, 0.94);
  box-shadow: 0 0 0 1px rgba(121, 174, 255, 0.34) inset;
}
.card-top {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 64px;
}
.card-emoji {
  font-size: 40px;
}
.card-image {
  max-width: 76px;
  max-height: 76px;
  object-fit: contain;
}
.card-name {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.3;
}
.badge {
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 10px;
  background: rgba(82, 120, 255, 0.26);
  color: #d7e4ff;
}
.card-desc {
  font-size: 11px;
  line-height: 1.4;
  color: rgba(216, 226, 255, 0.86);
}
.panel-body {
  padding: 16px;
  font-size: 12px;
  color: rgba(227, 236, 255, 0.92);
  line-height: 1.6;
}
.panel-body h4 {
  margin: 0 0 8px;
  font-size: 13px;
}
`;

function make<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

export function mountLuckyCharmGalleryRenderer(api: GalleryRendererElectronApi) {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const state: { charms: Charm[]; selected: Charm | null; tab: 'gallery' | 'general' | 'about' } = {
    charms: [],
    selected: null,
    tab: 'gallery',
  };

  document.body.replaceChildren();

  const app = make('div', 'app');
  const head = make('div', 'head');
  const title = make('div', 'title', 'Lucky Charm');
  head.append(title);

  const tabs = make('div', 'tabs');
  const tabGallery = make('button', 'tab-btn active', 'Gallery');
  const tabGeneral = make('button', 'tab-btn', 'General');
  const tabAbout = make('button', 'tab-btn', 'About');
  tabs.append(tabGallery, tabGeneral, tabAbout);

  const panelGallery = make('div', 'panel');
  const grid = make('div', 'grid');
  panelGallery.append(grid);

  const panelGeneral = make('div', 'panel hidden');
  const generalBody = make('div', 'panel-body');
  generalBody.innerHTML = '<h4>General</h4><p>Overlay behavior and shortcuts can be configured from this panel in the next milestone.</p>';
  panelGeneral.append(generalBody);

  const panelAbout = make('div', 'panel hidden');
  const aboutBody = make('div', 'panel-body');
  aboutBody.innerHTML = '<h4>About</h4><p>Lucky Charm desktop utility.</p>';
  panelAbout.append(aboutBody);

  app.append(head, tabs, panelGallery, panelGeneral, panelAbout);
  document.body.append(app);

  function setTab(nextTab: 'gallery' | 'general' | 'about') {
    state.tab = nextTab;
    tabGallery.classList.toggle('active', nextTab === 'gallery');
    tabGeneral.classList.toggle('active', nextTab === 'general');
    tabAbout.classList.toggle('active', nextTab === 'about');
    panelGallery.classList.toggle('hidden', nextTab !== 'gallery');
    panelGeneral.classList.toggle('hidden', nextTab !== 'general');
    panelAbout.classList.toggle('hidden', nextTab !== 'about');
  }

  function renderGrid() {
    grid.replaceChildren();
    for (const charm of state.charms) {
      const card = make('button', 'card');
      if (state.selected && state.selected.id === charm.id) {
        card.classList.add('selected');
      }
      const top = make('div', 'card-top');
      if (charm.art.type === 'image') {
        const image = make('img', 'card-image') as HTMLImageElement;
        image.src = charm.art.src;
        image.alt = charm.name;
        top.append(image);
      } else {
        const emoji = make('div', 'card-emoji', charm.art.glyph);
        top.append(emoji);
      }
      const name = make('div', 'card-name', charm.name);
      const badge = make('div', 'badge', charm.region);
      const desc = make('div', 'card-desc', charm.description);
      card.append(top, name, badge, desc);
      card.addEventListener('click', async () => {
        await api.selectCharm(charm.id);
      });
      grid.append(card);
    }
  }

  tabGallery.addEventListener('click', () => setTab('gallery'));
  tabGeneral.addEventListener('click', () => setTab('general'));
  tabAbout.addEventListener('click', () => setTab('about'));

  api.onCharmsUpdated((charms) => {
    state.charms = charms;
    renderGrid();
  });

  api.onCharmSelected((charm) => {
    state.selected = charm;
    renderGrid();
  });

  api.onGalleryTab((tab) => {
    setTab(tab);
  });

  void api.setGalleryOpen(true);
  void api.getCharms().then((charms) => {
    state.charms = charms;
    state.selected = charms[0] ?? null;
    renderGrid();
  });
}
