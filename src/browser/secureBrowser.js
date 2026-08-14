/**
 * secureBrowser.js — Locked-down Chromium window
 *
 * Creates the kiosk BrowserWindow with strict security preferences.
 * Attaches URL filter, request interceptor, and web traffic logger.
 *
 * RULE-4: nodeIntegration false, contextIsolation true, sandbox true.
 */

'use strict';

const { BrowserWindow } = require('electron');
const path = require('path');

const urlFilter          = require('./urlFilter');
const requestInterceptor = require('./requestInterceptor');
const webTrafficLogger   = require('./webTrafficLogger');

let examWindow = null;

function createSecureBrowser(url) {
  examWindow = new BrowserWindow({
    width:  1920,
    height: 1080,
    kiosk:  true,
    frame:  false,
    alwaysOnTop:    true,
    fullscreen:     true,
    resizable:      false,
    movable:        false,
    minimizable:    false,
    closable:       false,   // Enforced further by windowManager
    webPreferences: {
      nodeIntegration:        false,
      contextIsolation:       true,
      sandbox:                true,
      devTools:               false,
      preload:                path.join(__dirname, '../renderer/preload.js'),
      webgl:                  true,
      allowRunningInsecureContent: false,
      experimentalFeatures:   false,
    }
  });

  // Attach URL whitelist + AI domain blocker
  urlFilter.attach(examWindow);
  requestInterceptor.attach(examWindow.webContents.session);

  // Attach web traffic logger
  webTrafficLogger.attach(examWindow);

  examWindow.loadURL(url);

  return examWindow;
}

function getExamWindow() {
  return examWindow;
}

module.exports = { createSecureBrowser, getExamWindow };
