import type { Charm } from '../shared/Charm';
import { attachmentTopRatio, hangerPartsFor, type HangerPart } from '../shared/hanger';

type UpdateStatus = {
  status: string;
  message: string;
  version: string;
};

export type RendererElectronApi = {
  getCharms: () => Promise<Charm[]>;
  getSelectedCharm: () => Promise<Charm>;
  selectCharm: (id: string) => Promise<Charm | undefined>;
  toggleWindow: () => Promise<boolean>;
  toggleGallery: () => Promise<boolean>;
  setGalleryOpen: (open: boolean) => Promise<boolean>;
  triggerRitual: () => Promise<Charm>;
  moveWindow: (deltaX: number, deltaY: number) => Promise<boolean>;
  setOverlayInteractive: (interactive: boolean) => Promise<boolean>;
  getDragBoundary: () => Promise<number>;
  getFullDesktopOverlay: () => Promise<boolean>;
  toggleUndangle: () => Promise<boolean>;
  openSettings: () => Promise<boolean>;
  checkUpdates: () => Promise<UpdateStatus>;
  downloadUpdate: () => Promise<UpdateStatus>;
  installUpdate: () => Promise<UpdateStatus>;
  quitApp: () => Promise<boolean>;
  onCharmsUpdated: (callback: (charms: Charm[]) => void) => void;
  onCharmSelected: (callback: (charm: Charm) => void) => void;
  onVisibleUpdated: (callback: (visible: boolean) => void) => void;
  onGalleryUpdated: (callback: (isOpen: boolean) => void) => void;
  onRitualTriggered: (callback: (charm: Charm) => void) => void;
  onUndangleUpdated: (callback: (undangled: boolean) => void) => void;
  onSettingsOpened: (callback: () => void) => void;
  onUpdateStatus: (callback: (status: UpdateStatus) => void) => void;
  onDragBoundaryUpdated: (callback: (dragBoundary: number) => void) => void;
  onFullDesktopOverlayUpdated: (callback: (enabled: boolean) => void) => void;
};

