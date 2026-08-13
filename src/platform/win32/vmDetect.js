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

  // 1. BIOS / Manufacturer Strings
  const bios = await runCmd('wmic computersystem get model,manufacturer');
  if (vmIndicators.bios_strings.some(s => bios.includes(s.toLowerCase()))) {
    score += 50;
    reasons.push('Suspicious BIOS/Manufacturer string');
  }

  // 2. Disk Drives
  const disk = await runCmd('wmic diskdrive get model,caption');
  if (vmIndicators.disk_strings.some(s => disk.includes(s.toLowerCase()))) {
    score += 50;
    reasons.push('Suspicious Disk Drive model');
  }

  // 3. Network Adapters (MAC OUIs and Names)
  const nic = await runCmd('wmic nic get Name,MACAddress');
  if (vmIndicators.network_adapter_names.some(s => nic.includes(s.toLowerCase()))) {
    score += 40;
    reasons.push('Suspicious Network Adapter name');
  }
  const macPrefixes = vmIndicators.mac_oui_prefixes.map(m => m.replace(/:/g, '').toLowerCase());
  const macMatch = macPrefixes.some(prefix => nic.replace(/:/g, '').includes(prefix));
  
  if (macMatch) {
    score += 40;
    reasons.push('Suspicious MAC Address OUI');
  }

  // 4. Video Controller
  const gpu = await runCmd('wmic path win32_videocontroller get name');
  if (vmIndicators.gpu_strings.some(s => gpu.includes(s.toLowerCase()))) {
    score += 40;
    reasons.push('Suspicious Display Adapter');
  }

  // 5. Services
  const services = await runCmd('wmic service get name');
  if (vmIndicators.service_names_win32.some(s => services.includes(s.toLowerCase()))) {
    score += 30;
    reasons.push('Suspicious VM Service running');
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
