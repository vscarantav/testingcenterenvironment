const { BrowserWindow } = require('electron');
const path = require('path');
const urlFilter = require('./urlFilter');
const requestInterceptor = require('./requestInterceptor');

let examWindow = null;

function createSecureBrowser(url) {
  examWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    kiosk: true,         // Fullscreen, no window chrome
    frame: false,
    alwaysOnTop: true,   // Stay above other windows
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../renderer/preload.js'),
      devTools: false,    // Block DevTools
      webgl: true,
      sandbox: true       // Chromium sandbox
    }
  });

  // Apply browser lockdown policies
  urlFilter.attach(examWindow);
  requestInterceptor.attach(examWindow.webContents.session);

  // Block context menus (right-click)
  examWindow.webContents.on('context-menu', (e) => {
    e.preventDefault();
  });

  examWindow.loadURL(url);
  
  return examWindow;
}

module.exports = {
  createSecureBrowser
};
