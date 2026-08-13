const platform = require('../platform');
const auditLog = require('../security/auditLog');

async function runPreflightScan() {
  console.log('[Environment Scanner] Running pre-flight security scan...');
  
  const result = await platform.vmDetect().detectVM();
  
  if (result.isVM) {
    console.error(`[Environment Scanner] Virtual Machine detected! Score: ${result.score}`);
    console.error(`Reasons: ${result.reasons.join(', ')}`);
    
    auditLog.logViolation({
      type: 'VM_DETECTED',
      score: result.score,
      reasons: result.reasons
    });
    
    return {
      safe: false,
      message: 'Virtual Machine environment detected. Exams must be taken on a host operating system.'
    };
  }
  
  // Future checks (multi-monitor, RDP detection) would go here
  
  console.log('[Environment Scanner] Environment scan passed. No VM detected.');
  return {
    safe: true
  };
}

module.exports = {
  runPreflightScan
};
