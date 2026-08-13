const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const fs = require('fs');
const path = require('path');

let blocklist;

function loadConfig() {
  if (!blocklist) {
    blocklist = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../config/blocklist.json'), 'utf8'));
  }
}

async function runCmd(cmd) {
  try {
    const { stdout } = await execPromise(cmd);
    return stdout.trim().toLowerCase();
  } catch (e) {
    return '';
  }
}

async function detectVM() {
  loadConfig();
  const vmIndicators = blocklist.vm_indicators || {};
  let score = 0;
  const reasons = [];

  // 1. Hypervisor Framework flag
  const hvPresent = await runCmd('sysctl -n kern.hv_vmm_present');
  if (hvPresent === '1') {
    score += 80;
    reasons.push('kern.hv_vmm_present is true (Running in VM)');
  }

  // 2. Hardware Model
  const hwModel = await runCmd('sysctl -n hw.model');
  if (hwModel.includes('vmware') || hwModel.includes('virtualbox') || hwModel.includes('parallels') || hwModel.includes('qemu')) {
    score += 50;
    reasons.push(`Suspicious hw.model: ${hwModel}`);
  }

  // 3. IOKit Device Tree
  const ioreg = await runCmd('ioreg -l | grep -i "virtualbox\\|vmware\\|parallels\\|qemu\\|apple_virtualization" | head -n 10');
  if (ioreg.length > 0) {
    score += 50;
    reasons.push('Suspicious strings in IOKit device tree');
  }

  // 4. Network Adapters (MAC and Names)
  const ifconfig = await runCmd('ifconfig');
  if (ifconfig.includes('vmenet') || ifconfig.includes('vmnet')) {
    score += 40;
    reasons.push('Suspicious Network Adapter (vmnet/vmenet)');
  }
  
  const macPrefixes = vmIndicators.mac_oui_prefixes.map(m => m.toLowerCase());
  const macMatch = macPrefixes.some(prefix => ifconfig.includes(prefix));
  if (macMatch) {
    score += 40;
    reasons.push('Suspicious MAC Address OUI');
  }

  return {
    isVM: score >= 50,
    score,
    reasons
  };
}

module.exports = {
  detectVM
};
