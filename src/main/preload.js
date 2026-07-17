const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pet', {
  // Returns { affirmations: string[], height: number, sprites: {state: url|null} }
  getConfig: () => ipcRenderer.invoke('get-config'),
  // Toggle window click-through. true = clicks pass through to the desktop.
  setIgnoreMouse: (ignore) => ipcRenderer.send('set-ignore-mouse', ignore),
  // Native right-click menu (Quit).
  contextMenu: () => ipcRenderer.send('context-menu'),
  quit: () => ipcRenderer.send('quit'),
});
