const fs = require('fs');
const path = require('path');
const auditLog = require('../security/auditLog');

let whitelist;

function loadConfig() {
  if (!whitelist) {
    whitelist = JSON.parse(fs.readFileSync(path.join(__dirname, '../../config/whitelist.json'), 'utf8'));
  }
}

function attach(browserWindow) {
  loadConfig();
  const allowedServer = new URL(whitelist.server_url).hostname;
  const allowedDomains = new Set([...whitelist.domains, allowedServer]);

  browserWindow.webContents.on('will-navigate', (event, urlString) => {
    handleNavigation(event, urlString);
  });

  browserWindow.webContents.on('will-redirect', (event, urlString) => {
    handleNavigation(event, urlString);
  });
}

function handleNavigation(event, urlString) {
  try {
    const url = new URL(urlString);
    
    // Only allow navigation to whitelisted domains
    if (!whitelist.domains.includes(url.hostname) && url.hostname !== new URL(whitelist.server_url).hostname) {
      event.preventDefault(); // Stop navigation
      console.warn(`[URL Filter] Blocked navigation to: ${url.hostname}`);
      
      auditLog.logViolation({
        type: 'UNAUTHORIZED_NAVIGATION_BLOCKED',
        url: urlString
      });
    }
  } catch (e) {
    // If URL parsing fails, block it
    event.preventDefault();
  }
}

module.exports = {
  attach
};
