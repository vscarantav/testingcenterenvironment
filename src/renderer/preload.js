const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to the renderer process
// RULE-4: Context isolation — the renderer process must NEVER have direct access to Node.js APIs
contextBridge.exposeInMainWorld('api', {
  // Methods for the renderer to request actions from the main process
  requestMediaPermissions: () => ipcRenderer.invoke('request-media-permissions'),
  logEvent: (event) => ipcRenderer.send('log-event', event),
  getScreenSource: () => ipcRenderer.invoke('get-screen-source'),
  
  // Handlers for messages from main to renderer
  onSecurityAlert: (callback) => ipcRenderer.on('security-alert', (_event, value) => callback(value))
});
