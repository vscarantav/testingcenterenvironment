const auditLog = require('./auditLog');

let checkInterval = null;

function detectDebugger() {
  // 1. Check for standard Node.js inspector
  const isDebug = process.execArgv.some(arg => arg.includes('--inspect') || arg.includes('--debug'));
  
  // 2. Check for V8 debugger presence indirectly
  const v8debug = typeof v8debug !== 'undefined';
  
  if (isDebug || v8debug) {
    auditLog.logViolation({ type: 'DEBUGGER_DETECTED', message: 'Node.js inspector or debugger attached.' });
    
    // In a strict mode, we would terminate the app here:
    // require('electron').app.quit();
    
    return true;
  }
  return false;
}

function start() {
  console.log('[Anti-Tamper] Starting active tamper detection...');
  detectDebugger();
  
  // Periodic check
  checkInterval = setInterval(() => {
    detectDebugger();
  }, 5000);
}

function stop() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}

module.exports = {
  start,
  stop
};
