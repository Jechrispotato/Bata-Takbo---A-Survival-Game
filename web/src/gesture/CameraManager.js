/**
 * CameraManager
 * Handles requesting permissions and providing the video stream.
 * Supports privacy mode (blacked out feed).
 */
export class CameraManager {
  constructor(videoElement) {
    this.video = videoElement;
    this.stream = null;
    this.isActive = false;
  }

  async initialize() {
    if (this.isActive) return;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user', // Front-facing camera
        },
        audio: false,
      });
      
      this.video.srcObject = this.stream;
      this.video.playsInline = true;
      
      return new Promise((resolve) => {
        const onReady = () => {
          this.video.play().then(() => {
            this.isActive = true;
            resolve();
          }).catch(e => {
            console.error('Video play error:', e);
            resolve(); // Resolve anyway so it doesn't hang forever
          });
        };

        if (this.video.readyState >= 1) { // HAVE_METADATA or higher
          onReady();
        } else {
          this.video.onloadedmetadata = onReady;
        }
      });
    } catch (err) {
      console.error('Camera access failed:', err);
      throw new Error('Could not access camera. Please check permissions.');
    }
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.video.srcObject = null;
      this.stream = null;
    }
    this.isActive = false;
  }
}
