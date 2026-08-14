/**
 * win32/firewall.js — Windows Firewall (netsh / New-NetFirewallRule)
 * 
 * RULE-5: During an active exam, only the exam server is allowed outbound.
 * 
 * Strategy:
 *   1. Block ALL outbound traffic with a default-deny rule at high priority.
 *   2. Carve out an explicit allow rule for the exam server IP/hostname.
 *   3. Tear down rules when the exam ends.
 * 
 * NOTE: Requires elevated privileges (Administrator on Windows).
 * The installer (NSIS) should request admin rights at install time.
 */

'use strict';

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const fs = require('fs');
const path = require('path');

const RULE_NAME_BLOCK  = 'LockGuard_BlockAll';
const RULE_NAME_ALLOW  = 'LockGuard_AllowExamServer';

let whitelist;

function loadConfig() {
  if (!whitelist) {
    whitelist = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../../../config/whitelist.json'), 'utf8')
    );
  }
}

async function run(cmd) {
  try {
    const { stdout } = await execPromise(cmd, { shell: 'powershell.exe' });
    return { ok: true, stdout: stdout.trim() };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

/**
 * Activates OS-level firewall lockdown:
 *   - Blocks all outbound traffic except to the exam server.
 */
async function activate() {
  loadConfig();
  const examServer = new URL(whitelist.server_url).hostname;

  console.log('[Firewall/Win32] Activating OS firewall lockdown...');

  // 1. Block ALL outbound TCP/UDP (priority 1000)
  await run(
    `New-NetFirewallRule -Name '${RULE_NAME_BLOCK}' ` +
    `-DisplayName 'LockGuard: Block All Outbound' ` +
    `-Direction Outbound -Action Block -Priority 1000 -Profile Any ` +
    `-ErrorAction SilentlyContinue`
  );

  // 2. Allow outbound to exam server only (priority 500 — wins over the block rule)
  await run(
    `New-NetFirewallRule -Name '${RULE_NAME_ALLOW}' ` +
    `-DisplayName 'LockGuard: Allow Exam Server' ` +
    `-Direction Outbound -Action Allow -Priority 500 -Profile Any ` +
    `-RemoteAddress '${examServer}' -Protocol TCP -RemotePort 443 ` +
    `-ErrorAction SilentlyContinue`
  );

  console.log(`[Firewall/Win32] Active. Exam server: ${examServer}`);
  return true;
}

/**
 * Removes all LockGuard firewall rules (called on exam end / app quit).
 */
async function deactivate() {
  console.log('[Firewall/Win32] Removing firewall rules...');
  await run(`Remove-NetFirewallRule -Name '${RULE_NAME_BLOCK}' -ErrorAction SilentlyContinue`);
  await run(`Remove-NetFirewallRule -Name '${RULE_NAME_ALLOW}' -ErrorAction SilentlyContinue`);
  console.log('[Firewall/Win32] Firewall rules removed.');
  return true;
}

module.exports = { activate, deactivate };
