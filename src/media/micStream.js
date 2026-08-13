/**
 * Microphone Stream Handler
 */
class MicStream {
  constructor() {
    this.stream = null;
  }

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      window.api.logEvent({ type: 'MIC_STARTED', message: 'Microphone stream acquired successfully.' });
      return this.stream;
    } catch (err) {
      console.error('Error accessing microphone:', err);
      window.api.logEvent({ type: 'MIC_ERROR', error: err.message });
      throw new Error('Microphone access denied or device not found.');
    }
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    window.api.logEvent({ type: 'MIC_STOPPED', message: 'Microphone stream stopped.' });
  }

  getStream() {
    return this.stream;
  }
}

export default new MicStream();
