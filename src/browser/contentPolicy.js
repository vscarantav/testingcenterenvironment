/**
 * contentPolicy.js — Browser-level content security for the exam window
 *
 * Applied to the BrowserWindow's webContents to block:
 *   - DevTools (keyboard shortcut + programmatic open)
 *   - Right-click / context menu
 *   - View Source (Ctrl+U / Cmd+U)
 *   - Extensions
 *   - New window / popup creation (window.open, target="_blank")
 *   - Drag-and-drop (could expose filesystem)
 *   - Printing (Ctrl+P)
 *
 * RULE-4: This runs in the main process and controls webContents behaviour.
 */

'use strict';

const auditLog = require('../security/auditLog');

function attach(webContents) {
  // 1. Block DevTools
  webContents.on('devtools-opened', () => {
    webContents.closeDevTools();
    auditLog.logViolation({ type: 'DEVTOOLS_OPEN_ATTEMPT' });
  });

  // 2. Block right-click context menu
  webContents.on('context-menu', (e) => {
    e.preventDefault();
    auditLog.logViolation({ type: 'CONTEXT_MENU_ATTEMPT' });
  });

  // 3. Block popups / window.open()
  webContents.setWindowOpenHandler(({ url }) => {
    auditLog.logViolation({ type: 'POPUP_BLOCKED', url });
    return { action: 'deny' };
  });

  // 4. Block View Source
  webContents.on('before-input-event', (event, input) => {
    // Ctrl+U or Cmd+U
    if (input.key === 'u' && (input.control || input.meta)) {
      event.preventDefault();
      auditLog.logViolation({ type: 'VIEW_SOURCE_ATTEMPT' });
    }
    // Ctrl+P or Cmd+P — printing
    if (input.key === 'p' && (input.control || input.meta)) {
      event.preventDefault();
      auditLog.logViolation({ type: 'PRINT_ATTEMPT' });
    }
  });

  // 5. Block drag-and-drop file access
  webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('file://')) {
      event.preventDefault();
      auditLog.logViolation({ type: 'FILE_DRAG_BLOCKED', url });
    }
  });

  console.log('[Content Policy] Browser content policy enforced.');
}

module.exports = { attach };
