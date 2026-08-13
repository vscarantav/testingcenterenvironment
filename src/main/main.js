const { app, ipcMain, desktopCapturer, BrowserWindow } = require('electron');
const secureBrowser = require('../browser/secureBrowser');
const processMonitor = require('../lockdown/processMonitor');
const inputGuard = require('../lockdown/inputGuard');
const environmentScanner = require('../lockdown/environmentScanner');
const auditLog = require('../security/auditLog');
const platform = require('../platform');

// Initialize security logging
auditLog.init();

ipcMain.handle('get-screen-source', async () => {
  const sources = await desktopCapturer.getSources({ types: ['screen'] });
  // Return the ID of the primary display
  return sources[0].id;
});

ipcMain.on('log-event', (event, payload) => {
  if (payload.error || payload.type.includes('ERROR')) {
    auditLog.logViolation(payload);
  } else {
    auditLog.logEvent(payload);
  }
});

ipcMain.handle('request-media-permissions', async () => {
  return await platform.permissions().requestAll();
});

app.whenReady().then(async () => {
  auditLog.logEvent({ type: 'APP_START', message: 'LockGuard application starting.' });

  // 1. Run Pre-flight Environment Scan
  const scanResult = await environmentScanner.runPreflightScan();
  if (!scanResult.safe) {
    // In a real app, we'd show an error dialog here and exit
    console.error(`FATAL: ${scanResult.message}`);
    // Block app execution
    app.quit();
    return;
  }

  // 2. Start environmental lockdown (kills blocklisted apps, blocks inputs)
  processMonitor.start();
  inputGuard.start();

  // 3. Launch the secure exam browser
  const examWindow = secureBrowser.createSecureBrowser(`file://${__dirname}/../renderer/index.html`);
  
  // Prevent closing
  examWindow.on('close', (e) => {
    // Only allow close if authenticated admin triggers it
    // For now, prevent entirely
    e.preventDefault();
    auditLog.logViolation({ type: 'UNAUTHORIZED_EXIT_ATTEMPT', message: 'Student attempted to close the exam window.' });
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      secureBrowser.createSecureBrowser(`file://${__dirname}/../renderer/index.html`);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  processMonitor.stop();
  inputGuard.stop();
  auditLog.logEvent({ type: 'APP_STOP', message: 'LockGuard application stopping.' });
});
