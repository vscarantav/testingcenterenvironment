/**
 * darwin/keyboard.js — macOS keyboard interception
 *
 * Strategy: Uses Electron's globalShortcut to block common exam-bypass combos.
 * For production, a native CGEventTap addon (Phase 2) is needed to catch
 * Cmd+Tab, Mission Control, Spotlight, and screenshot shortcuts that Electron
 * cannot register (they are reserved by the OS).
 *
 * The native addon would live in /native/darwin/eventTap.cc and be loaded via
 *   require('bindings')('eventTap')
 *
 * RULE-3: All macOS keyboard code stays here.
 */

'use strict';

const { globalShortcut } = require('electron');
const auditLog = require('../../security/auditLog');

const BLOCKED_SHORTCUTS = [
  // macOS system shortcuts we can catch via Electron
  'Command+Q',          // Quit
  'Command+H',          // Hide window
  'Command+M',          // Minimise
  'Command+W',          // Close window
  'Command+R',          // Reload
  'Command+Shift+R',
  // Copy / paste
  'Command+C',
  'Command+V',
  'Command+X',
  'Command+A',
  // Dev tools (Chromium)
  'Command+Option+I',
  'Command+Option+J',
  'Command+Option+C',
  'F12',
  // Screenshots — Electron can intercept these before the OS
  'Command+Shift+3',
  'Command+Shift+4',
  'Command+Shift+5',
  // Spotlight (sometimes catchable)
  'Command+Space',
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
      // Some OS-reserved shortcuts cannot be registered — native CGEventTap handles these.
    }
  });

  active = true;
  console.log('[Keyboard/Darwin] Shortcut hooks active.');
}

function stop() {
  if (!active) return;
  globalShortcut.unregisterAll();
  active = false;
  console.log('[Keyboard/Darwin] Shortcut hooks removed.');
}

module.exports = { start, stop };
