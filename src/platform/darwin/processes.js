const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function getRunningProcesses() {
  try {
    const { stdout } = await execPromise('ps -A -o comm=');
    return stdout.split('\n')
      .filter(line => line)
      .map(line => {
        // Extract just the executable name from the full path
        const parts = line.split('/');
        return parts[parts.length - 1];
      });
  } catch (error) {
    console.error('Failed to get running processes on macOS', error);
    return [];
  }
}

async function killProcess(processName) {
  try {
    await execPromise(`killall -9 "${processName}"`);
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  getRunningProcesses,
  killProcess
};
