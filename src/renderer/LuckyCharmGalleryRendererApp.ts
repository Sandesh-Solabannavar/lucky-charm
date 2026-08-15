import type { Charm } from '../shared/Charm';
import { hangerPartsFor } from '../shared/hanger';

export type GalleryRendererElectronApi = {
  getCharms: () => Promise<Charm[]>;
  getSelectedCharm: () => Promise<Charm>;
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
  background: #0b0f19;
  background-image: radial-gradient(circle at 50% -20%, #17213b 0%, #0b0f19 75%);
  color: #f1f5f9;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 999px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.22);
}
.app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.head {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 148px 0 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: #0f1424;
  z-index: 10;
  -webkit-app-region: drag;
  user-select: none;
}
.title-group {
  display: flex;
  align-items: center;
  gap: 10px;
  -webkit-app-region: drag;
}
.title-logo {
  font-size: 18px;
  line-height: 1;
}
.title {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #f8fafc;
}
.version-badge {
  font-size: 10px;
  font-weight: 500;
  padding: 1px 6px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  color: #94a3b8;
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.tabs-wrapper {
  padding: 8px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(11, 15, 26, 0.75);
  display: flex;
  align-items: center;
  -webkit-app-region: no-drag;
}
.tabs {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border-radius: 9px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.07);
  -webkit-app-region: no-drag;
}
.tab-btn {
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #94a3b8;
  padding: 5px 14px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
  -webkit-app-region: no-drag;
}
.tab-btn:hover {
  color: #f8fafc;
  background: rgba(255, 255, 255, 0.05);
}
.tab-btn.active {
  background: rgba(59, 130, 246, 0.22);
  color: #ffffff;
  border: 1px solid rgba(96, 165, 250, 0.45);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15);
}
.panel {
  flex: 1;
  overflow: auto;
}
.panel.hidden { display: none; }
@keyframes cardDrop {
  0% {
    transform: translateY(-90px);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  70% {
    transform: translateY(6px);
  }
  85% {
    transform: translateY(-3px);
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}
.grid {
  padding: 20px 22px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(215px, 1fr));
  gap: 16px;
}
.card {
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, rgba(24, 33, 58, 0.6) 0%, rgba(13, 18, 34, 0.75) 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.06);
  min-height: 220px;
  padding: 12px 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  color: #f1f5f9;
  cursor: pointer;
  text-align: center;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  backdrop-filter: blur(10px);
  overflow: hidden;
}
.card:hover {
  transform: translateY(-2px);
  border-color: rgba(96, 165, 250, 0.4);
  background: linear-gradient(180deg, rgba(30, 42, 74, 0.75) 0%, rgba(17, 24, 46, 0.85) 100%);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 16px rgba(59, 130, 246, 0.18);
}
.card.selected {
  border-color: #3b82f6;
  background: linear-gradient(180deg, rgba(32, 48, 88, 0.85) 0%, rgba(18, 28, 54, 0.95) 100%);
  box-shadow: 0 0 0 1px #3b82f6, 0 8px 24px rgba(59, 130, 246, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.22);
}
.card-dangle-stage {
  position: relative;
  width: 100%;
  height: 124px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  border-radius: 10px;
  background: radial-gradient(circle at 50% 65%, rgba(59, 130, 246, 0.08) 0%, transparent 75%);
}
.card-dangle-assembly {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: cardDrop 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  transform-origin: 50% 0%;
  transition: transform 0.25s ease-out;
}
.card:hover .card-dangle-assembly {
  transform: translateY(-2px) rotate(3.5deg);
}
.card-thread {
  width: 2px;
  height: 24px;
  background: linear-gradient(180deg, #d6ae60 0%, #9f7b40 100%);
  border-radius: 1px;
}
.card-hanger-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}
.card-bead {
  width: var(--bead-size, 10px);
  height: var(--bead-size, 10px);
  border-radius: 999px;
  background: radial-gradient(circle at 30% 30%, #ffffff 0%, var(--bead-color, #f1f2f7) 55%, var(--bead-shadow, #d8dbe8) 100%);
  box-shadow: inset -1px -1px 2px rgba(0, 0, 0, 0.4);
}
.card-bead.striped {
  background: repeating-linear-gradient(0deg, #d8211d 0 26%, #ffe266 26% 42%, #d8211d 42% 68%, #ffe266 68% 84%, #d8211d 84% 100%);
}
.card-hanger-img {
  width: 18px;
  height: 18px;
  object-fit: contain;
}
.card-clover {
  font-size: 13px;
  line-height: 1;
}
.card-connector {
  width: 1.5px;
  height: 3px;
  background: #9f7b40;
}
.card-charm-container {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card-emoji {
  font-size: 38px;
  filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.35));
}
.card-image {
  max-width: 50px;
  max-height: 50px;
  object-fit: contain;
  filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.35));
}
.card-name {
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #f8fafc;
  margin-top: 2px;
}
.badge {
  border-radius: 9999px;
  padding: 2px 9px;
  font-size: 10.5px;
  font-weight: 500;
  background: rgba(59, 130, 246, 0.14);
  color: #93c5fd;
  border: 1px solid rgba(96, 165, 250, 0.28);
  letter-spacing: 0.01em;
}
.card-desc {
  font-size: 11.5px;
  line-height: 1.45;
  color: #94a3b8;
  margin-top: 2px;
}
.panel-body {
  max-width: 580px;
  padding: 24px;
}
.panel-title {
  margin: 0 0 18px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #f8fafc;
}
.setting-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 152px;
  align-items: center;
  gap: 16px;
  min-height: 72px;
  padding: 14px 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  background: rgba(19, 27, 48, 0.65);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  transition: border-color 0.15s, background 0.15s;
}
.setting-row:hover {
  border-color: rgba(255, 255, 255, 0.13);
  background: rgba(24, 34, 60, 0.75);
}
.setting-row + .setting-row {
  margin-top: 10px;
}
.setting-label {
  font-size: 13px;
  font-weight: 600;
  color: #f8fafc;
}
.setting-help {
  margin: 3px 0 0;
  color: #94a3b8;
  font-size: 11.5px;
  line-height: 1.4;
}
.setting-status {
  margin: 4px 0 0;
  font-size: 11.5px;
  font-weight: 500;
  color: #6ee7b7;
}
.setting-status.error { color: #fca5a5; }
.setting-input {
  width: 68px;
  justify-self: end;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 7px;
  background: rgba(8, 12, 22, 0.85);
  color: #f8fafc;
  padding: 6px 9px;
  font-size: 12.5px;
  font-family: inherit;
  font-weight: 500;
  transition: all 0.15s ease;
}
.setting-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
}
.setting-inputs {
  display: flex;
  gap: 8px;
  justify-self: end;
}
.setting-row.hidden { display: none; }
.setting-toggle {
  width: 19px;
  height: 19px;
  justify-self: end;
  accent-color: #3b82f6;
  cursor: pointer;
}
.about-card {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  background: rgba(19, 27, 48, 0.65);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  padding: 20px;
  backdrop-filter: blur(12px);
}
.about-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.about-logo {
  font-size: 28px;
}
.about-title {
  font-size: 16px;
  font-weight: 700;
  color: #f8fafc;
}
.about-desc {
  font-size: 12.5px;
  line-height: 1.6;
  color: #94a3b8;
  margin: 0 0 16px;
}
.shortcut-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
}
.shortcut-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #cbd5e1;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.shortcut-row:last-child { border-bottom: 0; }
.kbd {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 5px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #93c5fd;
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
  const titleGroup = make('div', 'title-group');
  const titleLogo = make('span', 'title-logo', '🧿');
  const title = make('span', 'title', 'Lucky Charm');
  const versionBadge = make('span', 'version-badge', 'v0.1.0');
  titleGroup.append(titleLogo, title, versionBadge);
  head.append(titleGroup);

  const tabsWrapper = make('div', 'tabs-wrapper');
  const tabs = make('div', 'tabs');
  const tabGallery = make('button', 'tab-btn active', 'Gallery');
  const tabGeneral = make('button', 'tab-btn', 'General');
  const tabAbout = make('button', 'tab-btn', 'About');
  tabs.append(tabGallery, tabGeneral, tabAbout);
  tabsWrapper.append(tabs);

  const panelGallery = make('div', 'panel');
  const grid = make('div', 'grid');
  panelGallery.append(grid);

  const panelGeneral = make('div', 'panel hidden');
  const generalBody = make('div', 'panel-body');
  const generalTitle = make('h4', 'panel-title', 'General Settings');
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
  const aboutCard = make('div', 'about-card');
  const aboutHeader = make('div', 'about-header');
  const aboutLogo = make('span', 'about-logo', '🧿');
  const aboutTitle = make('span', 'about-title', 'Lucky Charm Desktop');
  aboutHeader.append(aboutLogo, aboutTitle);
  const aboutDesc = make(
    'p',
    'about-desc',
    'A customizable, physics-driven desktop amulet companion inspired by traditional world charms. Dangles smoothly from your top display edge with realistic pendulum tension and interactive rituals.',
  );
  const shortcutList = make('div', 'shortcut-list');
  const shortcuts: Array<[string, string]> = [
    ['Toggle Charm Overlay', 'Ctrl/Cmd + Shift + D'],
    ['Perform Charm Ritual', 'Ctrl/Cmd + Shift + S'],
    ['Open Gallery & Settings', 'Ctrl/Cmd + Shift + G'],
  ];
  for (const [action, key] of shortcuts) {
    const row = make('div', 'shortcut-row');
    const label = make('span', undefined, action);
    const kbd = make('kbd', 'kbd', key);
    row.append(label, kbd);
    shortcutList.append(row);
  }
  aboutCard.append(aboutHeader, aboutDesc, shortcutList);
  aboutBody.append(aboutCard);
  panelAbout.append(aboutBody);

  app.append(head, tabsWrapper, panelGallery, panelGeneral, panelAbout);
  document.body.append(app);

  function setTab(nextTab: 'gallery' | 'general' | 'about') {
    state.tab = nextTab;
    tabGallery.classList.toggle('active', nextTab === 'gallery');
    tabGeneral.classList.toggle('active', nextTab === 'general');
    tabAbout.classList.toggle('active', nextTab === 'about');
    panelGallery.classList.toggle('hidden', nextTab !== 'gallery');
    panelGeneral.classList.toggle('hidden', nextTab !== 'general');
    panelAbout.classList.toggle('hidden', nextTab !== 'about');
    if (nextTab === 'gallery') {
      renderGrid();
    }
  }

  function renderGrid() {
    grid.replaceChildren();
    state.charms.forEach((charm, index) => {
      const card = make('button', 'card');
      if (state.selected && state.selected.id === charm.id) {
        card.classList.add('selected');
      }

      const stage = make('div', 'card-dangle-stage');
      const assembly = make('div', 'card-dangle-assembly');
      assembly.style.animationDelay = `${index * 40}ms`;

      const thread = make('div', 'card-thread');
      assembly.append(thread);

      const hangerParts = hangerPartsFor(charm);
      if (hangerParts.length > 0) {
        const hangerStack = make('div', 'card-hanger-stack');
        for (const part of hangerParts) {
          if (part.type === 'bead') {
            const bead = make('div', `card-bead${part.striped ? ' striped' : ''}`);
            const miniSize = Math.max(7, Math.round(part.size * 0.65));
            bead.style.setProperty('--bead-size', `${miniSize}px`);
            bead.style.setProperty('--bead-color', part.color);
            bead.style.setProperty('--bead-shadow', part.shadow);
            hangerStack.append(bead);
          } else if (part.type === 'horse') {
            const img = make('img', 'card-hanger-img') as HTMLImageElement;
            img.src = part.source ?? '';
            hangerStack.append(img);
          } else {
            hangerStack.append(make('div', 'card-clover', '☘'));
          }
          const conn = make('div', 'card-connector');
          hangerStack.append(conn);
        }
        assembly.append(hangerStack);
      }

      const charmContainer = make('div', 'card-charm-container');
      if (charm.art.type === 'image') {
        const image = make('img', 'card-image') as HTMLImageElement;
        image.src = charm.art.src;
        image.alt = charm.name;
        charmContainer.append(image);
      } else {
        const emoji = make('div', 'card-emoji', charm.art.glyph);
        charmContainer.append(emoji);
      }
      assembly.append(charmContainer);
      stage.append(assembly);

      const name = make('div', 'card-name', charm.name);
      const badge = make('div', 'badge', charm.region);
      const desc = make('div', 'card-desc', charm.description);
      card.append(stage, name, badge, desc);
      card.addEventListener('click', async () => {
        await api.selectCharm(charm.id);
      });
      grid.append(card);
    });
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

  void Promise.all([
    api.getCharms(),
    api.getSelectedCharm(),
    api.getFullDesktopOverlay(),
    api.getCompactOverlaySize(),
  ]).then(([
    charms,
    selected,
    fullDesktopOverlay,
    compactOverlaySize,
  ]) => {
    state.charms = charms;
    state.selected = selected ?? charms[0] ?? null;
    state.fullDesktopOverlay = fullDesktopOverlay;
    state.compactOverlaySize = compactOverlaySize;
    renderGrid();
    renderCompactOverlaySize();
    renderFullDesktopOverlay();
  });
}
