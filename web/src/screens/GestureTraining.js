/**
 * GestureTraining — Hand gesture training screen
 * Connects to GestureController for real-time Mediapipe/KNN training
 */
import { gestureController } from '../gesture/GestureController.js';
import { state } from '../utils/StateManager.js';

export const GestureTraining = {
  render() {
    return `
      <div class="gesture-screen screen">
        <button class="back-btn" id="btn-gesture-back">Back</button>
        
        <h1 class="screen-title" style="animation: fadeInUp 0.4s ease forwards;">
          Gesture Setup
        </h1>
        
        <div class="gesture-screen__camera" id="gesture-camera">
          <video id="webcam-video" style="display: none;"></video>
          <canvas id="webcam-canvas"></canvas>
          <div id="camera-loading" class="placeholder-content" style="position: absolute; top:0; left:0; height: 100%; width: 100%; pointer-events:none;">
            <div class="loading-spinner"></div>
            <span class="placeholder-text" style="font-size: var(--text-xs);">Initializing Camera...</span>
          </div>
        </div>

        <p class="text-center" style="font-size: var(--text-sm); color: white; margin-bottom: var(--space-md); max-width: 400px; animation: fadeInUp 0.4s ease 0.1s forwards;">
          Train the game to recognize YOUR hand gestures!
          Select a direction, make a gesture, and hold Record.
        </p>

        <div class="gesture-directions" style="animation: fadeInUp 0.4s ease 0.15s forwards;">
          <button class="gesture-dir-btn active" data-dir="up" id="dir-up">
            <span class="gesture-dir-btn__arrow">▲</span>
            <span class="gesture-dir-btn__label">UP</span>
            <span class="gesture-dir-btn__count">0</span>
          </button>
          <button class="gesture-dir-btn" data-dir="down" id="dir-down">
            <span class="gesture-dir-btn__arrow">▼</span>
            <span class="gesture-dir-btn__label">DOWN</span>
            <span class="gesture-dir-btn__count">0</span>
          </button>
          <button class="gesture-dir-btn" data-dir="left" id="dir-left">
            <span class="gesture-dir-btn__arrow">◄</span>
            <span class="gesture-dir-btn__label">LEFT</span>
            <span class="gesture-dir-btn__count">0</span>
          </button>
          <button class="gesture-dir-btn" data-dir="right" id="dir-right">
            <span class="gesture-dir-btn__arrow">►</span>
            <span class="gesture-dir-btn__label">RIGHT</span>
            <span class="gesture-dir-btn__count">0</span>
          </button>
          <button class="gesture-dir-btn" data-dir="idle" id="dir-idle" style="border-color: var(--accent-gold);">
            <span class="gesture-dir-btn__arrow"><img src="/assets/ui/bone-hand.png" alt="Rest" style="height: 1em; vertical-align: bottom;" /></span>
            <span class="gesture-dir-btn__label">REST</span>
            <span class="gesture-dir-btn__count">0</span>
          </button>
        </div>

        <div class="progress-bar" style="animation: fadeInUp 0.4s ease 0.2s forwards;">
          <div class="progress-bar__fill" style="width: 0%;" id="gesture-progress"></div>
        </div>
        <p class="text-primary" style="font-size: var(--text-xs); margin-bottom: var(--space-md);">
          <span id="progress-label">0 / 20</span> samples
        </p>

        <button class="gesture-record-btn" id="btn-record" style="animation: fadeInUp 0.4s ease 0.25s forwards;">
          Hold to Record
        </button>

        <div style="display: flex; gap: var(--space-md); margin-top: var(--space-lg); animation: fadeInUp 0.4s ease 0.3s forwards;">
          <button class="menu-btn" id="btn-test-gestures" style="font-size: var(--text-sm);">
            Test My Gestures
          </button>
          <button class="menu-btn text-red" id="btn-reset-gestures" style="font-size: var(--text-sm);">
            Reset All
          </button>
        </div>
      </div>
    `;
  },

  async onEnter(el) {
    this.videoEl = el.querySelector('#webcam-video');
    this.canvasEl = el.querySelector('#webcam-canvas');
    this.loadingUi = el.querySelector('#camera-loading');
    this.activeDir = 'up'; // default

    // Force canvas size to match video aspect locally
    this.canvasEl.width = 640;
    this.canvasEl.height = 480;

    // Back button
    el.querySelector('#btn-gesture-back').addEventListener('click', async () => {
      // Must save model when leaving
      await gestureController.saveModel();
      gestureController.stopCamera();
      window.__screenManager.back();
    });

    // Initialize controller and start camera
    try {
      await gestureController.initialize(this.videoEl, this.canvasEl);
      await gestureController.startCamera();
      // Hide loading spinner
      this.loadingUi.style.display = 'none';
      this._updateUIFromCounts();
    } catch (e) {
      this.loadingUi.innerHTML = `<span class="text-red">Camera Error. Refresh and allow permissions.</span>`;
    }

    // Direction buttons
    const dirBtns = el.querySelectorAll('.gesture-dir-btn');
    dirBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Drop test mode if clicking directions
        if (gestureController.isTesting) {
          this._toggleTestMode(el, false);
        }

        dirBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeDir = btn.dataset.dir;
        this._updateProgressUI(el);
      });
    });

    // Record button bindings
    const recordBtn = el.querySelector('#btn-record');
    
    const startRec = (e) => {
      if(e) e.preventDefault();
      // Cannot record while testing
      if (gestureController.isTesting) return;

      recordBtn.classList.add('recording');
      recordBtn.textContent = 'Recording...';
      gestureController.startRecording(this.activeDir);
    };

    const stopRec = (e) => {
      if(e) e.preventDefault();
      recordBtn.classList.remove('recording');
      recordBtn.textContent = 'Hold to Record';
      gestureController.stopRecording();
      // Auto-save briefly on stop
      gestureController.saveModel();
    };

    recordBtn.addEventListener('mousedown', startRec);
    window.addEventListener('mouseup', stopRec); // Catch release outside
    recordBtn.addEventListener('touchstart', startRec);
    window.addEventListener('touchend', stopRec);

    // Event listener for incoming sample counts
    this.unsubSampleAdded = state.on('gesture:sampleAdded', (data) => {
      this._updateUIFromCounts(data.counts);
    });

    // Event listener for gesture testing
    this.unsubGestureDetected = state.on('gesture:detected', (detectedDir) => {
      if (!gestureController.isTesting) return;

      // Reset styles
      dirBtns.forEach(b => b.classList.remove('active', 'trained'));
      
      if (detectedDir !== 'idle') {
        const targetBtn = el.querySelector(`#dir-${detectedDir}`);
        if(targetBtn) {
          targetBtn.classList.add('active', 'trained'); 
          // add a pulse animation
          targetBtn.style.animation = 'glowPulse 0.5s ease';
          setTimeout(()=> { targetBtn.style.animation = ''; }, 500);
        }
      }
    });

    // Test gestures Mode Toggle
    const testBtn = el.querySelector('#btn-test-gestures');
    testBtn.addEventListener('click', () => {
      this._toggleTestMode(el, !gestureController.isTesting);
    });

    // Reset gestures
    el.querySelector('#btn-reset-gestures').addEventListener('click', async () => {
      if (confirm('Reset all trained gestures? This cannot be undone.')) {
        await gestureController.resetAllGestures();
        alert('All gestures cleared.');
        this._updateUIFromCounts({});
      }
    });
  },

  onLeave() {
    if (this.unsubSampleAdded) this.unsubSampleAdded();
    if (this.unsubGestureDetected) this.unsubGestureDetected();

    gestureController.isTesting = false;
    gestureController.stopRecording();
    // Safety sync
    gestureController.saveModel();
  },

  _updateUIFromCounts(overrideCounts = null) {
    const counts = overrideCounts || gestureController.getSampleCounts();
    const dirs = ['up', 'down', 'left', 'right', 'idle'];
    
    dirs.forEach(dir => {
      const count = counts[dir] || 0;
      const btn = document.querySelector(`#dir-${dir}`);
      if (btn) {
        btn.querySelector('.gesture-dir-btn__count').textContent = count;
        if (count >= 10) {
          btn.classList.add('trained');
        } else {
          btn.classList.remove('trained');
        }
      }
    });

    this._updateProgressUI(document);
  },

  _updateProgressUI(el) {
    const counts = gestureController.getSampleCounts();
    const count = counts[this.activeDir] || 0;
    const progressFill = el.querySelector('#gesture-progress');
    const progressLabel = el.querySelector('#progress-label');

    if (progressFill && progressLabel) {
      const target = 20; // Recommended target
      const pct = Math.min((count / target) * 100, 100);
      progressFill.style.width = `${pct}%`;
      progressFill.style.background = count >= 10 ? 'var(--accent-green)' : 'linear-gradient(90deg, var(--accent-orange), var(--accent-gold))';
      progressLabel.textContent = `${count} / ${target}`;
    }
  },

  _toggleTestMode(el, active) {
    const testBtn = el.querySelector('#btn-test-gestures');
    const recordBtn = el.querySelector('#btn-record');
    
    gestureController.isTesting = active;

    if (active) {
      testBtn.style.color = 'var(-accent-red)';
      testBtn.textContent = 'Stop Testing';
      
      // hide record button
      recordBtn.classList.add('hidden');
    } else {
      testBtn.style.backgroundColor = '';
      testBtn.style.color = '';
      testBtn.textContent = 'Test My Gestures';
      
      // show record button
      recordBtn.classList.remove('hidden');

      // Reselect the previous active tab
      const dirBtns = el.querySelectorAll('.gesture-dir-btn');
      dirBtns.forEach(b => b.classList.remove('active', 'trained'));
      el.querySelector(`#dir-${this.activeDir}`).classList.add('active');
    }
  }
};
