const fs = require('fs');
const path = require('path');

let logFilePath;

function init() {
  // For now we'll just write to the project root / logs.
  // In a real electron app, app.getPath('userData') would be used.
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
  logFilePath = path.join(sessionDir, `audit-${timestamp}.jsonl`);
  fs.writeFileSync(logFilePath, ''); // Create empty file
  
  console.log(`[Audit Log] Initialized at ${logFilePath}`);
}

function logViolation(event) {
  if (!logFilePath) init();
  
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'WARNING',
    ...event
  }) + '\n';
  
  fs.appendFileSync(logFilePath, entry);
  console.warn(`[AUDIT] ${entry.trim()}`);
}

function logEvent(event) {
  if (!logFilePath) init();
  
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'INFO',
    ...event
  }) + '\n';
  
  fs.appendFileSync(logFilePath, entry);
  console.log(`[AUDIT] ${entry.trim()}`);
}

module.exports = {
  init,
  logViolation,
  logEvent
};
