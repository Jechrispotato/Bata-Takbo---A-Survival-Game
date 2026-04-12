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
        
        <!-- Live Camera feed overlay logic (small PiP format) -->
        <div class="game-screen__camera-pip" id="game-camera-pip" style="
          position: absolute; 
          bottom: max(var(--safe-bottom), 40px); 
          left: max(var(--safe-left), 40px);
          width: calc(clamp(300px, 35vw, 400px) - 80px);
          aspect-ratio: 1 / 1;
          height: auto;
          border: 6px solid #4a4e69;
          border-radius: 50%; /* Make it look like the circle in the reference image */
          overflow: hidden;
          background: #000;
          z-index: 50;
          pointer-events: none;
          box-shadow: 0 0 20px rgba(0,0,0,0.8);
        ">
          <!-- Flip webcam horizontally -->
          <video id="game-video" style="width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1);"></video>
          <!-- Flip canvas to map nicely over the mirrored video -->
          <canvas id="game-canvas" width="640" height="480" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1);"></canvas>
        </div>
        <!-- Timer Display overlay (Mirroring Pause Button exactly but locked to left of right panel) -->
        <div class="menu-btn" id="game-timer-dom" style="
          position: absolute; 
          top: max(var(--safe-top), var(--space-md)); 
          z-index: 50;
          padding: 8px 12px;
          font-size: var(--text-sm);
          pointer-events: none;
        ">00:00</div>

        <!-- Pause / Exit Button overlay -->
        <button class="menu-btn" id="btn-pause" style="
          position: absolute; 
          top: max(var(--safe-top), var(--space-md)); 
          right: max(var(--safe-right), var(--space-md));
          z-index: 50;
          padding: 8px 12px;
          font-size: var(--text-sm);
        ">❚❚ PAUSE</button>

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
          <button class="menu-btn active" id="btn-resume">RESUME</button>
          <button class="menu-btn text-red" id="btn-quit">QUIT</button>
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
    
    // Store active chapter
    const chapterId = params.chapterId || 1;
    
    // 1. Boot up ML Gestures
    try {
      await gestureController.initialize(this.videoEl, this.canvasEl);
      await gestureController.startCamera();
      // Put gesture controller into active non-record testing mode automatically
    } catch (e) {
      console.warn('Camera failed to start in game', e);
    }
    
    // 2. Adjust PiP view depending on settings
    const currentSettings = state.get('settings');
    const pip = el.querySelector('#game-camera-pip');
    if (currentSettings && !currentSettings.camera.showSkeleton && currentSettings.camera.privacyMode) {
      // If privacy mode is on, and skeleton is off, hide feed
      pip.style.display = 'none';
    }

    // 3. Initialize Game Engine
    // Phaser takes over the #phaser-container div width/height natively
    const config = {
      type: Phaser.AUTO,
      parent: 'phaser-container',
      scale: {
        mode: Phaser.Scale.RESIZE,
        width: '100%',
        height: '100%'
      },
      pixelArt: true, // Crucial for our art style
      transparent: true, // Let CSS handle base background if needed
      physics: {
        default: 'arcade',
        arcade: {
          debug: false
        }
      },
      scene: [GameScene, HUDScene]
    };

    this.game = new Phaser.Game(config);

    // Pass data into the scene manually once started
    this.game.events.on('ready', () => {
      // Because GameScene is at index 0, it auto-starts. Stop it to pass data properly, or restart it
      const gameScene = this.game.scene.getScene('GameScene');
      if(gameScene) {
        gameScene.scene.restart({ chapterId });
      }
    });
    
    // Tell state we are in game so GestureController emits inputs
    state.set('currentScreen', 'game');

    // 4. Bind UI Controls
    el.querySelector('#btn-pause').addEventListener('click', () => this.togglePause(true));
    el.querySelector('#btn-resume').addEventListener('click', () => this.togglePause(false));
    
    el.querySelector('#btn-quit').addEventListener('click', () => {
      // Teardown everything
      this.game.destroy(true);
      gestureController.stopCamera();
      window.__screenManager.navigate('main-menu', {}, false);
    });
  },

  onLeave() {
    if (this.game) {
      this.game.destroy(true); // Terminate entire webgl context
      this.game = null;
    }
    gestureController.stopCamera();
    state.set('currentScreen', null);
  },

  togglePause(shouldPause) {
    this.isPaused = shouldPause;
    
    // Toggle menu
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
      
      // Auto-trigger camera check if context was lost
      // gestureController.startCamera(); // (Usually not needed unless iOS strictly suspends tracks)
    }
  }
};
