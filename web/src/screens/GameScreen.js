/**
 * GameScreen — The bridge between the web UI and the Phaser Engine
 */
import * as Phaser from 'phaser';
import { state } from '../utils/StateManager.js';
import { GameScene } from '../game/GameScene.js';
import { HUDScene } from '../game/HUDScene.js';
import { gestureController } from '../gesture/GestureController.js';

export const GameScreen = {
  render() {
    return `
      <div class="game-screen screen">
        <!-- Phaser engine mounts here -->
        <div id="phaser-container" style="width: 100%; height: 100%;"></div>
        
        <!-- Live Camera feed overlay (positioned by HUDScene over the bottom-left box) -->
        <div class="game-screen__camera-pip" id="game-camera-pip" style="
          position: absolute; 
          bottom: 40px; 
          left: 40px;
          width: 200px;
          height: 200px;
          border: none;
          overflow: hidden;
          background: #000;
          z-index: 50;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.5s ease;
        ">
          <video id="game-video" style="width: 100%; height: 100%; object-fit: contain;"></video>
          <canvas id="game-canvas" width="640" height="480" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain;"></canvas>
        </div>

        <!-- Timer Display (positioned by HUDScene) -->
        <div id="game-timer-dom" style="
          position: absolute; 
          top: 8px; 
          left: 60px;
          z-index: 50;
          padding: 4px 8px;
          font-family: 'VCR', monospace;
          font-size: 16px;
          color: #f0e6d3;
          pointer-events: none;
        ">00:00</div>

        <!-- Pause / Exit Button overlay is removed from DOM (now in HUDScene) -->

        <div id="pause-menu" class="hidden" style="
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: var(--bg-overlay);
          backdrop-filter: blur(5px);
          z-index: 100;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-lg);
        ">
          <h2 class="screen-title" style="font-size: var(--text-2xl);">PAUSED</h2>
          
          <div style="background: rgba(0,0,0,0.5); padding: var(--space-md); border-radius: var(--radius-lg); width: 80%; max-width: 400px; display: flex; flex-direction: column; gap: var(--space-sm);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
               <span style="color: var(--text-muted); font-size: var(--text-sm);">Gesture Sensitivity</span>
               <span id="pause-val-sensitivity" style="color: var(--primary);">${Math.round(state.get('settings').gesture.sensitivity * 100)}%</span>
            </div>
            <input type="range" class="slider" id="pause-slider-sensitivity" min="40" max="95" value="${Math.round(state.get('settings').gesture.sensitivity * 100)}" style="width: 100%;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-sm);">
               <span style="color: var(--text-muted); font-size: var(--text-sm);">Gesture Debounce</span>
               <span id="pause-val-debounce" style="color: var(--primary);">${state.get('settings').gesture.debounce}ms</span>
            </div>
            <input type="range" class="slider" id="pause-slider-debounce" min="50" max="300" step="10" value="${state.get('settings').gesture.debounce}" style="width: 100%;">
          </div>

          <button class="menu-btn active" id="btn-resume">RESUME</button>
          <button class="menu-btn" id="btn-restart" style="color: var(--accent-gold);">RESTART</button>
          <button class="menu-btn text-red" id="btn-quit">QUIT TO MENU</button>
        </div>
      </div>
    `;
  },

  async onEnter(el, params) {
    this.container = el.querySelector('#phaser-container');
    this.videoEl = el.querySelector('#game-video');
    this.canvasEl = el.querySelector('#game-canvas');
    this.pauseMenu = el.querySelector('#pause-menu');
    this.isPaused = false;
    
    const chapterId = params.chapterId || 1;
    
    // 1. Boot up ML Gestures
    try {
      await gestureController.initialize(this.videoEl, this.canvasEl);
      await gestureController.startCamera();
    } catch (e) {
      console.warn('Camera failed to start in game', e);
    }
    
    // 2. Adjust PiP view depending on settings
    const currentSettings = state.get('settings');
    const pip = el.querySelector('#game-camera-pip');
    if (currentSettings && currentSettings.camera && !currentSettings.camera.showSkeleton && currentSettings.camera.privacyMode) {
      pip.style.display = 'none';
    }

    // 3. Initialize Game Engine
    // FIX: Don't auto-start scenes. Add them manually to prevent double-creation.
    const config = {
      type: Phaser.AUTO,
      parent: 'phaser-container',
      scale: {
        mode: Phaser.Scale.RESIZE,
        width: '100%',
        height: '100%'
      },
      pixelArt: true,
      transparent: true,
      physics: {
        default: 'arcade',
        arcade: { debug: false }
      },
      scene: [] // Empty — we add scenes manually below
    };

    this.game = new Phaser.Game(config);

    // Add scenes manually ONCE with the correct data, preventing double-start
    this.game.events.on('ready', () => {
      this.game.scene.add('GameScene', GameScene, true, { chapterId });
      this.game.scene.add('HUDScene', HUDScene, false);
      // GameScene.create() will call scene.launch('HUDScene') when ready
    });
    
    state.set('currentScreen', 'game');

    // 4. Bind UI Controls
    this.unsubGamePause = state.on('game:pause', () => this.togglePause(true));
    el.querySelector('#btn-resume').addEventListener('click', () => this.togglePause(false));
    
    // Wire up Pause Menu Live Setting Sliders
    const sensSlider = el.querySelector('#pause-slider-sensitivity');
    const sensVal = el.querySelector('#pause-val-sensitivity');
    sensSlider.addEventListener('input', (e) => {
        const raw = parseInt(e.target.value);
        sensVal.textContent = `${raw}%`;
        const s = state.get('settings');
        s.gesture.sensitivity = raw / 100;
        state.set('settings', s);
        state.saveSettings();
    });

    const debSlider = el.querySelector('#pause-slider-debounce');
    const debVal = el.querySelector('#pause-val-debounce');
    debSlider.addEventListener('input', (e) => {
        const raw = parseInt(e.target.value);
        debVal.textContent = `${raw}ms`;
        const s = state.get('settings');
        s.gesture.debounce = raw;
        state.set('settings', s);
        state.saveSettings();
    });
    
    el.querySelector('#btn-restart').addEventListener('click', () => {
      this.game.destroy(true);
      window.__screenManager.navigate('game-screen', { chapterId: chapterId }, false);
    });

    el.querySelector('#btn-quit').addEventListener('click', () => {
      this.game.destroy(true);
      gestureController.stopCamera();
      window.__screenManager.navigate('main-menu', {}, false);
    });
  },

  onLeave() {
    if (this.unsubGamePause) {
      this.unsubGamePause();
      this.unsubGamePause = null;
    }
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
    gestureController.stopCamera();
    state.set('currentScreen', null);
  },

  togglePause(shouldPause) {
    this.isPaused = shouldPause;
    
    if (shouldPause) {
      this.pauseMenu.classList.remove('hidden');
      if (this.game) {
        this.game.scene.pause('GameScene');
        this.game.scene.pause('HUDScene');
      }
    } else {
      this.pauseMenu.classList.add('hidden');
      if (this.game) {
        this.game.scene.resume('GameScene');
        this.game.scene.resume('HUDScene');
      }
    }
  }
};
