const { systemPreferences } = require('electron');

async function checkCamera() {
  return systemPreferences.getMediaAccessStatus('camera') === 'granted';
}

async function checkMicrophone() {
  return systemPreferences.getMediaAccessStatus('microphone') === 'granted';
}

async function checkScreenRecording() {
  return systemPreferences.getMediaAccessStatus('screen') === 'granted';
}

async function checkAccessibility() {
  return systemPreferences.isTrustedAccessibilityClient(false);
}

async function requestAll() {
  const camera = await systemPreferences.askForMediaAccess('camera');
  const microphone = await systemPreferences.askForMediaAccess('microphone');
  // macOS automatically prompts for screen recording when attempting to capture
  
  return {
    camera,
    microphone,
    screenRecording: await checkScreenRecording(),
    accessibility: await checkAccessibility()
  };
}

module.exports = {
  checkCamera,
  checkMicrophone,
  checkScreenRecording,
  checkAccessibility,
  requestAll
};
