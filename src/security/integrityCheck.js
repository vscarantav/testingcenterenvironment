const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const auditLog = require('./auditLog');

// Generate SHA-256 hash of a file
function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('error', err => reject(err));
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function verifyAppIntegrity() {
  console.log('[Integrity Check] Verifying application binaries...');
  try {
    // Example: Hash the main entry point to ensure it hasn't been modified
    const mainPath = path.join(__dirname, '../main/main.js');
    const hash = await hashFile(mainPath);
    
    console.log(`[Integrity Check] main.js hash: ${hash}`);
    
    // In production, compare 'hash' against a known good signature signed by the build server.
    return true;
  } catch (e) {
    auditLog.logViolation({ type: 'INTEGRITY_CHECK_FAILED', error: e.message });
    return false;
  }
}

module.exports = {
  verifyAppIntegrity,
  hashFile
};
