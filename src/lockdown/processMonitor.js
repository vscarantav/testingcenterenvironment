const platform = require('../platform');
const fs = require('fs');
const path = require('path');
const auditLog = require('../security/auditLog');

let monitorInterval = null;
let blocklist;
let whitelist;

const OS_PLATFORM = platform.PLATFORM;
let blockedSet = new Set();
let allowedSet = new Set();

function loadConfig() {
  blocklist = JSON.parse(fs.readFileSync(path.join(__dirname, '../../config/blocklist.json'), 'utf8'));
  whitelist = JSON.parse(fs.readFileSync(path.join(__dirname, '../../config/whitelist.json'), 'utf8'));

  const blockedProcesses = blocklist.processes[OS_PLATFORM] || {};
  const allowedProcesses = whitelist.processes[OS_PLATFORM] || [];

  const blockedList = [
    ...(blockedProcesses.browsers || []),
    ...(blockedProcesses.ai_tools || []),
    ...(blockedProcesses.remote_desktop || []),
    ...(blockedProcesses.screen_share || []),
    ...(blockedProcesses.chat_messaging || []),
    ...(blockedProcesses.virtual_machines || []),
    ...(blockedProcesses.note_taking || [])
  ];

  blockedSet = new Set(blockedList.map(p => p.toLowerCase()));
  allowedSet = new Set(allowedProcesses.map(p => p.toLowerCase()));
}

async function checkProcesses() {
  const running = await platform.processes().getRunningProcesses();
  
  for (const proc of running) {
    const procLower = proc.toLowerCase();
    
    // If it's explicitly allowed, skip
    if (allowedSet.has(procLower)) {
      continue;
    }

    // If it's explicitly blocked, kill it
    if (blockedSet.has(procLower)) {
      console.log(`[Process Monitor] Blocklisted process detected: ${proc}`);
      const killed = await platform.processes().killProcess(proc);
      
      auditLog.logViolation({
        type: 'PROCESS_BLOCKED',
        process: proc,
        actionTaken: killed ? 'KILLED' : 'FAILED_TO_KILL'
      });
    }
  }
}

function start() {
  if (monitorInterval) return;
  loadConfig();
  console.log('[Process Monitor] Starting...');
  // Check every 2 seconds
  monitorInterval = setInterval(checkProcesses, 2000);
  checkProcesses(); // Run immediately
}

function stop() {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
    console.log('[Process Monitor] Stopped.');
  }
}

module.exports = {
  start,
  stop
};