const css = `
* { box-sizing: border-box; }
html, body {
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  color: #f8fafc;
}
body {
  background: transparent;
  user-select: none;
}
.app {
  position: relative;
  width: 100%;
  height: 100%;
}
.home {
  position: absolute;
  inset: 0;
}
.thread-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.thread {
  fill: none;
  stroke: url(#threadGradient);
  stroke-width: 3.1;
  stroke-linecap: round;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.25));
}
.anchor-dot {
  fill: rgba(164, 129, 72, 0.95);
}
.hanger-stack {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.hanger-bead {
  position: absolute;
  width: var(--bead-size, 13px);
  height: var(--bead-size, 13px);
  border-radius: 999px;
  background: radial-gradient(circle at 30% 30%, #ffffff 0%, var(--bead-color, #f1f2f7) 55%, var(--bead-shadow, #d8dbe8) 100%);
  box-shadow: inset -1px -2px 3px color-mix(in srgb, var(--bead-shadow, #d8dbe8) 72%, #000);
}
.hanger-bead.striped {
  background: repeating-linear-gradient(0deg, #d8211d 0 26%, #ffe266 26% 42%, #d8211d 42% 68%, #ffe266 68% 84%, #d8211d 84% 100%);
}
.hanger-image {
  position: absolute;
  width: 28px;
  height: 28px;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.22));
}
.hanger-clover {
  position: absolute;
  width: 20px;
  height: 20px;
  font-size: 21px;
  line-height: 20px;
  text-align: center;
  filter: drop-shadow(0 1px 1px rgba(0,0,0,0.18));
}
.charm {
  position: absolute;
  width: 74px;
  height: 74px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  -webkit-app-region: no-drag;
  touch-action: none;
  transform-origin: center top;
}
.charm:active { cursor: grabbing; }
.charm-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  filter: drop-shadow(0 4px 14px rgba(0,0,0,0.3));
}
.charm-emoji {
  display: block;
  line-height: 1;
  pointer-events: none;
  filter: drop-shadow(0 4px 14px rgba(0,0,0,0.3));
}
.charm-name {
  position: absolute;
  font-size: 30px;
  font-weight: 700;
  letter-spacing: 0.01em;
  white-space: nowrap;
  text-shadow: 0 4px 16px rgba(0,0,0,0.28);
  transform: translateX(-50%);
}
.tip {
  position: absolute;
  font-size: 13px;
  letter-spacing: 0.02em;
  opacity: 0.88;
  transform: translateX(-50%);
}
.charm-name,
.tip {
  display: none;
}
.toast {
  position: absolute;
  right: 18px;
  top: 18px;
  max-width: 280px;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(13, 17, 30, 0.92);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(59, 130, 246, 0.35);
  font-size: 12px;
  font-weight: 500;
  color: #f8fafc;
  box-shadow: 0 12px 32px rgba(0,0,0,0.45), 0 0 16px rgba(59, 130, 246, 0.15);
}
.toast.hidden { display: none; }
.menu {
  position: absolute;
  width: 250px;
  padding: 6px;
  border-radius: 12px;
  background: rgba(13, 17, 30, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px) saturate(1.2);
  z-index: 20;
}
.menu.hidden { display: none; }
.menu-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(148, 163, 184, 0.85);
  padding: 5px 8px 6px;
}
.menu-btn {
  width: 100%;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #e2e8f0;
  text-align: left;
  padding: 7px 10px;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  transition: all 0.12s ease;
  user-select: none;
}
.menu-btn:hover,
.menu-btn.active {
  background: rgba(59, 130, 246, 0.22);
  color: #ffffff;
}
.menu-btn-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.menu-btn-icon {
  font-size: 13px;
  opacity: 0.9;
  width: 16px;
  display: inline-flex;
  justify-content: center;
}
.menu-shortcut {
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: #94a3b8;
  letter-spacing: 0.05em;
}
.menu-arrow {
  font-size: 14px;
  color: #94a3b8;
}
.menu-sep {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 5px 4px;
}
.submenu {
  position: absolute;
  width: 220px;
  max-height: 380px;
  overflow-y: auto;
  padding: 6px;
  border-radius: 12px;
  background: rgba(13, 17, 30, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px) saturate(1.2);
  z-index: 25;
}
.submenu.hidden { display: none; }
.submenu-item {
  width: 100%;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #e2e8f0;
  text-align: left;
  padding: 6px 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.12s ease;
}
.submenu-item:hover {
  background: rgba(59, 130, 246, 0.22);
  color: #ffffff;
}
.submenu-item.selected {
  color: #ffffff;
}
.submenu-check {
  width: 14px;
  font-size: 12px;
  color: #60a5fa;
  font-weight: 700;
  display: inline-flex;
  justify-content: center;
}
.submenu-icon {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
}
.submenu-icon img {
  width: 18px;
  height: 18px;
  object-fit: contain;
}
.submenu-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
`;

function make<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function distancePointToSegment(
  pointX: number,
  pointY: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
) {
  const segmentDx = endX - startX;
  const segmentDy = endY - startY;
  const segmentLengthSquared = segmentDx * segmentDx + segmentDy * segmentDy;
  if (segmentLengthSquared <= 0.0001) {
    const dx = pointX - startX;
    const dy = pointY - startY;
    return Math.hypot(dx, dy);
  }

  const projection = ((pointX - startX) * segmentDx + (pointY - startY) * segmentDy) / segmentLengthSquared;
  const t = clamp(projection, 0, 1);
  const projectedX = startX + segmentDx * t;
  const projectedY = startY + segmentDy * t;
  return Math.hypot(pointX - projectedX, pointY - projectedY);
}

