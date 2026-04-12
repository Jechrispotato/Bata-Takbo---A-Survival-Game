/**
 * GestureController
 * The overarching manager for tracking UI/Hardware to the game.
 */
import { CameraManager } from './CameraManager.js';
import { HandDetector } from './HandDetector.js';
import { GestureClassifier } from './GestureClassifier.js';
import { state } from '../utils/StateManager.js';

class GestureController {
  constructor() {
    this.cameraManager = null;
    this.handDetector = null;
    this.classifier = null;

    this.isRecording = false;
    this.recordingLabel = null;
    this.recordInterval = null;

    this.isTesting = false;

    // Movement Debouncing
    this.currentGesture = 'idle';
    this.gestureStartStamp = 0;

    // Listen for setting changes
    state.on('settings:changed', (data) => {
      this.applySettings(state.get('settings'));
    });
  }

  /**
   * Fully initialize the system components. Expensive operation.
   * Can be hooked to a video and canvas element in GestureTraining.
   */
  async initialize(videoEl, canvasEl) {
    if (!this.classifier) {
      this.classifier = new GestureClassifier();
      await this.classifier.initialize();
      // Check if IDB model was found
      if (this.classifier.isLoaded) {
        state.set('gestureModelTrained', true);
      }
    }

    if (!this.cameraManager && videoEl) {
      this.cameraManager = new CameraManager(videoEl);
    } else if (this.cameraManager && videoEl) {
      this.cameraManager.video = videoEl;
    }
    
    if (!this.handDetector && videoEl && canvasEl) {
      this.handDetector = new HandDetector(videoEl, canvasEl);
      await this.handDetector.initialize();
    } else if (this.handDetector && videoEl && canvasEl) {
      this.handDetector.bindElements(videoEl, canvasEl);
    }  
    
    // Update config from state
    const settings = state.get('settings');
    this.handDetector.setPrivacyMode(settings.camera.privacyMode);
    this.handDetector.setShowSkeleton(settings.camera.showSkeleton);
    this.handDetector.onResults(this._handleDetection.bind(this));
  }

  /**
   * Start the camera loops
   */
  async startCamera() {
    try {
      await this.cameraManager.initialize();
      this.handDetector.start();
    } catch (e) {
      console.error(e);
      alert('Must allow camera feed to train hand gestures.');
    }
  }

  /**
   * Stop the camera loops
   */
  stopCamera() {
    if (this.handDetector) this.handDetector.stop();
    if (this.cameraManager) this.cameraManager.stop();
  }

  /**
   * Train flow
   */
  startRecording(label) {
    this.isRecording = true;
    this.recordingLabel = label;
  }

  stopRecording() {
    this.isRecording = false;
    this.recordingLabel = null;
  }

  /**
   * Apply settings update live
   */
  applySettings(settings) {
    if (this.handDetector) {
      this.handDetector.setPrivacyMode(settings.camera.privacyMode);
      this.handDetector.setShowSkeleton(settings.camera.showSkeleton);
    }
  }

  /**
   * The core frame loop logic dispatched by MediaPipe payload
   */
  async _handleDetection(features, hasHand) {
    if (!hasHand) {
      this.currentGesture = 'idle';
      if (this.isTesting) state.emit('gesture:detected', 'idle');
      return;
    }

    if (this.isRecording && this.recordingLabel) {
      this.classifier.addExample(features, this.recordingLabel);
      state.emit('gesture:sampleAdded', {
        label: this.recordingLabel,
        counts: this.classifier.getClassExampleCount() // To update UI
      });
      return;
    }

    // Default mode during testing or active gameplay
    if (this.isTesting || state.get('currentScreen') === 'game') {
      const pred = await this.classifier.predict(features);
      const settings = state.get('settings');
      
      let detectedMove = 'idle';
      if (pred.confidence >= settings.gesture.sensitivity) {
        detectedMove = pred.label;
      }

      // Debouncing: We must see the same move for X ms to emit.
      // (Bypassed if we just jump to a totally different strong inference)
      if (detectedMove !== this.currentGesture) {
        this.currentGesture = detectedMove;
        this.gestureStartStamp = performance.now();
      } else {
        const heldFor = performance.now() - this.gestureStartStamp;
        if (heldFor >= settings.gesture.debounce) {
          state.emit('gesture:detected', detectedMove);
        }
      }
    }
  }

  async saveModel() {
    await this.classifier.saveModel();
    state.set('gestureModelTrained', true);
  }

  async resetAllGestures() {
    if (this.classifier) {
      await this.classifier.resetModel();
    }
    state.set('gestureModelTrained', false);
    state.emit('gesture:sampleAdded', { label: '', counts: {} });
  }

  getSampleCounts() {
    if (!this.classifier) return {};
    return this.classifier.getClassExampleCount();
  }
}

export const gestureController = new GestureController();
