/**
 * networkFilter.js — OS-level firewall orchestrator (RULE-5)
 *
 * Delegates to platform/win32/firewall.js or platform/darwin/firewall.js.
 * Called from main.js AFTER environment scan, BEFORE exam starts.
 *
 * RULE-5: Only the exam server is reachable during an active session.
 * RULE-7: If firewall activation fails → block exam start (fail-secure).
 */

'use strict';

const platform = require('../platform');
const auditLog  = require('../security/auditLog');

let isActive = false;

async function activate() {
  if (isActive) return true;

  console.log('[Network Filter] Activating OS firewall lockdown...');
  try {
    await platform.firewall().activate();
    isActive = true;
    auditLog.logEvent({ type: 'FIREWALL_ACTIVATED', message: 'OS-level firewall lockdown active.' });
    return true;
  } catch (err) {
    // RULE-7: fail-secure — log and propagate so main.js can block the exam
    auditLog.logViolation({ type: 'FIREWALL_ACTIVATION_FAILED', error: err.message });
    throw err;
  }
}

async function deactivate() {
  if (!isActive) return;

  console.log('[Network Filter] Deactivating OS firewall lockdown...');
  try {
    await platform.firewall().deactivate();
    isActive = false;
    auditLog.logEvent({ type: 'FIREWALL_DEACTIVATED', message: 'OS-level firewall rules removed.' });
  } catch (err) {
    auditLog.logViolation({ type: 'FIREWALL_DEACTIVATION_FAILED', error: err.message });
  }
}

module.exports = { activate, deactivate };
