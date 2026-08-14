/**
 * Platform Abstraction Layer
 * 
 * Provides a unified API for OS-specific operations.
 * Auto-detects the current platform and exports the correct implementation.
 * 
 * RULE-3: All OS-specific code lives in src/platform/win32/ or src/platform/darwin/.
 * Lockdown, media, and security modules MUST use this API — never OS commands directly.
 */

'use strict';

const os = require('os');
const path = require('path');

const PLATFORM = process.platform; // 'win32' | 'darwin'

// Lazy-load platform modules to avoid loading unused platform code
let _processes, _firewall, _keyboard, _clipboard, _display, _vmDetect, _permissions;


function getPlatformModule(moduleName) {
  const platformDir = PLATFORM === 'win32' ? 'win32' : 'darwin';
  const modulePath = path.join(__dirname, platformDir, moduleName);
  
  try {
    return require(modulePath);
  } catch (err) {
    console.error(`[Platform] Failed to load ${platformDir}/${moduleName}:`, err.message);
    throw new Error(`Platform module '${moduleName}' not available for ${PLATFORM}`);
  }
}

/** Process management — enumerate, kill, check */
function getProcesses() {
  if (!_processes) _processes = getPlatformModule('processes');
  return _processes;
}

/** Firewall management — whitelist/block rules */
function getFirewall() {
  if (!_firewall) _firewall = getPlatformModule('firewall');
  return _firewall;
}

/** Keyboard hook — block shortcuts */
function getKeyboard() {
  if (!_keyboard) _keyboard = getPlatformModule('keyboard');
  return _keyboard;
}

/** Display management — detect/watch multi-monitor */
function getDisplay() {
  if (!_display) _display = getPlatformModule('display');
  return _display;
}

/** Clipboard management — clear, monitor */
function getClipboard() {
  if (!_clipboard) _clipboard = getPlatformModule('clipboard');
  return _clipboard;
}

/** Display management — detect multi-monitor */
function getDisplay() {
  if (!_display) _display = getPlatformModule('display');
  return _display;
}

/** VM Detection — platform-specific detection layers */
function getVmDetect() {
  if (!_vmDetect) _vmDetect = getPlatformModule('vmDetect');
  return _vmDetect;
}

/** macOS-only: TCC Permission management */
function getPermissions() {
  if (PLATFORM !== 'darwin') {
    return {
      checkCamera: async () => true,
      checkMicrophone: async () => true,
      checkScreenRecording: async () => true,
      checkAccessibility: async () => true,
      requestAll: async () => ({ camera: true, microphone: true, screenRecording: true, accessibility: true })
    };
  }
  if (!_permissions) _permissions = getPlatformModule('permissions');
  return _permissions;
}

module.exports = {
  PLATFORM,
  isWindows: PLATFORM === 'win32',
  isMac: PLATFORM === 'darwin',
  
  // Module accessors
  processes: getProcesses,
  firewall: getFirewall,
  keyboard: getKeyboard,
  clipboard: getClipboard,
  display: getDisplay,
  vmDetect: getVmDetect,
  permissions: getPermissions,
  
  // System info
  systemInfo: {
    platform: PLATFORM,
    arch: os.arch(),
    release: os.release(),
    hostname: os.hostname(),
    cpus: os.cpus().length,
    totalMemory: os.totalmem(),
    username: os.userInfo().username
  }
};