export function mountLuckyCharmRenderer(api: RendererElectronApi) {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const state: {
    selected: Charm | null;
    undangled: boolean;
    draggingCharm: boolean;
    dragPointerOffset: { x: number; y: number };
    charmSize: { width: number; height: number };
    physics: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      targetX: number;
      targetY: number;
    };
    toastTimeoutId: number | null;
    overlayInteractive: boolean;
    attachmentOffset: number;
    threadLength: number;
    lastDragSample: { x: number; y: number; time: number } | null;
    dragBoundary: number;
    fullDesktopOverlay: boolean;
  } = {
    selected: null,
    undangled: false,
    draggingCharm: false,
    dragPointerOffset: { x: 0, y: 0 },
    charmSize: { width: 74, height: 74 },
    physics: {
      x: 224,
      y: 152,
      vx: 0,
      vy: 0,
      targetX: 224,
      targetY: 152,
    },
    toastTimeoutId: null,
    overlayInteractive: false,
    attachmentOffset: 0,
    threadLength: 100,
    lastDragSample: null,
    dragBoundary: 8,
    fullDesktopOverlay: false,
  };

  document.body.replaceChildren();

  const app = make('div', 'app');
  const home = make('div', 'home');
  const threadLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  threadLayer.classList.add('thread-layer');
  threadLayer.setAttribute('viewBox', '0 0 1 1');
  threadLayer.setAttribute('preserveAspectRatio', 'none');
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const threadGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  threadGradient.setAttribute('id', 'threadGradient');
  // Object-bounding-box gradients collapse for a perfectly vertical path.
  // Use the overlay's coordinate system so the resting thread remains painted.
  threadGradient.setAttribute('gradientUnits', 'userSpaceOnUse');
  threadGradient.setAttribute('x1', '0');
  threadGradient.setAttribute('y1', '0');
  threadGradient.setAttribute('x2', '0');
  threadGradient.setAttribute('y2', '1');
  const threadStopA = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  threadStopA.setAttribute('offset', '0%');
  threadStopA.setAttribute('stop-color', '#c7aa76');
  const threadStopB = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  threadStopB.setAttribute('offset', '48%');
  threadStopB.setAttribute('stop-color', '#9f7b40');
  const threadStopC = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  threadStopC.setAttribute('offset', '100%');
  threadStopC.setAttribute('stop-color', '#7f602f');
  threadGradient.append(threadStopA, threadStopB, threadStopC);
  defs.append(threadGradient);
  const threadPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  threadPath.classList.add('thread');
  const anchorDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  anchorDot.classList.add('anchor-dot');
  anchorDot.setAttribute('r', '3');
  threadLayer.append(defs, threadPath, anchorDot);

  const hangerStack = make('div', 'hanger-stack');

  const charm = make('div', 'charm');
  const charmImage = make('img', 'charm-image') as HTMLImageElement;
  charmImage.alt = 'Charm';
  const charmEmoji = make('div', 'charm-emoji');
  charm.append(charmImage, charmEmoji);

  const charmName = make('div', 'charm-name', 'Nazar boncugu');
  const tip = make('div', 'tip', 'Right click the charm for options');
  const toast = make('div', 'toast hidden');
  home.append(threadLayer, hangerStack, charm, charmName, tip, toast);

  let allCharms: Charm[] = [];
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl+';

  const menu = make('div', 'menu hidden');
  const menuTitle = make('div', 'menu-title', 'Lucky Charm');

  const createMenuItem = (label: string, shortcut = '', iconHtml = '', arrow = false) => {
    const btn = make('button', 'menu-btn');
    const left = make('div', 'menu-btn-left');
    if (iconHtml) {
      const icon = make('span', 'menu-btn-icon');
      icon.innerHTML = iconHtml;
      left.append(icon);
    }
    const labelSpan = make('span', 'menu-btn-label', label);
    left.append(labelSpan);
    btn.append(left);
    if (shortcut) {
      const shortcutSpan = make('span', 'menu-shortcut', shortcut);
      btn.append(shortcutSpan);
    }
    if (arrow) {
      const arrowSpan = make('span', 'menu-arrow', '›');
      btn.append(arrowSpan);
    }
    return { btn, labelSpan };
  };

  const menuUndangle = createMenuItem('Undangle', `${modKey}D`);
  const menuRitual = createMenuItem('Hang a fresh garland', `${modKey}X`);
  const sep1 = make('div', 'menu-sep');
  const menuChoose = createMenuItem('Choose a charm', '', '', true);
  const menuGallery = createMenuItem('Open the gallery', '');
  const sep2 = make('div', 'menu-sep');
  const menuSettings = createMenuItem('Open settings', `${modKey},`, '⚙');
  const menuUpdates = createMenuItem('Check for updates', '');
  let updateAvailable = false;
  let updateDownloaded = false;
  const menuQuit = createMenuItem('Quit Lucky Charm', `${modKey}Q`, '⌧');

  menu.append(
    menuTitle,
    menuUndangle.btn,
    menuRitual.btn,
    sep1,
    menuChoose.btn,
    menuGallery.btn,
    sep2,
    menuSettings.btn,
    menuUpdates.btn,
    menuQuit.btn,
  );

  const submenu = make('div', 'submenu hidden');

  app.append(home, menu, submenu);
  document.body.append(app);

  const anchor = { x: 260, y: 0 };

  function updateAnchorPosition() {
    anchor.x = state.fullDesktopOverlay ? Math.max(160, window.innerWidth - 160) : 260;
  }

  function updateThreadViewport() {
    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);
    threadLayer.setAttribute('viewBox', `0 0 ${width} ${height}`);
    threadGradient.setAttribute('y2', String(height));
  }

  function applyThreadTension(dt: number) {
    const attachmentX = state.physics.x + state.charmSize.width / 2;
    const attachmentY = state.physics.y + state.attachmentOffset;
    const dx = attachmentX - anchor.x;
    const dy = attachmentY - anchor.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 0.001) return;

    const normalX = dx / distance;
    const normalY = dy / distance;
    const stretch = distance - state.threadLength;
    if (stretch <= 0) return;

    // The cord can stretch while dragged, then spring back without an abrupt snap.
    const radialVelocity = state.physics.vx * normalX + state.physics.vy * normalY;
    const tension = stretch * 95 + Math.max(0, radialVelocity) * 18;
    state.physics.vx -= normalX * tension * dt;
    state.physics.vy -= normalY * tension * dt;
  }

  function resetCharmToThreadRest() {
    state.physics.x = anchor.x - state.charmSize.width / 2;
    state.physics.y = anchor.y + state.threadLength - state.attachmentOffset;
    state.physics.vx = 0;
    state.physics.vy = 0;
  }

  function showToast(message: string) {
    toast.textContent = message;
    toast.classList.remove('hidden');
    if (state.toastTimeoutId !== null) {
      window.clearTimeout(state.toastTimeoutId);
    }
    state.toastTimeoutId = window.setTimeout(() => {
      toast.classList.add('hidden');
      state.toastTimeoutId = null;
    }, 1800);
  }

  function updateThreadVisual() {
    updateThreadViewport();
    const charmCenterX = state.physics.x + state.charmSize.width / 2;
    const attachmentY = Math.round(state.physics.y + state.attachmentOffset);
    const swing = clamp(-state.physics.vx * 0.025, -10, 10);
    const controlX = anchor.x + (charmCenterX - anchor.x) * 0.52 + swing;
    const controlY = anchor.y + (attachmentY - anchor.y) * 0.46;
    const d = `M ${anchor.x} ${anchor.y} Q ${controlX} ${controlY} ${charmCenterX} ${attachmentY}`;
    threadPath.setAttribute('d', d);
    anchorDot.setAttribute('cx', String(anchor.x));
    anchorDot.setAttribute('cy', String(anchor.y));

    const threadParts = Array.from(hangerStack.children) as HTMLElement[];
    const firstPartT = 0.72;
    const lastPartT = 0.96;
    threadParts.forEach((part, index) => {
      const t = threadParts.length === 1
        ? (firstPartT + lastPartT) / 2
        : firstPartT + ((lastPartT - firstPartT) * index) / (threadParts.length - 1);
      const inverseT = 1 - t;
      const x = inverseT * inverseT * anchor.x + 2 * inverseT * t * controlX + t * t * charmCenterX;
      const y = inverseT * inverseT * anchor.y + 2 * inverseT * t * controlY + t * t * attachmentY;
      part.style.left = `${x}px`;
      part.style.top = `${y}px`;
      part.style.transform = 'translate(-50%, -50%)';
    });

    if (state.undangled) {
      threadPath.style.opacity = '0';
      anchorDot.style.opacity = '0';
      hangerStack.style.opacity = '0';
    } else {
      threadPath.style.opacity = '1';
      anchorDot.style.opacity = '1';
      hangerStack.style.opacity = '1';
    }
  }

  function layoutCharm() {
    charm.style.left = `${state.physics.x}px`;
    charm.style.top = `${state.physics.y}px`;
    const centerX = state.physics.x + state.charmSize.width / 2;
    charmName.style.left = `${centerX}px`;
    charmName.style.top = `${state.physics.y + state.charmSize.height + 34}px`;
    tip.style.left = `${centerX}px`;
    tip.style.top = `${state.physics.y + state.charmSize.height + 74}px`;
    updateThreadVisual();
  }

  function placeMenu(clientX: number, clientY: number) {
    const maxX = window.innerWidth - 292;
    const maxY = window.innerHeight - 320;
    const x = Math.max(8, Math.min(maxX, clientX));
    const y = Math.max(8, Math.min(maxY, clientY));
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
  }

  function closeMenu() {
    menu.classList.add('hidden');
    void syncOverlayInteractivity(window.innerWidth + 1000, window.innerHeight + 1000);
  }

  async function setOverlayInteractive(nextInteractive: boolean) {
    if (state.overlayInteractive === nextInteractive) return;
    state.overlayInteractive = nextInteractive;
    await api.setOverlayInteractive(nextInteractive);
  }

  function isPointInElement(x: number, y: number, element: Element): boolean {
    const rect = element.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  async function syncOverlayInteractivity(pointerX: number, pointerY: number) {
    const overCharm = isPointInElement(pointerX, pointerY, charm);
    const overHanger = Array.from(hangerStack.children).some((part) => (
      isPointInElement(pointerX, pointerY, part)
    ));
    const threadBottomX = state.physics.x + state.charmSize.width / 2;
    const threadBottomY = state.physics.y + state.attachmentOffset;
    const overThread = !state.undangled
      && distancePointToSegment(pointerX, pointerY, anchor.x, anchor.y, threadBottomX, threadBottomY) <= 8;
    const overMenu = !menu.classList.contains('hidden') && isPointInElement(pointerX, pointerY, menu);
    const interactive = state.draggingCharm || overCharm || overHanger || overThread || overMenu;
    await setOverlayInteractive(interactive);
  }

  function updateCharmVisual(charmData: Charm) {
    const [frameWidth, frameHeight] = charmData.art.frame;
    const fitScale = clamp(90 / Math.max(frameWidth, frameHeight), 0.78, 1.32);
    const width = Math.round(clamp(frameWidth * fitScale, 54, 132));
    const height = Math.round(clamp(frameHeight * fitScale, 54, 146));

    state.charmSize = { width, height };
    charm.style.width = `${width}px`;
    charm.style.height = `${height}px`;

    if (charmData.art.type === 'image') {
      charmImage.src = charmData.art.src;
      charmImage.style.display = 'block';
      charmEmoji.style.display = 'none';
    } else {
      charmEmoji.textContent = charmData.art.glyph;
      charmEmoji.style.fontSize = `${Math.round(charmData.art.fontSize * 0.9)}px`;
      charmEmoji.style.display = 'block';
      charmImage.style.display = 'none';
    }
  }

  function renderHanger(charmData: Charm) {
    hangerStack.replaceChildren();
    state.attachmentOffset = Math.round(
      state.charmSize.height * (attachmentTopRatio[charmData.id] ?? 0),
    );
    const parts = hangerPartsFor(charmData);
    for (const part of parts) {
      if (part.type === 'bead') {
        const bead = make('div', `hanger-bead${part.striped ? ' striped' : ''}`);
        bead.style.setProperty('--bead-size', `${part.size}px`);
        bead.style.setProperty('--bead-color', part.color);
        bead.style.setProperty('--bead-shadow', part.shadow);
        hangerStack.append(bead);
      } else if (part.type === 'horse') {
        const image = make('img', 'hanger-image') as HTMLImageElement;
        image.alt = '';
        image.src = part.source ?? '';
        hangerStack.append(image);
      } else {
        hangerStack.append(make('div', 'hanger-clover', '☘'));
      }
    }
  }

  function triggerDropAnimation() {
    state.physics.x = anchor.x - state.charmSize.width / 2;
    state.physics.y = -state.charmSize.height - 40;
    state.physics.vx = (Math.random() - 0.5) * 50;
    state.physics.vy = 450;
  }

  function renderSelected(triggerDrop = false) {
    if (!state.selected) return;
    updateCharmVisual(state.selected);
    renderHanger(state.selected);
    menuRitual.labelSpan.textContent = state.selected.ritual;
    state.physics.targetX = anchor.x - state.charmSize.width / 2;
    state.threadLength = Math.max(40, state.physics.targetY + state.attachmentOffset - anchor.y);
    if (triggerDrop) {
      triggerDropAnimation();
    } else {
      resetCharmToThreadRest();
    }
    layoutCharm();
  }

  function startPhysicsLoop() {
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      if (!state.draggingCharm) {
        if (state.undangled) {
          const stiffness = 8;
          const damping = 0.86;
          const dx = state.physics.targetX - state.physics.x;
          const dy = state.physics.targetY - state.physics.y;
          state.physics.vx += dx * stiffness * dt;
          state.physics.vy += dy * stiffness * dt;
          state.physics.vx *= damping;
          state.physics.vy *= damping;
          state.physics.x += state.physics.vx;
          state.physics.y += state.physics.vy;
        } else {
          state.physics.vy += 980 * dt;
          applyThreadTension(dt);
          state.physics.x += state.physics.vx * dt;
          state.physics.y += state.physics.vy * dt;
          const airDamping = Math.exp(-1.2 * dt);
          state.physics.vx *= airDamping;
          state.physics.vy *= airDamping;
        }
      }

      layoutCharm();
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  async function init() {
    state.dragBoundary = await api.getDragBoundary();
    state.fullDesktopOverlay = await api.getFullDesktopOverlay();
    updateAnchorPosition();
    const [items, selected] = await Promise.all([
      api.getCharms(),
      api.getSelectedCharm(),
    ]);
    allCharms = items;
    state.selected = selected ?? items[0] ?? null;
    renderSelected(true);
    layoutCharm();
    startPhysicsLoop();
  }

  charm.addEventListener('pointerdown', (event) => {
    state.draggingCharm = true;
    state.dragPointerOffset.x = event.clientX - state.physics.x;
    state.dragPointerOffset.y = event.clientY - state.physics.y;
    state.physics.vx = 0;
    state.physics.vy = 0;
    state.lastDragSample = { x: state.physics.x, y: state.physics.y, time: event.timeStamp };
    closeMenu();
    void setOverlayInteractive(true);
    charm.setPointerCapture(event.pointerId);
  });

  charm.addEventListener('pointermove', (event) => {
    if (!state.draggingCharm) return;
    const x = event.clientX - state.dragPointerOffset.x;
    const y = event.clientY - state.dragPointerOffset.y;
    const edgeInset = Math.min(
      state.dragBoundary,
      Math.max(0, (window.innerWidth - state.charmSize.width) / 2),
      Math.max(0, (window.innerHeight - state.charmSize.height) / 2),
    );
    state.physics.x = Math.max(edgeInset, Math.min(window.innerWidth - state.charmSize.width - edgeInset, x));
    state.physics.y = Math.max(edgeInset, Math.min(window.innerHeight - state.charmSize.height - edgeInset, y));
    if (state.lastDragSample) {
      const dt = Math.max(0.001, (event.timeStamp - state.lastDragSample.time) / 1000);
      state.physics.vx = clamp((state.physics.x - state.lastDragSample.x) / dt, -1400, 1400);
      state.physics.vy = clamp((state.physics.y - state.lastDragSample.y) / dt, -1400, 1400);
    }
    state.lastDragSample = { x: state.physics.x, y: state.physics.y, time: event.timeStamp };
    layoutCharm();
  });

  const releaseCharm = () => {
    if (!state.draggingCharm) return;
    state.draggingCharm = false;
    state.lastDragSample = null;
    void syncOverlayInteractivity(-1, -1);
    if (state.undangled) {
      state.physics.targetX = state.physics.x;
      state.physics.targetY = state.physics.y;
      return;
    }
  };

  charm.addEventListener('pointerup', () => {
    releaseCharm();
  });

  charm.addEventListener('pointercancel', () => {
    releaseCharm();
  });

  function renderSubmenuCharms() {
    submenu.replaceChildren();
    for (const item of allCharms) {
      const btn = make('button', 'submenu-item');
      const isSelected = state.selected && state.selected.id === item.id;
      if (isSelected) {
        btn.classList.add('selected');
      }
      const check = make('span', 'submenu-check', isSelected ? '✓' : '');
      const icon = make('span', 'submenu-icon');
      if (item.art.type === 'image') {
        const img = make('img') as HTMLImageElement;
        img.src = item.art.src;
        img.alt = item.name;
        icon.append(img);
      } else {
        icon.textContent = item.art.glyph;
      }
      const name = make('span', 'submenu-name', item.name);
      btn.append(check, icon, name);
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        closeMenu();
        await api.selectCharm(item.id);
      });
      submenu.append(btn);
    }
  }

  function placeMenu(clientX: number, clientY: number) {
    const maxX = window.innerWidth - 260;
    const maxY = window.innerHeight - 340;
    const x = Math.max(8, Math.min(maxX, clientX));
    const y = Math.max(8, Math.min(maxY, clientY));
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    const submenuWidth = 220;
    if (x + 250 + submenuWidth + 8 > window.innerWidth) {
      submenu.style.left = `${Math.max(8, x - submenuWidth - 4)}px`;
    } else {
      submenu.style.left = `${x + 252}px`;
    }
    submenu.style.top = `${y + 42}px`;
  }

  function closeMenu() {
    menu.classList.add('hidden');
    submenu.classList.add('hidden');
    menuChoose.btn.classList.remove('active');
    void syncOverlayInteractivity(window.innerWidth + 1000, window.innerHeight + 1000);
  }

  async function setOverlayInteractive(nextInteractive: boolean) {
    if (state.overlayInteractive === nextInteractive) return;
    state.overlayInteractive = nextInteractive;
    await api.setOverlayInteractive(nextInteractive);
  }

  function isPointInElement(x: number, y: number, element: Element): boolean {
    const rect = element.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  async function syncOverlayInteractivity(pointerX: number, pointerY: number) {
    const overCharm = isPointInElement(pointerX, pointerY, charm);
    const overHanger = Array.from(hangerStack.children).some((part) => (
      isPointInElement(pointerX, pointerY, part)
    ));
    const threadBottomX = state.physics.x + state.charmSize.width / 2;
    const threadBottomY = state.physics.y + state.attachmentOffset;
    const overThread = !state.undangled
      && distancePointToSegment(pointerX, pointerY, anchor.x, anchor.y, threadBottomX, threadBottomY) <= 8;
    const overMenu = !menu.classList.contains('hidden') && isPointInElement(pointerX, pointerY, menu);
    const overSubmenu = !submenu.classList.contains('hidden') && isPointInElement(pointerX, pointerY, submenu);
    const interactive = state.draggingCharm || overCharm || overHanger || overThread || overMenu || overSubmenu;
    await setOverlayInteractive(interactive);
  }

  charm.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    placeMenu(event.clientX, event.clientY);
    menu.classList.remove('hidden');
    void setOverlayInteractive(true);
  });

  const otherMenuItems = [
    menuUndangle.btn,
    menuRitual.btn,
    menuGallery.btn,
    menuSettings.btn,
    menuUpdates.btn,
    menuQuit.btn,
  ];

  for (const item of otherMenuItems) {
    item.addEventListener('mouseenter', () => {
      menuChoose.btn.classList.remove('active');
      submenu.classList.add('hidden');
    });
  }

  menuChoose.btn.addEventListener('mouseenter', () => {
    menuChoose.btn.classList.add('active');
    renderSubmenuCharms();
    submenu.classList.remove('hidden');
  });

  menuChoose.btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = submenu.classList.contains('hidden');
    if (isHidden) {
      menuChoose.btn.classList.add('active');
      renderSubmenuCharms();
      submenu.classList.remove('hidden');
    } else {
      menuChoose.btn.classList.remove('active');
      submenu.classList.add('hidden');
    }
  });

  menu.addEventListener('mouseleave', (e) => {
    const toElement = e.relatedTarget as Node | null;
    if (toElement && (submenu.contains(toElement) || menu.contains(toElement))) return;
    menuChoose.btn.classList.remove('active');
    submenu.classList.add('hidden');
  });

  submenu.addEventListener('mouseleave', (e) => {
    const toElement = e.relatedTarget as Node | null;
    if (toElement && (menu.contains(toElement) || submenu.contains(toElement))) return;
    menuChoose.btn.classList.remove('active');
    submenu.classList.add('hidden');
  });

  app.addEventListener('click', (event) => {
    if (event.target instanceof Node && (menu.contains(event.target) || submenu.contains(event.target))) return;
    closeMenu();
  });

  window.addEventListener('mousemove', (event) => {
    void syncOverlayInteractivity(event.clientX, event.clientY);
  });

  api.onDragBoundaryUpdated((dragBoundary) => {
    state.dragBoundary = dragBoundary;
  });

  api.onFullDesktopOverlayUpdated((enabled) => {
    state.fullDesktopOverlay = enabled;
    updateAnchorPosition();
    resetCharmToThreadRest();
    layoutCharm();
  });

  menuUndangle.btn.addEventListener('click', async () => {
    closeMenu();
    const undangled = await api.toggleUndangle();
    state.undangled = undangled;
    menuUndangle.labelSpan.textContent = undangled ? 'Redangle' : 'Undangle';
    if (!undangled) {
      state.physics.targetX = anchor.x - state.charmSize.width / 2;
      state.physics.targetY = 152;
      triggerDropAnimation();
    }
  });

  menuRitual.btn.addEventListener('click', async () => {
    closeMenu();
    await api.triggerRitual();
  });

  menuGallery.btn.addEventListener('click', async () => {
    closeMenu();
    await api.setGalleryOpen(true);
  });

  menuSettings.btn.addEventListener('click', async () => {
    closeMenu();
    await api.openSettings();
  });

  menuUpdates.btn.addEventListener('click', async () => {
    closeMenu();
    const status = updateDownloaded
      ? await api.installUpdate()
      : updateAvailable ? await api.downloadUpdate() : await api.checkUpdates();
    updateAvailable = status.status === 'available';
    updateDownloaded = status.status === 'downloaded';
    menuUpdates.labelSpan.textContent = updateDownloaded
      ? 'Restart to install update'
      : updateAvailable ? 'Download update' : 'Check for updates';
    showToast(status.message);
  });

  menuQuit.btn.addEventListener('click', async () => {
    closeMenu();
    await api.quitApp();
  });

  api.onCharmsUpdated((items) => {
    allCharms = items;
    if (!state.selected && items.length > 0) {
      state.selected = items[0] ?? null;
      renderSelected(true);
    }
  });

  api.onCharmSelected((item) => {
    state.selected = item;
    renderSelected(true);
  });

  api.onGalleryUpdated((_isOpen) => {
    // Gallery is rendered in a separate window.
  });

  api.onRitualTriggered((item) => {
    state.selected = item;
    renderSelected(false);
    charm.animate(
      [
        { transform: 'translateY(0px) rotate(0deg)' },
        { transform: 'translateY(5px) rotate(9deg)' },
        { transform: 'translateY(0px) rotate(-9deg)' },
        { transform: 'translateY(0px) rotate(0deg)' },
      ],
      { duration: 520, easing: 'ease-out' },
    );
  });

  api.onUndangleUpdated((undangled) => {
    state.undangled = undangled;
    menuUndangle.textContent = undangled ? 'Redangle' : 'Undangle';
    if (!undangled) {
      state.physics.targetX = anchor.x - state.charmSize.width / 2;
      state.physics.targetY = 152;
    }
  });

  api.onSettingsOpened(() => {
    // Settings is rendered in the gallery window.
  });

  api.onUpdateStatus((status) => {
    showToast(status.message);
  });

  void init();
}
