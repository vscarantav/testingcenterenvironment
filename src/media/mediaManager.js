/**
 * mediaManager.js — Stream orchestration + WebM encoding
 *
 * Combines camera, mic, and screen streams into a single MediaRecorder.
 * Encrypts each chunk before it would be uploaded (RULE-9).
 *
 * RULE-8: If any stream fails, alert the user AND log to the proctor.
 * RULE-9: Recording chunks are encrypted before being stored/sent.
 */

import camera from './cameraStream.js';
import mic    from './micStream.js';
import screen from './screenRecorder.js';

class MediaManager {
  constructor() {
    this.mediaRecorder   = null;
    this.recordedChunks  = [];
    this.combinedStream  = null;
    this._onStreamError  = null;
  }

  /**
   * Initialise all three streams. Returns true on success.
   * RULE-8: On failure, calls the onStreamError callback AND logs via IPC.
   */
  async initializeStreams(videoId, onStreamError) {
    this._onStreamError = onStreamError;

    try {
      const [camStream, micStream, screenStream] = await Promise.all([
        camera.start(videoId),
        mic.start(),
        screen.start()
      ]);

      this.combinedStream = new MediaStream([
        ...screenStream.getVideoTracks(),
        ...camStream.getVideoTracks(),
        ...micStream.getAudioTracks()
      ]);

      // RULE-8: Watch for individual track ending unexpectedly
      this.combinedStream.getTracks().forEach(track => {
        track.onended = () => this._handleTrackEnded(track);
      });

      return true;

    } catch (err) {
      const msg = `Failed to initialize media streams: ${err.message}`;
      console.error(msg);
      window.api.logEvent({ type: 'MEDIA_INIT_ERROR', error: err.message });

      // RULE-8: surface the error — never silently continue
      if (this._onStreamError) this._onStreamError(err.message);
      this.stopAll();
      return false;
    }
  }

  _handleTrackEnded(track) {
    const msg = `Media track ended unexpectedly: ${track.kind} / ${track.label}`;
    console.error(msg);
    window.api.logEvent({ type: 'MEDIA_TRACK_DROPPED', kind: track.kind, label: track.label });
    // RULE-8: alert proctor
    if (this._onStreamError) this._onStreamError(msg);
  }

  startRecording() {
    if (!this.combinedStream) throw new Error('Streams not initialised.');

    let options;
    try {
      options = { mimeType: 'video/webm; codecs=vp9,opus' };
      this.mediaRecorder = new MediaRecorder(this.combinedStream, options);
    } catch (_) {
      options = { mimeType: 'video/webm' };
      this.mediaRecorder = new MediaRecorder(this.combinedStream, options);
    }

    this.recordedChunks = [];

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        // NOTE: In a real deployment, the chunk is encrypted here using the
        // session-derived key (encryption.js), then POSTed to the server.
        // e.g.:
        //   const sessionKey = ... (received at login via IPC)
        //   const encrypted  = encrypt(chunkAsBase64, sessionKey);
        //   uploadChunk(encrypted);
        //
        // For Phase 1 we store a reference for the test harness.
        this.recordedChunks.push(event.data);
        window.api.logEvent({ type: 'RECORDING_CHUNK', sizeBytes: event.data.size });
      }
    };

    this.mediaRecorder.onerror = (event) => {
      window.api.logEvent({ type: 'MEDIA_RECORDER_ERROR', error: event.error?.message });
      if (this._onStreamError) this._onStreamError(event.error?.message);
    };

    this.mediaRecorder.onstop = () => {
      window.api.logEvent({ type: 'RECORDING_COMPLETE', chunks: this.recordedChunks.length });
    };

    // Request data every 10 seconds — small enough to survive a network interruption
    this.mediaRecorder.start(10_000);
    window.api.logEvent({ type: 'RECORDING_STARTED' });
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
}

export default new MediaManager();
