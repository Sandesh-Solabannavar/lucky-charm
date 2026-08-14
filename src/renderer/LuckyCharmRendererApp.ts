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

type UpdateStatus = {
  status: string;
  message: string;
  version: string;
};

export type RendererElectronApi = {
  getCharms: () => Promise<Charm[]>;
  selectCharm: (id: string) => Promise<Charm | undefined>;
  toggleWindow: () => Promise<boolean>;
  toggleGallery: () => Promise<boolean>;
  setGalleryOpen: (open: boolean) => Promise<boolean>;
  triggerRitual: () => Promise<Charm>;
  moveWindow: (deltaX: number, deltaY: number) => Promise<boolean>;
  setOverlayInteractive: (interactive: boolean) => Promise<boolean>;
  toggleUndangle: () => Promise<boolean>;
  openSettings: () => Promise<boolean>;
  checkUpdates: () => Promise<UpdateStatus>;
  quitApp: () => Promise<boolean>;
  onCharmsUpdated: (callback: (charms: Charm[]) => void) => void;
  onCharmSelected: (callback: (charm: Charm) => void) => void;
  onVisibleUpdated: (callback: (visible: boolean) => void) => void;
  onGalleryUpdated: (callback: (isOpen: boolean) => void) => void;
  onRitualTriggered: (callback: (charm: Charm) => void) => void;
  onUndangleUpdated: (callback: (undangled: boolean) => void) => void;
  onSettingsOpened: (callback: () => void) => void;
  onUpdateStatus: (callback: (status: UpdateStatus) => void) => void;
};

