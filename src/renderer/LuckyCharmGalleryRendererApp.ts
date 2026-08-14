import type { Charm } from '../shared/Charm';

export type GalleryRendererElectronApi = {
  getCharms: () => Promise<Charm[]>;
  selectCharm: (id: string) => Promise<Charm | undefined>;
  setGalleryOpen: (open: boolean) => Promise<boolean>;
  getFullDesktopOverlay: () => Promise<boolean>;
  setFullDesktopOverlay: (enabled: boolean) => Promise<boolean>;
  getCompactOverlaySize: () => Promise<{ width: number; height: number }>;
  setCompactOverlaySize: (size: { width: number; height: number }) => Promise<{ width: number; height: number }>;
  onCharmsUpdated: (callback: (charms: Charm[]) => void) => void;
  onCharmSelected: (callback: (charm: Charm) => void) => void;
  onGalleryTab: (callback: (tab: 'gallery' | 'general' | 'about') => void) => void;
  onFullDesktopOverlayUpdated: (callback: (enabled: boolean) => void) => void;
  onCompactOverlaySizeUpdated: (callback: (size: { width: number; height: number }) => void) => void;
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
  align-self: center;
  text-align: center;
}
.badge {
  align-self: center;
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
  text-align: center;
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
.setting-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 152px;
  align-items: center;
  gap: 16px;
  max-width: 460px;
  min-height: 68px;
  padding: 12px;
  border: 1px solid rgba(255,255,255,0.11);
  border-radius: 10px;
  background: rgba(255,255,255,0.04);
}
.setting-row + .setting-row {
  margin-top: 8px;
}
.setting-label {
  font-weight: 700;
  color: #edf2ff;
}
.setting-help,
.setting-status {
  margin: 2px 0 0;
  color: rgba(216, 226, 255, 0.78);
  font-size: 11px;
}
.setting-status.error { color: #ffb3b3; }
.setting-input {
  width: 68px;
  justify-self: end;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 7px;
  background: rgba(8, 13, 31, 0.72);
  color: #edf2ff;
  padding: 7px 8px;
  font: inherit;
}
.setting-inputs {
  display: flex;
  gap: 8px;
  justify-self: end;
}
.setting-row.hidden { display: none; }
.setting-toggle {
  width: 18px;
  height: 18px;
  justify-self: end;
  accent-color: #7ca5ff;
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

  const state: {
    charms: Charm[];
    selected: Charm | null;
    tab: 'gallery' | 'general' | 'about';
    fullDesktopOverlay: boolean;
    compactOverlaySize: { width: number; height: number };
  } = {
    charms: [],
    selected: null,
    tab: 'gallery',
    fullDesktopOverlay: true,
    compactOverlaySize: { width: 420, height: 760 },
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
  const generalTitle = make('h4', undefined, 'General');
  const compactOverlaySizeRow = make('div', 'setting-row');
  const compactOverlaySizeCopy = make('div');
  const compactOverlaySizeLabel = make('div', 'setting-label', 'Compact overlay size');
  const compactOverlaySizeHelp = make('p', 'setting-help', 'Width and height in pixels (minimum 240 x 360).');
  const compactOverlaySizeStatus = make('p', 'setting-status');
  compactOverlaySizeCopy.append(compactOverlaySizeLabel, compactOverlaySizeHelp, compactOverlaySizeStatus);
  const compactOverlayInputs = make('div', 'setting-inputs');
  const compactOverlayWidthInput = make('input', 'setting-input') as HTMLInputElement;
  const compactOverlayHeightInput = make('input', 'setting-input') as HTMLInputElement;
  for (const [input, min, max, label] of [
    [compactOverlayWidthInput, '240', '3840', 'Overlay width in pixels'],
    [compactOverlayHeightInput, '360', '2160', 'Overlay height in pixels'],
  ] as const) {
    input.type = 'number';
    input.min = min;
    input.max = max;
    input.step = '1';
    input.inputMode = 'numeric';
    input.setAttribute('aria-label', label);
  }
  compactOverlayInputs.append(compactOverlayWidthInput, compactOverlayHeightInput);
  compactOverlaySizeRow.append(compactOverlaySizeCopy, compactOverlayInputs);
  const fullDesktopOverlayRow = make('div', 'setting-row');
  const fullDesktopOverlayCopy = make('div');
  const fullDesktopOverlayLabel = make('div', 'setting-label', 'Desktop-wide overlay');
  const fullDesktopOverlayHelp = make('p', 'setting-help', 'Let the charm be dragged anywhere on the active monitor.');
  fullDesktopOverlayCopy.append(fullDesktopOverlayLabel, fullDesktopOverlayHelp);
  const fullDesktopOverlayInput = make('input', 'setting-toggle') as HTMLInputElement;
  fullDesktopOverlayInput.type = 'checkbox';
  fullDesktopOverlayInput.setAttribute('aria-label', 'Enable desktop-wide overlay');
  fullDesktopOverlayRow.append(fullDesktopOverlayCopy, fullDesktopOverlayInput);
  generalBody.append(generalTitle, fullDesktopOverlayRow, compactOverlaySizeRow);
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

  function renderCompactOverlaySize() {
    compactOverlayWidthInput.value = String(state.compactOverlaySize.width);
    compactOverlayHeightInput.value = String(state.compactOverlaySize.height);
  }

  function renderFullDesktopOverlay() {
    fullDesktopOverlayInput.checked = state.fullDesktopOverlay;
    compactOverlaySizeRow.classList.toggle('hidden', state.fullDesktopOverlay);
  }

  const saveCompactOverlaySize = async () => {
    const width = Number(compactOverlayWidthInput.value);
    const height = Number(compactOverlayHeightInput.value);
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 240 || width > 3840 || height < 360 || height > 2160) {
      compactOverlaySizeStatus.textContent = 'Enter whole pixels: width 240-3840, height 360-2160.';
      compactOverlaySizeStatus.classList.add('error');
      renderCompactOverlaySize();
      return;
    }
    state.compactOverlaySize = await api.setCompactOverlaySize({ width, height });
    compactOverlaySizeStatus.textContent = 'Saved.';
    compactOverlaySizeStatus.classList.remove('error');
    renderCompactOverlaySize();
  };
  compactOverlayWidthInput.addEventListener('change', () => void saveCompactOverlaySize());
  compactOverlayHeightInput.addEventListener('change', () => void saveCompactOverlaySize());

  fullDesktopOverlayInput.addEventListener('change', async () => {
    state.fullDesktopOverlay = await api.setFullDesktopOverlay(fullDesktopOverlayInput.checked);
    renderFullDesktopOverlay();
    if (!state.fullDesktopOverlay) {
      compactOverlayWidthInput.focus();
    }
  });

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

  api.onFullDesktopOverlayUpdated((enabled) => {
    state.fullDesktopOverlay = enabled;
    renderFullDesktopOverlay();
  });

  api.onCompactOverlaySizeUpdated((size) => {
    state.compactOverlaySize = size;
    renderCompactOverlaySize();
  });

  void Promise.all([api.getCharms(), api.getFullDesktopOverlay(), api.getCompactOverlaySize()]).then(([
    charms,
    fullDesktopOverlay,
    compactOverlaySize,
  ]) => {
    state.charms = charms;
    state.selected = charms[0] ?? null;
    state.fullDesktopOverlay = fullDesktopOverlay;
    state.compactOverlaySize = compactOverlaySize;
    renderGrid();
    renderCompactOverlaySize();
    renderFullDesktopOverlay();
  });
}
