/**
 * GestureTraining — Hand gesture training screen (shell for Phase 1)
 * Full ML integration comes in Phase 2
 */
export const GestureTraining = {
  render() {
    return `
      <div class="gesture-screen screen">
        <button class="back-btn" id="btn-gesture-back">Back</button>
        
        <h1 class="screen-title" style="animation: fadeInUp 0.4s ease forwards;">
          Gesture Setup
        </h1>
        
        <div class="gesture-screen__camera" id="gesture-camera">
          <div class="placeholder-content" style="height: 100%; width: 100%;">
            <span class="placeholder-icon">📷</span>
            <span class="placeholder-text" style="font-size: var(--text-xs);">Camera feed will appear here</span>
          </div>
        </div>

        <p class="text-center text-dim" style="font-size: var(--text-sm); margin-bottom: var(--space-md); max-width: 400px; animation: fadeInUp 0.4s ease 0.1s forwards; opacity: 0;">
          Train the game to recognize YOUR hand gestures!
          Select a direction, make a gesture, and hold Record.
        </p>

        <div class="gesture-directions" style="animation: fadeInUp 0.4s ease 0.15s forwards; opacity: 0;">
          <button class="gesture-dir-btn active" data-dir="up" id="dir-up">
            <span class="gesture-dir-btn__arrow">▲</span>
            <span class="gesture-dir-btn__label">UP</span>
            <span class="gesture-dir-btn__count">0 samples</span>
          </button>
          <button class="gesture-dir-btn" data-dir="down" id="dir-down">
            <span class="gesture-dir-btn__arrow">▼</span>
            <span class="gesture-dir-btn__label">DOWN</span>
            <span class="gesture-dir-btn__count">0 samples</span>
          </button>
          <button class="gesture-dir-btn" data-dir="left" id="dir-left">
            <span class="gesture-dir-btn__arrow">◀</span>
            <span class="gesture-dir-btn__label">LEFT</span>
            <span class="gesture-dir-btn__count">0 samples</span>
          </button>
          <button class="gesture-dir-btn" data-dir="right" id="dir-right">
            <span class="gesture-dir-btn__arrow">▶</span>
            <span class="gesture-dir-btn__label">RIGHT</span>
            <span class="gesture-dir-btn__count">0 samples</span>
          </button>
        </div>

        <div class="progress-bar" style="animation: fadeInUp 0.4s ease 0.2s forwards; opacity: 0;">
          <div class="progress-bar__fill" style="width: 0%;" id="gesture-progress"></div>
        </div>
        <p class="text-dim" style="font-size: var(--text-xs); margin-bottom: var(--space-md);">0 / 20 samples</p>

        <button class="gesture-record-btn" id="btn-record" 
                style="animation: fadeInUp 0.4s ease 0.25s forwards; opacity: 0;">
          🔴 Hold to Record
        </button>

        <div style="display: flex; gap: var(--space-md); margin-top: var(--space-lg); animation: fadeInUp 0.4s ease 0.3s forwards; opacity: 0;">
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

  onEnter(el) {
    // Back button
    el.querySelector('#btn-gesture-back').addEventListener('click', () => {
      window.__screenManager.back();
    });

    // Direction buttons
    const dirBtns = el.querySelectorAll('.gesture-dir-btn');
    dirBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        dirBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Record button (placeholder behavior for Phase 1)
    const recordBtn = el.querySelector('#btn-record');
    recordBtn.addEventListener('mousedown', () => {
      recordBtn.classList.add('recording');
      recordBtn.textContent = '⏺ Recording...';
    });
    recordBtn.addEventListener('mouseup', () => {
      recordBtn.classList.remove('recording');
      recordBtn.textContent = '🔴 Hold to Record';
    });
    recordBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      recordBtn.classList.add('recording');
      recordBtn.textContent = '⏺ Recording...';
    });
    recordBtn.addEventListener('touchend', () => {
      recordBtn.classList.remove('recording');
      recordBtn.textContent = '🔴 Hold to Record';
    });

    // Test gestures (placeholder)
    el.querySelector('#btn-test-gestures').addEventListener('click', () => {
      alert('Gesture testing will be available after Phase 2 (ML Integration)!');
    });

    // Reset gestures
    el.querySelector('#btn-reset-gestures').addEventListener('click', () => {
      if (confirm('Reset all trained gestures? This cannot be undone.')) {
        console.log('Gestures reset');
        dirBtns.forEach(b => {
          b.classList.remove('trained');
          b.querySelector('.gesture-dir-btn__count').textContent = '0 samples';
        });
      }
    });
  },
};
