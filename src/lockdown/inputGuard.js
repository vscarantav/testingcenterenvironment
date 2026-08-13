const platform = require('../platform');
const auditLog = require('../security/auditLog');
const { globalShortcut } = require('electron');

// Note: In a real native implementation, globalShortcut is weak. 
// A true C++ addon (SetWindowsHookEx or CGEventTap) would be used via the platform layer.
// We are bridging those native calls through platform.keyboard().

let isActive = false;

function start() {
  if (isActive) return;
  
  // Example of using Electron's globalShortcut as a baseline defense
  // For a real high-stakes exam, we'd invoke the native platform hooks here.
  const shortcutsToBlock = [
    'CommandOrControl+C',
    'CommandOrControl+V',
    'CommandOrControl+X',
    'CommandOrControl+A',
    'CommandOrControl+R',
    'F5',
    'PrintScreen',
    'Alt+Tab',
    'Command+Tab',
    'Alt+F4',
    'Command+Q'
  ];

  shortcutsToBlock.forEach(shortcut => {
    try {
      globalShortcut.register(shortcut, () => {
        console.warn(`[Input Guard] Blocked shortcut attempt: ${shortcut}`);
        auditLog.logViolation({
          type: 'SHORTCUT_BLOCKED',
          shortcut: shortcut
        });
      });
    } catch (e) {
      console.error(`Failed to register shortcut ${shortcut}:`, e.message);
    }
  });

  // Start periodic clipboard clearing
  platform.clipboard().startMonitoring();
  
  isActive = true;
  console.log('[Input Guard] Keyboard shortcuts and clipboard locked.');
}

function stop() {
  if (!isActive) return;
  globalShortcut.unregisterAll();
  platform.clipboard().stopMonitoring();
  isActive = false;
  console.log('[Input Guard] Input restrictions lifted.');
}

module.exports = {
  start,
  stop
};
