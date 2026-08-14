/**
 * windowManager.js — Kiosk window lifecycle management
 *
 * Ensures the exam window:
 *   - Stays full-screen / kiosk at all times
 *   - Cannot be minimised, resized, or moved
 *   - Cannot be closed without admin credentials
 *   - Is always-on-top of other windows
 *
 * Called from main.js after the BrowserWindow is created.
 */

'use strict';

const { BrowserWindow, screen } = require('electron');
const auditLog = require('../security/auditLog');
const platform = require('../platform');

let examWindow = null;
let displayWatcher = null;

function attach(win) {
  examWindow = win;

  // Prevent normal close (e.g. Alt+F4 on Windows reaches here as a last resort)
  win.on('close', (e) => {
    e.preventDefault();
    auditLog.logViolation({
      type: 'UNAUTHORIZED_CLOSE_ATTEMPT',
      message: 'Student attempted to close the exam window.'
    });
  });

  // Re-maximise if somehow un-fullscreened
  win.on('leave-full-screen', () => {
    auditLog.logViolation({ type: 'FULLSCREEN_ESCAPE_ATTEMPT' });
    win.setFullScreen(true);
  });

  win.on('minimize', () => {
    auditLog.logViolation({ type: 'MINIMIZE_ATTEMPT' });
    win.restore();
    win.focus();
  });

  win.on('blur', () => {
    // Force focus back to exam window any time it loses focus
    win.focus();
  });

  // Monitor for new displays being connected mid-exam
  displayWatcher = platform.display();
  displayWatcher.watch((result) => {
    auditLog.logViolation({
      type: 'MULTI_MONITOR_PLUGGED_IN',
      displayCount: result.count,
      message: 'A new display was connected during the exam.'
    });
    // TODO: Optionally pause the exam and force the student to disconnect the extra monitor
  });

  console.log('[Window Manager] Kiosk window protection active.');
}

/**
 * adminClose — called only after admin password has been verified.
 * Removes the close guard and quits.
 */
function adminClose() {
  if (!examWindow) return;
  examWindow.removeAllListeners('close');
  examWindow.close();
}

module.exports = { attach, adminClose };
