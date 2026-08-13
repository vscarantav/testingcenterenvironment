/**
 * Screen Recorder Handler
 */
class ScreenRecorder {
  constructor() {
    this.stream = null;
  }

  async start() {
    try {
      // Get the source ID of the primary display from the main process
      const sourceId = await window.api.getScreenSource();

      if (!sourceId) {
        throw new Error('Could not determine screen source ID.');
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: false, // Don't capture system audio to prevent overlap with mic
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId,
            minWidth: 1280,
            maxWidth: 1920,
            minHeight: 720,
            maxHeight: 1080
          }
        }
      });

      window.api.logEvent({ type: 'SCREEN_RECORDING_STARTED', message: 'Screen recording stream acquired successfully.' });
      return this.stream;
    } catch (err) {
      console.error('Error accessing screen recording:', err);
      window.api.logEvent({ type: 'SCREEN_RECORDING_ERROR', error: err.message });
      throw new Error('Screen recording access denied or failed to initialize.');
    }
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    window.api.logEvent({ type: 'SCREEN_RECORDING_STOPPED', message: 'Screen recording stream stopped.' });
  }

  getStream() {
    return this.stream;
  }
}

export default new ScreenRecorder();
