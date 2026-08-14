import { app, BrowserWindow, globalShortcut, ipcMain, Menu, Tray, nativeImage, screen } from 'electron';
import * as path from 'node:path';

type Charm = {
  id: string;
  name: string;
  region: string;
  description: string;
  ritual: string;
  emoji: string;
  accent: string;
  glow: string;
};

const charms: Charm[] = [
  {
    id: 'nazar',
    name: 'Nazar boncuğu',
    region: 'Turkey & the Mediterranean',
    description: 'A glass eye worn against the evil eye. Give it a flick when you want a little cover.',
    ritual: 'Give it a flick',
    emoji: '🧿',
    accent: '#f2b64d',
    glow: '#d69d38'
  },
  {
    id: 'hamsa',
    name: 'Hamsa',
    region: 'Middle East & North Africa',
    description: 'An open hand carried for protection and good fortune. Give it a flick to send bad luck on its way.',
    ritual: 'Give it a flick',
    emoji: '✋',
    accent: '#f59e7a',
    glow: '#ea7d52'
  },
  {
    id: 'nimbu',
    name: 'Nimbu-mirchi',
    region: 'India',
    description: 'Seven chilies and a lemon hung at the threshold to turn away misfortune. Replace it with a fresh one when the week is up.',
    ritual: 'Hang a fresh garland',
    emoji: '🌶️',
    accent: '#f3c96e',
    glow: '#dca544'
  },
  {
    id: 'drishti',
    name: 'Drishti bommai',
    region: 'South India',
    description: 'A fierce guardian painted to meet the first bad glance. Repaint it through seven colors whenever you want a fresh start.',
    ritual: 'Repaint the guardian',
    emoji: '🪶',
    accent: '#7ad3ff',
    glow: '#46a3d9'
  },
  {
    id: 'daruma',
    name: 'Daruma',
    region: 'Japan',
    description: 'A wishing doll for goals that take some grit. Paint one eye when you make a wish and the other when it comes true.',
    ritual: 'Make a wish',
    emoji: '🎯',
    accent: '#8ad0a0',
    glow: '#5ac27e'
  },
  {
    id: 'maneki',
    name: 'Maneki-neko',
    region: 'Japan',
    description: 'A beckoning cat that invites good fortune in. Call on it and watch its raised paw wave.',
    ritual: 'Beckon good fortune',
    emoji: '🐈',
    accent: '#ffc76a',
    glow: '#dca550'
  },
  {
    id: 'horseshoe',
    name: 'Horseshoe',
    region: 'Europe & the Americas',
    description: 'Hung points up so the luck stays put. A good flick is all this one needs.',
    ritual: 'Give it a flick',
    emoji: '🧲',
    accent: '#c9a4ff',
    glow: '#9b73d9'
  },
  {
    id: 'scarab',
    name: 'Scarab',
    region: 'Ancient Egypt',
    description: 'An ancient amulet for renewal and new beginnings. Spread its ceremonial wings for a moment, then let them rest.',
    ritual: 'Spread the wings',
    emoji: '🪲',
    accent: '#ff9aad',
    glow: '#dd6f8d'
  },
  {
    id: 'emoji',
    name: 'Emoji',
    region: 'Yours',
    description: 'Choose any emoji and make the ritual your own. Hang the one that feels lucky to you.',
    ritual: 'Pick an emoji',
    emoji: '🍀',
    accent: '#e7d778',
    glow: '#d1b845'
  }
];

let selectedCharm: Charm = charms[0];
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isVisible = true;
let isGalleryOpen = false;

function syncTray() {
  if (!tray) return;
  const menu = Menu.buildFromTemplate([
    { label: `Current charm: ${selectedCharm.name}`, enabled: false },
    { type: 'separator' },
    { label: isVisible ? 'Hide charm' : 'Show charm', click: () => toggleWindow() },
    { label: isGalleryOpen ? 'Close gallery' : 'Open gallery', click: () => toggleGallery() },
    { label: 'Perform ritual', click: () => triggerRitual() },
    { label: 'Quit', click: () => app.quit() }
  ]);
  tray.setContextMenu(menu);
}

function createTray() {
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABlQY1AAAAAXNSR0IArs4c6QAAAA1JREFUGFdjYAAAAAIAAeIhvAAAAABJRU5ErkJggg=='
  );

  tray = new Tray(icon.resize({ width: 18, height: 18 }));
  syncTray();
  tray.setToolTip('Lucky Charm');
}

function createMainWindow() {
  const { width } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 360,
    height: 520,
    x: Math.max(20, Math.round(width / 2 - 180)),
    y: 40,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setIgnoreMouseEvents(false);
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send('charms-updated', charms);
    mainWindow?.webContents.send('charm-selected', selectedCharm);
    mainWindow?.webContents.send('visibility-updated', isVisible);
    mainWindow?.webContents.send('gallery-updated', isGalleryOpen);
  });
}

function showWindow() {
  isVisible = true;
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
  syncTray();
  mainWindow?.webContents.send('visibility-updated', true);
}

function hideWindow() {
  isVisible = false;
  if (mainWindow) {
    mainWindow.hide();
  }
  syncTray();
  mainWindow?.webContents.send('visibility-updated', false);
}

function toggleWindow() {
  if (isVisible) {
    hideWindow();
  } else {
    showWindow();
  }
}

function toggleGallery() {
  isGalleryOpen = !isGalleryOpen;
  if (mainWindow) {
    mainWindow.webContents.send('gallery-updated', isGalleryOpen);
  }
  syncTray();
}

function triggerRitual() {
  if (!mainWindow) return;
  mainWindow.webContents.send('ritual-triggered', selectedCharm);
}

function registerShortcuts() {
  globalShortcut.register('CommandOrControl+Shift+D', () => toggleWindow());
  globalShortcut.register('CommandOrControl+Shift+S', () => triggerRitual());
  globalShortcut.register('CommandOrControl+Shift+G', () => toggleGallery());
}

function moveWindowBy(deltaX: number, deltaY: number) {
  if (!mainWindow) return;
  const [currentX, currentY] = mainWindow.getPosition();
  mainWindow.setPosition(currentX + deltaX, currentY + deltaY);
}

app.on('ready', () => {
  if (process.platform === 'darwin') {
    app.setActivationPolicy('accessory');
  }

  app.setAsDefaultProtocolClient('luckycharm');
  createTray();
  createMainWindow();
  registerShortcuts();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  } else {
    showWindow();
  }
});

app.on('open-url', (_event, url) => {
  if (url.includes('luckycharm://bless') || url.includes('luckycharm://')) {
    showWindow();
    toggleGallery();
    triggerRitual();
  }
});

ipcMain.handle('get-charms', () => charms);

ipcMain.handle('select-charm', (_event, charmId: string) => {
  const next = charms.find((charm) => charm.id === charmId);
  if (!next) return;
  selectedCharm = next;
  if (mainWindow) {
    mainWindow.webContents.send('charm-selected', selectedCharm);
  }
  syncTray();
  return selectedCharm;
});

ipcMain.handle('toggle-window', () => {
  toggleWindow();
  return isVisible;
});

ipcMain.handle('toggle-gallery', () => {
  toggleGallery();
  return isGalleryOpen;
});

ipcMain.handle('trigger-ritual', () => {
  triggerRitual();
  return selectedCharm;
});

ipcMain.handle('move-window', (_event, deltaX: number, deltaY: number) => {
  moveWindowBy(Number(deltaX) || 0, Number(deltaY) || 0);
  return true;
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
