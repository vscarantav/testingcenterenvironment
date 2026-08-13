const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function getRunningProcesses() {
  try {
    const { stdout } = await execPromise('tasklist /FO CSV /NH');
    return stdout.split('\r\n')
      .filter(line => line)
      .map(line => {
        const parts = line.split('","');
        return parts[0].replace('"', ''); // Process name
      });
  } catch (error) {
    console.error('Failed to get running processes on Windows', error);
    return [];
  }
}

async function killProcess(processName) {
  try {
    await execPromise(`taskkill /F /IM "${processName}" /T`);
    return true;
  } catch (error) {
    // Ignore errors if process is not found
    return false;
  }
}

module.exports = {
  getRunningProcesses,
  killProcess
};
