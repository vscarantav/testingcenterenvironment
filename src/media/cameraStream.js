/**
 * Camera Stream Handler
 */
class CameraStream {
  constructor() {
    this.stream = null;
    this.videoElement = null;
  }

  async start(videoElementId) {
    this.videoElement = document.getElementById(videoElementId);
    
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false // Handled separately
      });

      if (this.videoElement) {
        this.videoElement.srcObject = this.stream;
        this.videoElement.play();
      }

      window.api.logEvent({ type: 'CAMERA_STARTED', message: 'Webcam stream acquired successfully.' });
      return this.stream;
    } catch (err) {
      console.error('Error accessing camera:', err);
      window.api.logEvent({ type: 'CAMERA_ERROR', error: err.message });
      throw new Error('Camera access denied or device not found.');
    }
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    window.api.logEvent({ type: 'CAMERA_STOPPED', message: 'Webcam stream stopped.' });
  }

  getStream() {
    return this.stream;
  }
}

export default new CameraStream();
