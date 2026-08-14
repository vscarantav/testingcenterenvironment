/**
 * win32/display.js — Multi-monitor detection on Windows
 *
 * Uses Electron's screen API (backed by Win32 EnumDisplayMonitors).
 * If more than one display is detected, the exam is blocked and a
 * violation is logged (RULE-6).
 *
 * RULE-3: All Windows display code stays here.
 */

'use strict';

const { screen } = require('electron');
const auditLog = require('../../security/auditLog');

function getDisplayCount() {
  return screen.getAllDisplays().length;
}

/**
 * Returns { safe: true } if exactly one display is connected,
 * otherwise returns { safe: false, count } and logs a violation.
 */
function check() {
  const count = getDisplayCount();

  if (count > 1) {
    auditLog.logViolation({
      type: 'MULTI_MONITOR_DETECTED',
      displayCount: count,
      message: `Student has ${count} monitors connected. Exam requires single-display mode.`
    });
    return { safe: false, count };
  }

  return { safe: true, count };
}

/**
 * Listens for display add events during an active exam session.
 * Fires callback(result) when a new display is connected.
 */
function watch(onViolation) {
  screen.on('display-added', () => {
    const result = check();
    if (!result.safe) onViolation(result);
  });
}

module.exports = { check, watch, getDisplayCount };
