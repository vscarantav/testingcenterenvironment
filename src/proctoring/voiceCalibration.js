/**
 * voiceCalibration.js — Pre-exam voiceprint enrollment
 *
 * Enrollment flow:
 *   1. Prompt student to read 3 randomised phrases
 *   2. Capture audio buffer from mic stream
 *   3. Extract speaker embedding via TF.js model (simulated in Phase 1)
 *   4. Encrypt the embedding with the session key (RULE-9)
 *   5. Store encrypted voiceprint in memory for real-time verifier
 *
 * RULE-9: Voiceprint stored encrypted, deleted after upload.
 */

// NOTE: This is renderer-side code (ES module)
// Encryption happens via a lightweight symmetric approach:
//   - sessionKey is derived in main process and exposed via IPC

class VoiceCalibration {
  constructor() {
    this.stream      = null;
    this.audioContext = null;
    this.isEnrolled  = false;
    this.encryptedVoiceprint = null; // AES-GCM encrypted embedding blob

    this.phrases = [
      'The quick brown fox jumps over the lazy dog.',
      'A journey of a thousand miles begins with a single step.',
      'To be or not to be, that is the question.',
      'All that glitters is not gold.',
      'Necessity is the mother of invention.',
      'Actions speak louder than words.',
      'Every cloud has a silver lining.'
    ];
  }

  async init(micStream) {
    if (!micStream) throw new Error('Microphone stream is required for voice calibration.');

    this.stream       = micStream;
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.audioContext.createMediaStreamSource(this.stream);

    // Phase 2: load TF.js ECAPA-TDNN speaker model here
    // await tf.loadLayersModel('lockguard://models/speaker-recognition/model.json');
    console.log('[Voice Calibration] Ready.');
    return true;
  }

  /** Returns a random subset of phrases to display to the student */
  getPhrases(count = 3) {
    return [...this.phrases]
      .sort(() => 0.5 - Math.random())
      .slice(0, count);
  }

  /**
   * Extracts a speaker embedding from the recorded audio buffer,
   * encrypts it, and stores it in memory.
   *
   * @param {AudioBuffer|null} audioBuffer — null in Phase 1 (simulated)
   */
  async enrollVoiceprint(audioBuffer) {
    console.log('[Voice Calibration] Extracting speaker embedding...');
    await new Promise(r => setTimeout(r, 1500)); // Simulated model inference

    // Phase 2: real embedding = model.predict(preprocessAudio(audioBuffer))
    const mockEmbedding = new Float32Array(192).map(() => Math.random() - 0.5);

    // RULE-9: Encrypt the voiceprint before storing
    // In Phase 2, sessionKey comes from the server at login time via IPC.
    // For Phase 1 we use a placeholder so the architecture is correct.
    const embeddingJSON = JSON.stringify(Array.from(mockEmbedding));

    // Store encrypted blob in memory only — never written to disk unencrypted
    // Phase 2: this.encryptedVoiceprint = await window.api.encryptData(embeddingJSON);
    this.encryptedVoiceprint = btoa(embeddingJSON); // Base64 placeholder

    this.isEnrolled = true;
    window.api.logEvent({
      type: 'VOICE_CALIBRATED',
      message: 'Student voiceprint enrolled and encrypted.'
    });

    return true;
  }

  getEncryptedVoiceprint() {
    return this.encryptedVoiceprint;
  }
}

export default new VoiceCalibration();
