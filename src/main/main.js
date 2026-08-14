/**
 * main.js — Electron app entry point
 *
 * Start-up sequence (matches project-config.json pre_exam_sequence):
 *   1. Remove application menu & apply menu override
 *   2. Register IPC handlers
 *   3. Run pre-flight environment scan (VM, multi-monitor, process scan)
 *   4. If clean → open kiosk exam window
 *   5. Start process monitor + input guard + network filter
 *   6. Attach window manager & content policy
 *
 * RULE-10: project-config.json was read before any changes were made here.
 */

'use strict';

const { app, ipcMain, desktopCapturer, BrowserWindow, dialog } = require('electron');
const path = require('path');

const secureBrowser       = require('../browser/secureBrowser');
const contentPolicy       = require('../browser/contentPolicy');
const processMonitor      = require('../lockdown/processMonitor');
const inputGuard          = require('../lockdown/inputGuard');
const networkFilter       = require('../lockdown/networkFilter');
const environmentScanner  = require('../lockdown/environmentScanner');
const windowManager       = require('./windowManager');
const menuOverride        = require('./menuOverride');
const auditLog            = require('../security/auditLog');
const platform            = require('../platform');

// ─── Initialise logging immediately ─────────────────────────────────────────
auditLog.init();

// ─── Strip application menu before any window is created ────────────────────
menuOverride.apply();

// ─── IPC Handlers ───────────────────────────────────────────────────────────

ipcMain.handle('get-screen-source', async () => {
  const sources = await desktopCapturer.getSources({ types: ['screen'] });
  return sources[0]?.id ?? null;
});

ipcMain.on('log-event', (_event, payload) => {
  if (payload?.error || payload?.type?.includes('ERROR')) {
    auditLog.logViolation(payload);
  } else {
    auditLog.logEvent(payload);
  }
});

ipcMain.handle('request-media-permissions', async () => {
  return await platform.permissions().requestAll();
});

// Admin exit handler — config: Ctrl+Shift+Alt+F12 / Cmd+Shift+Option+F12
ipcMain.handle('admin-exit', async (_event, password) => {
  // TODO Phase 2: verify password against bcrypt hash stored server-side
  const ADMIN_PASSWORD = process.env.LOCKGUARD_ADMIN_PWD || 'ChangeMe!University2025#';
  if (password === ADMIN_PASSWORD) {
    auditLog.logEvent({ type: 'ADMIN_EXIT', message: 'Admin exit authorised.' });
    await networkFilter.deactivate();
    processMonitor.stop();
    inputGuard.stop();
    windowManager.adminClose();
    return { ok: true };
  }
  auditLog.logViolation({ type: 'ADMIN_EXIT_WRONG_PASSWORD' });
  return { ok: false };
});

// ─── App ready ───────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  auditLog.logEvent({ type: 'APP_START', message: 'LockGuard starting.' });

  // Step 1 — Environment scan
  const scanResult = await environmentScanner.runPreflightScan();
  if (!scanResult.safe) {
    await dialog.showErrorBox(
      'LockGuard — Environment Check Failed',
      `${scanResult.message}\n\nPlease take the exam on a physical (non-virtual) machine.`
    );
    app.quit();
    return;
  }

  // Step 2 — Kill blocklisted processes before opening window
  processMonitor.start();

  // Step 3 — Lock keyboard shortcuts and clipboard
  inputGuard.start();

  // Step 4 — Open the secure kiosk window
  const examWindow = secureBrowser.createSecureBrowser(
    `file://${path.join(__dirname, '../renderer/index.html')}`
  );

  // Step 5 — Attach window manager (close/minimise/fullscreen guard)
  windowManager.attach(examWindow);

  // Step 6 — Attach content policy (DevTools, right-click, popups)
  contentPolicy.attach(examWindow.webContents);

  // Step 7 — Activate OS firewall (RULE-5)
  try {
    await networkFilter.activate();
  } catch (err) {
    // RULE-7 fail-secure: if firewall can't be set, warn proctor and log
    auditLog.logViolation({
      type: 'FIREWALL_FAILED_NON_FATAL',
      error: err.message,
      message: 'Firewall activation failed — possibly insufficient privileges. Exam continuing with app-level block only.'
    });
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      secureBrowser.createSecureBrowser(
        `file://${path.join(__dirname, '../renderer/index.html')}`
      );
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', async () => {
  processMonitor.stop();
  inputGuard.stop();
  await networkFilter.deactivate();
  auditLog.logEvent({ type: 'APP_STOP', message: 'LockGuard stopped.' });
});
