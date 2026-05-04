const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  openExternal: (url) => shell.openExternal(url),
  onAuthToken: (callback) => ipcRenderer.on('auth-token', (event, token) => callback(token)),
  removeAuthListener: () => ipcRenderer.removeAllListeners('auth-token')
});
