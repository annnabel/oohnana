const { app, BrowserWindow, ipcMain, screen, Menu, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const ROOT = app.getAppPath();
const CONFIG_DIR = path.join(ROOT, 'config');
const SPRITES_DIR = path.join(ROOT, 'sprites');

let win = null;

// Linux compositors need this hint before the window is created for the
// transparent background to actually be transparent.
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('enable-transparent-visuals');
}

function readJSON(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function loadConfig() {
  const affirmations = readJSON(path.join(CONFIG_DIR, 'affirmations.json'), [
    "you're doing great ✨",
  ]);
  const spritesCfg = readJSON(path.join(CONFIG_DIR, 'sprites.json'), {
    height: 130,
    states: {},
  });

  // Resolve each configured sprite to a file:// URL, or null if it's missing
  // (the renderer draws built-in placeholder art for nulls).
  const sprites = {};
  for (const [state, file] of Object.entries(spritesCfg.states || {})) {
    if (!file) {
      sprites[state] = null;
      continue;
    }
    const abs = path.join(SPRITES_DIR, file);
    sprites[state] = fs.existsSync(abs) ? pathToFileURL(abs).href : null;
  }

  return {
    affirmations: Array.isArray(affirmations) ? affirmations : [],
    height: Number(spritesCfg.height) || 130,
    sprites,
  };
}

function createWindow() {
  // Cover the primary display's work area so the buddy can roam the screen.
  const display = screen.getPrimaryDisplay();
  const { x, y, width, height } = display.workArea;

  win = new BrowserWindow({
    x,
    y,
    width,
    height,
    transparent: true,
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: false,
    // Keep the app from stealing keyboard focus from whatever you're doing.
    focusable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // The renderer only ever shows local files — never navigate or open windows.
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e) => e.preventDefault());

  // Float above normal windows (including most full-screen apps).
  win.setAlwaysOnTop(true, 'screen-saver');

  // Start fully click-through; the renderer flips this on when the pointer is
  // actually over the character (see 'set-ignore-mouse').
  win.setIgnoreMouseEvents(true, { forward: true });

  if (process.platform === 'darwin') {
    // Show on every Space, including over full-screen apps.
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  }

  win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  // showInactive() renders the window without activating the app / stealing focus.
  win.once('ready-to-show', () => win.showInactive());
  win.on('closed', () => {
    win = null;
  });
}

// ---- IPC bridge -----------------------------------------------------------

ipcMain.handle('get-config', () => loadConfig());

ipcMain.on('set-ignore-mouse', (_e, ignore) => {
  if (win) win.setIgnoreMouseEvents(!!ignore, { forward: true });
});

ipcMain.on('context-menu', () => {
  if (!win) return;
  const menu = Menu.buildFromTemplate([
    { label: 'oohnana 🐹', enabled: false },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]);
  menu.popup({ window: win });
});

ipcMain.on('quit', () => app.quit());

// ---- Lifecycle ------------------------------------------------------------

app.whenReady().then(() => {
  // A tiny delay avoids a transparency race on some Linux compositors.
  const delay = process.platform === 'linux' ? 250 : 0;
  setTimeout(createWindow, delay);

  // Global panic button to quit from anywhere.
  globalShortcut.register('CommandOrControl+Shift+Q', () => app.quit());

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// The buddy is the whole app — quit when it's dismissed, even on macOS.
app.on('window-all-closed', () => app.quit());
app.on('will-quit', () => globalShortcut.unregisterAll());
