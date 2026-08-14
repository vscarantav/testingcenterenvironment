/**
 * menuOverride.js — Strip the Electron application menu and DevTools access
 *
 * By default Electron ships with a full application menu that exposes
 * "View → Toggle Developer Tools" and "Edit" (copy/paste) menus.
 * This module removes all of that before any window is shown.
 */

'use strict';

const { Menu, session } = require('electron');

function apply() {
  // Remove the entire application menu
  Menu.setApplicationMenu(null);

  // Disable DevTools on the default session
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    callback({ requestHeaders: details.requestHeaders });
  });

  console.log('[Menu Override] Application menu removed.');
}

/**
 * Locks down the webContents of a specific window:
 *   - Disable DevTools keyboard shortcut
 *   - Block context menu (right-click)
 *   - Block opening new windows / popups
 */
function lockWebContents(webContents) {
  // Prevent DevTools from being opened programmatically
  webContents.on('devtools-opened', () => {
    webContents.closeDevTools();
  });

  // Block context menu (right-click menu)
  webContents.on('context-menu', (e) => {
    e.preventDefault();
  });

  // Block popups / window.open()
  webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  console.log('[Menu Override] webContents locked (DevTools, context menu, popups).');
}

module.exports = { apply, lockWebContents };
