import mediaManager from '../media/mediaManager.js';
import voiceCalibration from '../../proctoring/voiceCalibration.js';

document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-btn');
    const statusText = document.getElementById('camera-status');
    
    startBtn.addEventListener('click', async () => {
        try {
            startBtn.disabled = true;
            startBtn.textContent = 'Requesting Permissions...';
            
            // 1. Request OS permissions via IPC (TCC on macOS)
            const perms = await window.api.requestMediaPermissions();
            
            if (!perms.camera || !perms.microphone) {
                throw new Error("Camera and Microphone permissions are required.");
            }

            // 2. Initialize media streams (Camera, Mic, Screen)
            statusText.textContent = 'Initializing Streams...';
            const success = await mediaManager.initializeStreams('camera-feed');
            
            if (success) {
                // 3. Initialize Voice Calibration
                statusText.textContent = 'Setting up Voice Calibration...';
                await voiceCalibration.init(mediaManager.combinedStream); // Use mic track
                
                const phrases = voiceCalibration.getPhrases(1);
                statusText.style.display = 'block';
                statusText.style.marginTop = '-160px';
                statusText.style.backgroundColor = 'rgba(0,0,0,0.7)';
                statusText.style.padding = '10px';
                statusText.innerHTML = `Please read aloud:<br/><strong>"${phrases[0]}"</strong>`;
                startBtn.textContent = 'I have finished reading';
                
                // Simulate recording audio buffer for enrollment
                startBtn.onclick = async () => {
                    startBtn.disabled = true;
                    statusText.textContent = 'Processing voiceprint...';
                    
                    try {
                        await voiceCalibration.enrollVoiceprint(null); // Mock buffer
                        
                        statusText.style.display = 'none';
                        startBtn.textContent = 'Start Exam';
                        startBtn.classList.add('ready');
                        startBtn.disabled = false;
                        
                        // Switch button behavior to start the actual exam recording
                        startBtn.onclick = () => {
                            mediaManager.startRecording();
                            startBtn.textContent = 'Exam in Progress (Recording)';
                            startBtn.style.backgroundColor = '#d32f2f'; // Red to indicate recording
                            startBtn.disabled = true;
                            // Here we would typically load the actual exam interface
                        };
                    } catch (e) {
                        statusText.textContent = 'Voice calibration failed. Try again.';
                        startBtn.disabled = false;
                    }
                };
            } else {
                throw new Error("Failed to initialize media streams.");
            }
            
        } catch (err) {
            console.error(err);
            statusText.textContent = `Error: ${err.message}`;
            statusText.style.color = '#ff5252';
            startBtn.textContent = 'Retry Pre-Exam Sequence';
            startBtn.disabled = false;
        }
    });
});
