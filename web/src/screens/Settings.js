/**
 * Settings — Camera, Audio, Gesture, and Display settings
 */
import { state } from '../utils/StateManager.js';

export const Settings = {
  render() {
    const s = state.get('settings');

    return `
      <div class="settings-screen screen">
        <button class="back-btn" id="btn-settings-back">Back</button>
        
        <h1 class="screen-title" style="animation: fadeInUp 0.4s ease forwards;">
          Settings
        </h1>
        
        <div class="settings-screen__content scrollable">
          <!-- Camera & Privacy -->
          <div class="settings-group" style="animation: fadeInUp 0.4s ease forwards; animation-delay: 0.1s; opacity: 0;">
            <div class="settings-group__title">🎥 Camera & Privacy</div>
            
            <div class="setting-row">
              <span class="setting-row__label">Privacy Mode</span>
              <div class="toggle ${s.camera.privacyMode ? 'active' : ''}" 
                   id="toggle-privacy" data-key="camera.privacyMode">
                <div class="toggle__knob"></div>
              </div>
            </div>
            
            <div class="setting-row">
              <span class="setting-row__label">Show Hand Skeleton</span>
              <div class="toggle ${s.camera.showSkeleton ? 'active' : ''}" 
                   id="toggle-skeleton" data-key="camera.showSkeleton">
                <div class="toggle__knob"></div>
              </div>
            </div>
          </div>

          <!-- Audio -->
          <div class="settings-group" style="animation: fadeInUp 0.4s ease forwards; animation-delay: 0.2s; opacity: 0;">
            <div class="settings-group__title">🔊 Audio</div>
            
            <div class="setting-row">
              <span class="setting-row__label">Master</span>
              <div class="slider-container">
                <input type="range" class="slider" id="slider-master" 
                       min="0" max="100" value="${Math.round(s.audio.master * 100)}"
                       data-key="audio.master" />
                <span class="slider-value" id="val-master">${Math.round(s.audio.master * 100)}%</span>
              </div>
            </div>
            
            <div class="setting-row">
              <span class="setting-row__label">Music</span>
              <div class="slider-container">
                <input type="range" class="slider" id="slider-music" 
                       min="0" max="100" value="${Math.round(s.audio.music * 100)}"
                       data-key="audio.music" />
                <span class="slider-value" id="val-music">${Math.round(s.audio.music * 100)}%</span>
              </div>
            </div>
            
            <div class="setting-row">
              <span class="setting-row__label">SFX</span>
              <div class="slider-container">
                <input type="range" class="slider" id="slider-sfx" 
                       min="0" max="100" value="${Math.round(s.audio.sfx * 100)}"
                       data-key="audio.sfx" />
                <span class="slider-value" id="val-sfx">${Math.round(s.audio.sfx * 100)}%</span>
              </div>
            </div>
            
            <div class="setting-row">
              <span class="setting-row__label">Mute All</span>
              <div class="toggle ${s.audio.muted ? 'active' : ''}" 
                   id="toggle-mute" data-key="audio.muted">
                <div class="toggle__knob"></div>
              </div>
            </div>
          </div>

          <!-- Gesture -->
          <div class="settings-group" style="animation: fadeInUp 0.4s ease forwards; animation-delay: 0.3s; opacity: 0;">
            <div class="settings-group__title">🎮 Gesture Control</div>
            
            <div class="setting-row">
              <span class="setting-row__label">Sensitivity</span>
              <div class="slider-container">
                <input type="range" class="slider" id="slider-sensitivity" 
                       min="50" max="95" value="${Math.round(s.gesture.sensitivity * 100)}"
                       data-key="gesture.sensitivity" />
                <span class="slider-value" id="val-sensitivity">${Math.round(s.gesture.sensitivity * 100)}%</span>
              </div>
            </div>
            
            <div class="setting-row">
              <span class="setting-row__label">Move Debounce</span>
              <div class="slider-container">
                <input type="range" class="slider" id="slider-debounce" 
                       min="100" max="300" step="25" value="${s.gesture.debounce}"
                       data-key="gesture.debounce" />
                <span class="slider-value" id="val-debounce">${s.gesture.debounce}ms</span>
              </div>
            </div>
          </div>

          <!-- Display -->
          <div class="settings-group" style="animation: fadeInUp 0.4s ease forwards; animation-delay: 0.4s; opacity: 0;">
            <div class="settings-group__title">🎨 Display</div>
            
            <div class="setting-row">
              <span class="setting-row__label">Screen Shake</span>
              <div class="toggle ${s.display.screenShake ? 'active' : ''}" 
                   id="toggle-shake" data-key="display.screenShake">
                <div class="toggle__knob"></div>
              </div>
            </div>
            
            <div class="setting-row">
              <span class="setting-row__label">Particle Effects</span>
              <div class="toggle ${s.display.particles ? 'active' : ''}" 
                   id="toggle-particles" data-key="display.particles">
                <div class="toggle__knob"></div>
              </div>
            </div>

            <div class="setting-row">
              <span class="setting-row__label">Show FPS</span>
              <div class="toggle ${s.display.showFps ? 'active' : ''}" 
                   id="toggle-fps" data-key="display.showFps">
                <div class="toggle__knob"></div>
              </div>
            </div>
          </div>

          <!-- Reset Tutorial -->
          <div class="settings-group" style="animation: fadeInUp 0.4s ease forwards; animation-delay: 0.5s; opacity: 0;">
            <div class="settings-group__title">🔧 Other</div>
            <div class="setting-row">
              <span class="setting-row__label">Reset Tutorial</span>
              <button class="menu-btn" id="btn-reset-tutorial" style="font-size: var(--text-sm); padding: var(--space-xs) var(--space-md);">
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  onEnter(el) {
    // Back button
    el.querySelector('#btn-settings-back').addEventListener('click', () => {
      window.__screenManager.back();
    });

    // Toggle switches
    el.querySelectorAll('.toggle').forEach(toggle => {
      toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        const key = toggle.dataset.key;
        const isActive = toggle.classList.contains('active');
        this._updateSetting(key, isActive);
      });
    });

    // Sliders
    el.querySelectorAll('.slider').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const key = slider.dataset.key;
        const raw = parseInt(e.target.value);
        
        // Update display value
        const valEl = slider.parentElement.querySelector('.slider-value');
        if (key === 'gesture.debounce') {
          valEl.textContent = `${raw}ms`;
          this._updateSetting(key, raw);
        } else {
          valEl.textContent = `${raw}%`;
          this._updateSetting(key, raw / 100);
        }
      });
    });

    // Reset tutorial
    el.querySelector('#btn-reset-tutorial').addEventListener('click', () => {
      const tutorialState = { firstLaunchComplete: false, chapterTutorialComplete: {} };
      state.set('tutorialComplete', tutorialState);
      state.saveTutorialState();
      alert('Tutorial has been reset! It will show on next play.');
    });
  },

  _updateSetting(keyPath, value) {
    const settings = state.get('settings');
    const keys = keyPath.split('.');
    let obj = settings;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    state.set('settings', settings);
    state.saveSettings();
  },
};
