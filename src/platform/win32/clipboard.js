const { clipboard } = require('electron');

let monitorInterval = null;

function clear() {
  clipboard.clear();
}

function startMonitoring() {
  if (monitorInterval) return;
  // Clear clipboard every 500ms
  monitorInterval = setInterval(clear, 500);
}

function stopMonitoring() {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
}

module.exports = {
  clear,
  startMonitoring,
  stopMonitoring
};
