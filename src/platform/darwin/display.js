/**
 * darwin/display.js — Multi-monitor detection on macOS
 *
 * Uses Electron's screen API (backed by NSScreen on macOS).
 * Same interface as win32/display.js — platform/index.js calls either.
 *
 * RULE-3: All macOS display code stays here.
 */

'use strict';

const { screen } = require('electron');
const auditLog = require('../../security/auditLog');

function getDisplayCount() {
  return screen.getAllDisplays().length;
}

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

function watch(onViolation) {
  screen.on('display-added', () => {
    const result = check();
    if (!result.safe) onViolation(result);
  });
}

module.exports = { check, watch, getDisplayCount };