const css = `
* { box-sizing: border-box; }
html, body {
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: "Segoe UI", system-ui, sans-serif;
  color: #f6f8ff;
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
  pointer-events: none;
}
.thread {
  stroke: url(#threadGradient);
  stroke-width: 3.1;
  stroke-linecap: round;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
}
.anchor-dot {
  fill: rgba(164, 129, 72, 0.9);
}
.hanger-stack {
  position: absolute;
  pointer-events: none;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.bead-white {
  width: 13px;
  height: 13px;
  border-radius: 999px;
  background: radial-gradient(circle at 30% 30%, #ffffff 0%, #f1f2f7 55%, #d8dbe8 100%);
  box-shadow: inset -1px -2px 3px rgba(127, 136, 160, 0.42);
}
.bead-eye {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: radial-gradient(circle at 34% 30%, #4a8af8 0%, #2356c7 50%, #152a8a 100%);
  box-shadow: 0 1px 4px rgba(44, 68, 158, 0.45);
  position: relative;
}
.bead-eye::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #ffffff;
}
.bead-eye::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: radial-gradient(circle at 35% 35%, #67d7ff 0%, #2d9fd6 58%, #133168 100%);
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
}
.charm-emoji {
  display: block;
  line-height: 1;
  pointer-events: none;
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
  right: 16px;
  top: 16px;
  max-width: 260px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(16, 22, 44, 0.94);
  border: 1px solid rgba(255,255,255,0.18);
  font-size: 12px;
  box-shadow: 0 14px 34px rgba(0,0,0,0.4);
}
.toast.hidden { display: none; }
.menu {
  position: absolute;
  width: 280px;
  padding: 8px;
  border-radius: 12px;
  background: rgba(18, 24, 52, 0.95);
  border: 1px solid rgba(255,255,255,0.16);
  box-shadow: 0 18px 46px rgba(0,0,0,0.52);
  backdrop-filter: blur(14px);
  z-index: 20;
}
.menu.hidden { display: none; }
.menu-title {
  font-size: 11px;
  color: rgba(205, 220, 255, 0.82);
  margin: 2px 6px 8px;
}
.menu-btn {
  width: 100%;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #edf2ff;
  text-align: left;
  padding: 8px 9px;
  font-size: 12px;
  cursor: pointer;
}
.menu-btn:hover {
  background: rgba(98, 134, 255, 0.24);
}
.menu-sep {
  height: 1px;
  background: rgba(255,255,255,0.14);
  margin: 8px 4px;
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
  };

  document.body.replaceChildren();

  const app = make('div', 'app');
  const home = make('div', 'home');
  const threadLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  threadLayer.classList.add('thread-layer');
  threadLayer.setAttribute('viewBox', '0 0 420 760');
  threadLayer.setAttribute('preserveAspectRatio', 'none');
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const threadGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  threadGradient.setAttribute('id', 'threadGradient');
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
  const topBead = make('div', 'bead-white');
  const eyeBead = make('div', 'bead-eye');
  const bottomBead = make('div', 'bead-white');
  hangerStack.append(topBead, eyeBead, bottomBead);

  const charm = make('div', 'charm');
  const charmImage = make('img', 'charm-image') as HTMLImageElement;
  charmImage.alt = 'Charm';
  const charmEmoji = make('div', 'charm-emoji');
  charm.append(charmImage, charmEmoji);

  const charmName = make('div', 'charm-name', 'Nazar boncugu');
  const tip = make('div', 'tip', 'Right click the charm for options');
  const toast = make('div', 'toast hidden');
  home.append(threadLayer, hangerStack, charm, charmName, tip, toast);

  const menu = make('div', 'menu hidden');
  const menuTitle = make('div', 'menu-title', 'LuckyCharm');
  const menuUndangle = make('button', 'menu-btn', 'Undangle');
  const menuRitual = make('button', 'menu-btn', 'Hang a fresh garland');
  const menuChoose = make('button', 'menu-btn', 'Choose a charm');
  const menuGallery = make('button', 'menu-btn', 'Open the gallery');
  const menuSettings = make('button', 'menu-btn', 'Open Settings');
  const menuUpdates = make('button', 'menu-btn', 'Check for updates');
  const sep = make('div', 'menu-sep');
  const menuQuit = make('button', 'menu-btn', 'Quit Lucky Charm');
  menu.append(
    menuTitle,
    menuUndangle,
    menuRitual,
    menuChoose,
    menuGallery,
    menuSettings,
    menuUpdates,
    sep,
    menuQuit,
  );

  app.append(home, menu);
  document.body.append(app);

  const anchor = { x: 260, y: 0 };

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
    const charmCenterX = state.physics.x + state.charmSize.width / 2;
    const charmTopY = state.physics.y;
    const swing = clamp(state.physics.vx * 1.8, -18, 18);
    const controlX = anchor.x + (charmCenterX - anchor.x) * 0.52 + swing;
    const controlY = anchor.y + (charmTopY - anchor.y) * 0.46;
    const d = `M ${anchor.x} ${anchor.y} Q ${controlX} ${controlY} ${charmCenterX} ${charmTopY}`;
    threadPath.setAttribute('d', d);
    anchorDot.setAttribute('cx', String(anchor.x));
    anchorDot.setAttribute('cy', String(anchor.y));

    hangerStack.style.left = `${charmCenterX}px`;
    hangerStack.style.top = `${Math.round(charmTopY - 40)}px`;

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
    const overHanger = isPointInElement(pointerX, pointerY, hangerStack);
    const threadBottomX = state.physics.x + state.charmSize.width / 2;
    const threadBottomY = state.physics.y;
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

  function renderSelected() {
    if (!state.selected) return;
    updateCharmVisual(state.selected);
    menuRitual.textContent = state.selected.ritual;
    state.physics.targetX = anchor.x - state.charmSize.width / 2;
    layoutCharm();
  }

  function startPhysicsLoop() {
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      if (!state.draggingCharm) {
        const stiffness = state.undangled ? 8 : 16;
        const damping = 0.86;
        const dx = state.physics.targetX - state.physics.x;
        const dy = state.physics.targetY - state.physics.y;

        state.physics.vx += dx * stiffness * dt;
        state.physics.vy += dy * stiffness * dt;
        state.physics.vx *= damping;
        state.physics.vy *= damping;
        state.physics.x += state.physics.vx;
        state.physics.y += state.physics.vy;
      }

      layoutCharm();
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  async function init() {
    const items = await api.getCharms();
    state.selected = items[0] ?? null;
    renderSelected();
    layoutCharm();
    startPhysicsLoop();
  }

  charm.addEventListener('pointerdown', (event) => {
    state.draggingCharm = true;
    state.dragPointerOffset.x = event.clientX - state.physics.x;
    state.dragPointerOffset.y = event.clientY - state.physics.y;
    state.physics.vx = 0;
    state.physics.vy = 0;
    closeMenu();
    void setOverlayInteractive(true);
    charm.setPointerCapture(event.pointerId);
  });

  charm.addEventListener('pointermove', (event) => {
    if (!state.draggingCharm) return;
    const x = event.clientX - state.dragPointerOffset.x;
    const y = event.clientY - state.dragPointerOffset.y;
    state.physics.x = Math.max(20, Math.min(window.innerWidth - state.charmSize.width - 20, x));
    state.physics.y = Math.max(40, Math.min(window.innerHeight - state.charmSize.height - 60, y));
    layoutCharm();
  });

  const releaseCharm = () => {
    if (!state.draggingCharm) return;
    state.draggingCharm = false;
    void syncOverlayInteractivity(-1, -1);
    if (state.undangled) {
      state.physics.targetX = state.physics.x;
      state.physics.targetY = state.physics.y;
      return;
    }
    state.physics.targetX = anchor.x - state.charmSize.width / 2;
    state.physics.targetY = 152;
  };

  charm.addEventListener('pointerup', () => {
    releaseCharm();
  });

  charm.addEventListener('pointercancel', () => {
    releaseCharm();
  });

  charm.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    placeMenu(event.clientX, event.clientY);
    menu.classList.remove('hidden');
    void setOverlayInteractive(true);
  });

  app.addEventListener('click', (event) => {
    if (event.target instanceof Node && menu.contains(event.target)) return;
    closeMenu();
  });

  window.addEventListener('mousemove', (event) => {
    void syncOverlayInteractivity(event.clientX, event.clientY);
  });

  menuUndangle.addEventListener('click', async () => {
    closeMenu();
    const undangled = await api.toggleUndangle();
    state.undangled = undangled;
    menuUndangle.textContent = undangled ? 'Redangle' : 'Undangle';
    if (!undangled) {
      state.physics.targetX = anchor.x - state.charmSize.width / 2;
      state.physics.targetY = 152;
    }
  });

  menuRitual.addEventListener('click', async () => {
    closeMenu();
    await api.triggerRitual();
  });

  menuChoose.addEventListener('click', async () => {
    closeMenu();
    await api.setGalleryOpen(true);
  });

  menuGallery.addEventListener('click', async () => {
    closeMenu();
    await api.setGalleryOpen(true);
  });

  menuSettings.addEventListener('click', async () => {
    closeMenu();
    await api.openSettings();
  });

  menuUpdates.addEventListener('click', async () => {
    closeMenu();
    const status = await api.checkUpdates();
    showToast(status.message);
  });

  menuQuit.addEventListener('click', async () => {
    closeMenu();
    await api.quitApp();
  });

  api.onCharmsUpdated((items) => {
    if (!state.selected && items.length > 0) {
      state.selected = items[0] ?? null;
      renderSelected();
    }
  });

  api.onCharmSelected((item) => {
    state.selected = item;
    renderSelected();
  });

  api.onGalleryUpdated((_isOpen) => {
    // Gallery is rendered in a separate window.
  });

  api.onRitualTriggered((item) => {
    state.selected = item;
    renderSelected();
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
