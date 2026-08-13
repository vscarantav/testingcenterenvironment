import camera from './cameraStream.js';
import mic from './micStream.js';
import screen from './screenRecorder.js';

class MediaManager {
  constructor() {
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.combinedStream = null;
  }

  async initializeStreams(videoId) {
    try {
      // Initialize streams concurrently
      const [camStream, micStream, screenStream] = await Promise.all([
        camera.start(videoId),
        mic.start(),
        screen.start()
      ]);

      // Combine streams into one for recording
      this.combinedStream = new MediaStream([
        ...screenStream.getVideoTracks(), // Main video is the screen
        ...camStream.getVideoTracks(),    // Secondary video is camera
        ...micStream.getAudioTracks()     // Audio is from microphone
      ]);

      return true;
    } catch (err) {
      console.error('Failed to initialize media streams:', err);
      this.stopAll();
      return false;
    }
  }

  startRecording() {
    if (!this.combinedStream) {
      throw new Error('Cannot start recording: streams not initialized.');
    }

    const options = { mimeType: 'video/webm; codecs=vp9' };
    
    try {
      this.mediaRecorder = new MediaRecorder(this.combinedStream, options);
    } catch (e) {
      console.warn('VP9 codec not supported, falling back to default webm codec', e);
      this.mediaRecorder = new MediaRecorder(this.combinedStream, { mimeType: 'video/webm' });
    }

    this.recordedChunks = [];

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
        
        // In a real app, chunks would be sent to the server periodically here
        // e.g. uploadChunk(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      window.api.logEvent({ type: 'RECORDING_COMPLETE', size: this.recordedChunks.length });
      this.handleRecordingComplete();
    };

    // Request data every 5 seconds (5000ms) to create manageable chunks
    this.mediaRecorder.start(5000);
    window.api.logEvent({ type: 'RECORDING_STARTED', message: 'MediaRecorder started.' });
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  stopAll() {
    this.stopRecording();
    camera.stop();
    mic.stop();
    screen.stop();
    this.combinedStream = null;
  }

  handleRecordingComplete() {
    // Compile chunks into a final blob (usually done server-side as chunks are uploaded)
    const blob = new Blob(this.recordedChunks, {
      type: this.mediaRecorder.mimeType || 'video/webm'
    });
    
    // Simulate upload completion
    console.log(`Recording complete. Total size: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
    
    // Allow garbage collection
    this.recordedChunks = [];
  }
}

export default new MediaManager();
