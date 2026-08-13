const fs = require('fs');
const path = require('path');
const auditLog = require('../security/auditLog');

let blocklist;

function loadConfig() {
  if (!blocklist) {
    blocklist = JSON.parse(fs.readFileSync(path.join(__dirname, '../../config/blocklist.json'), 'utf8'));
  }
}

function attach(session) {
  loadConfig();
  const aiDomains = blocklist.domains || [];

  // Match all URLs
  const filter = { urls: ['*://*/*'] };

  session.webRequest.onBeforeRequest(filter, (details, callback) => {
    const url = new URL(details.url);
    
    // Check if the domain is in our AI tools blocklist
    const isBlocked = aiDomains.some(domain => 
      url.hostname === domain || url.hostname.endsWith(`.${domain}`)
    );

    if (isBlocked) {
      console.warn(`[Network Block] Intercepted request to AI service: ${url.hostname}`);
      auditLog.logViolation({
        type: 'AI_NETWORK_REQUEST_BLOCKED',
        url: details.url
      });
      callback({ cancel: true }); // Drop the request
    } else {
      callback({ cancel: false });
    }
  });
}

module.exports = {
  attach
};
