const auditLog = require('../security/auditLog');
const path = require('path');
const fs = require('fs');

let logFilePath;

function init() {
  // Try to use electron app path, fallback to project directory
  let app;
  try {
    app = require('electron').app;
  } catch (e) {}

  const userDataPath = app ? app.getPath('userData') : path.join(__dirname, '../../../');
  const sessionDir = path.join(userDataPath, 'sessions');
  
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  logFilePath = path.join(sessionDir, `webtraffic-${timestamp}.jsonl`);
  fs.writeFileSync(logFilePath, ''); 
  console.log(`[Web Traffic Logger] Initialized at ${logFilePath}`);
}

function attach(browserWindow) {
  if (!logFilePath) init();

  // Log every completed navigation
  browserWindow.webContents.on('did-navigate', (event, url) => {
    logUrl(url);
  });
  
  browserWindow.webContents.on('did-navigate-in-page', (event, url) => {
    logUrl(url);
  });
}

function logUrl(url) {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    url: url
  }) + '\n';
  
  fs.appendFileSync(logFilePath, entry);
}

module.exports = {
  attach,
  init
};
