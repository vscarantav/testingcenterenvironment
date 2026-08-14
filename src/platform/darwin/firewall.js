/**
 * darwin/firewall.js — macOS Packet Filter (pfctl) firewall lockdown
 *
 * Strategy:
 *   1. Write a pf ruleset that blocks all outbound traffic.
 *   2. Allow only TCP port 443 to the exam server hostname.
 *   3. Load the ruleset with `pfctl -f`.
 *   4. On exam end, flush the LockGuard anchor.
 *
 * NOTE: Requires root. The installer (DMG + LaunchDaemon helper) should
 * run the pfctl commands via a privileged helper (SMJobBless / AuthorizationExecuteWithPrivileges).
 *
 * RULE-3: All macOS firewall code stays here.
 * RULE-5: Only the exam server IP is allowed outbound.
 */

'use strict';

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const fs = require('fs');
const path = require('path');
const os = require('os');

const ANCHOR_NAME = 'com.lockguard.exam';

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
    const { stdout } = await execPromise(cmd);
    return { ok: true, stdout: stdout.trim() };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function activate() {
  loadConfig();
  const examServer = new URL(whitelist.server_url).hostname;

  // Resolve the hostname to an IP so pf can use it (pf doesn't resolve DNS)
  const { stdout: ip } = await execPromise(`dig +short ${examServer} | tail -1`).catch(() => ({ stdout: examServer }));
  const examIp = (ip || examServer).trim();

  const pfRules = [
    `# LockGuard exam lockdown anchor`,
    `block out all`,
    `pass out proto tcp to ${examIp} port 443`,
  ].join('\n');

  const tmpFile = path.join(os.tmpdir(), 'lockguard.pf.conf');
  fs.writeFileSync(tmpFile, pfRules, 'utf8');

  console.log(`[Firewall/Darwin] Activating pf lockdown. Exam server: ${examIp}`);

  // Enable pf and load the anchor
  await run('pfctl -e');
  await run(`pfctl -a ${ANCHOR_NAME} -f ${tmpFile}`);

  fs.unlinkSync(tmpFile);
  return true;
}

async function deactivate() {
  console.log('[Firewall/Darwin] Flushing pf anchor...');
  await run(`pfctl -a ${ANCHOR_NAME} -F all`);
  console.log('[Firewall/Darwin] pf anchor flushed.');
  return true;
}

module.exports = { activate, deactivate };
