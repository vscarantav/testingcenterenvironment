/**
 * win32/keyboard.js — Low-level keyboard hook for Windows
 *
 * Strategy: Uses Electron's globalShortcut to intercept common combos.
 * For a production build, a native C++ addon (SetWindowsHookEx WH_KEYBOARD_LL)
 * is required to catch Win key and Ctrl+Alt+Del — add that addon to /native/
 * and require() it here in Phase 2.
 *
 * RULE-3: All Windows keyboard code stays here. inputGuard.js calls this module.
 */

'use strict';

const { globalShortcut } = require('electron');
const auditLog = require('../../security/auditLog');

// Combos we want to swallow so they don't reach the OS
const BLOCKED_SHORTCUTS = [
  // Copy/paste/select
  'CommandOrControl+C',
  'CommandOrControl+V',
  'CommandOrControl+X',
  'CommandOrControl+A',
  // Reload / navigation
  'CommandOrControl+R',
  'CommandOrControl+Shift+R',
  'F5',
  'Alt+F4',
  // Dev tools
  'CommandOrControl+Shift+I',
  'CommandOrControl+Shift+J',
  'CommandOrControl+Shift+C',
  'F12',
  // Screen capture
  'PrintScreen',
  'Alt+PrintScreen',
  // Task switching
  'Alt+Tab',
  'Alt+Shift+Tab',
  'Alt+Escape',
  // Windows-specific
  'Super+D',          // Show desktop
  'Super+E',          // Explorer
  'Super+L',          // Lock screen
  'Super+R',          // Run dialog
  'Super+Tab',        // Task View
];

let active = false;

function start() {
  if (active) return;

  BLOCKED_SHORTCUTS.forEach(combo => {
    try {
      globalShortcut.register(combo, () => {
        auditLog.logViolation({ type: 'SHORTCUT_BLOCKED', shortcut: combo });
      });
    } catch (_) {
      // Some combos can't be registered by Electron — that is expected.
      // The native hook (Phase 2) will cover those.
    }
  });

  active = true;
  console.log('[Keyboard/Win32] Shortcut hooks active.');
}

function stop() {
  if (!active) return;
  globalShortcut.unregisterAll();
  active = false;
  console.log('[Keyboard/Win32] Shortcut hooks removed.');
}

module.exports = { start, stop };
