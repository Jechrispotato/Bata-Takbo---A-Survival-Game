import * as Phaser from 'phaser';
import { state } from '../utils/StateManager.js';
import { Grid } from './Grid.js';
import { Player } from './Player.js';
import { Boss } from './Boss.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.chapterId = data.chapterId || 1;
    this.isGameOver = false;
    console.log(`[GameScene] Initializing Chapter ${this.chapterId}`);
  }

  preload() {
    this.cameras.main.setBackgroundColor('#0a0a1a');
    
    // Player sprites: 384x64 strips = 8 frames of 48x64 each
    this.load.spritesheet('player_idle_down', '/assets/characters/male/idle/idle_down.png', { frameWidth: 48, frameHeight: 64 });
    this.load.spritesheet('player_idle_up', '/assets/characters/male/idle/idle_up.png', { frameWidth: 48, frameHeight: 64 });
    this.load.spritesheet('player_idle_left', '/assets/characters/male/idle/idle_left.png', { frameWidth: 48, frameHeight: 64 });
    this.load.spritesheet('player_idle_right', '/assets/characters/male/idle/idle_right.png', { frameWidth: 48, frameHeight: 64 });
    this.load.spritesheet('player_dash_down', '/assets/characters/male/dash/Dash_Down.png', { frameWidth: 48, frameHeight: 64 });
    this.load.spritesheet('player_dash_up', '/assets/characters/male/dash/Dash_up.png', { frameWidth: 48, frameHeight: 64 });
    this.load.spritesheet('player_dash_left', '/assets/characters/male/dash/Dash_left_Down.png', { frameWidth: 48, frameHeight: 64 });
    this.load.spritesheet('player_dash_right', '/assets/characters/male/dash/Dash_right_Down.png', { frameWidth: 48, frameHeight: 64 });
    
    // Boss sprite sheet — 5088x832, 6 frames of 848x832
    this.load.spritesheet('boss_duende', '/assets/ui/duende-sprite.png', { frameWidth: 848, frameHeight: 832 });
    
    // UI elements like Hearts
    this.load.spritesheet('ui_buttons', '/assets/ui/buttons.png', { frameWidth: 16, frameHeight: 16 });

    // Projectiles 
    this.load.image('projectile_1', '/assets/projectiles/bone.png');
    this.load.image('projectile_2', '/assets/projectiles/knife.png');
    this.load.image('projectile_3', '/assets/projectiles/red-potion.png');

    // FX
    this.load.spritesheet('fx_damage', '/assets/gui/GenericSparks/GenericSparks-Sheet.png', { frameWidth: 32, frameHeight: 32 });
  }

  create() {
    const { width, height } = this.scale;

    // 1. Initialize dynamic 7x7 Grid (square board, right side of screen)
    this.grid = new Grid(this, 7, 7);
    
    // 2. Initialize Player on the grid
    this.player = new Player(this, this.grid);
    
    // 3. Initialize Boss (attack logic only — sprite lives in HUDScene)
    this.boss = new Boss(this, this.grid);
    this.goldenTile = null;

    // --- GAME LOGIC EVENTS ---
    
    this.events.on('projectile:landed', (col, row) => {
      if (this.player.col === col && this.player.row === row) {
        this.player.takeDamage();
      }
    });
    
    this.events.on('damageTile:spawned', (col, row) => {
      this.goldenTile = { col, row };
    });
    
    this.events.on('damageTile:despawned', (col, row) => {
      if (this.goldenTile && this.goldenTile.col === col && this.goldenTile.row === row) {
        this.goldenTile = null;
      }
    });

    this.events.on('player:moved', (col, row) => {
      if (this.goldenTile && this.goldenTile.col === col && this.goldenTile.row === row) {
        console.log("BOSS HIT!");
        this.boss.takeDamage();
        this.goldenTile = null;
        this.grid.render();
      }
    });

    this.events.on('player:health_changed', (hp) => {
      const hud = this.scene.get('HUDScene');
      if (hud && hud.updateLives) hud.updateLives(hp);
    });

    this.events.on('boss:damaged', (current, max) => {
      const hud = this.scene.get('HUDScene');
      if (hud && hud.updateBossHp) hud.updateBossHp(current, max);
    });

    this.events.on('boss:attack', () => {
      const hud = this.scene.get('HUDScene');
      if (hud && hud.playBossAttack) hud.playBossAttack();
    });

    this.events.on('player:died', () => this.showGameOver(false));
    this.events.on('boss:died', () => this.showGameOver(true));

    // Launch HUD
    this.scene.launch('HUDScene', { chapterId: this.chapterId });

    // Gesture controller
    this.unsubGesture = state.on('gesture:detected', (direction) => {
      this.handleGesture(direction);
    });

    this.cursors = this.input.keyboard.createCursorKeys();
    console.log('[GameScene] Ready.');
  }

  handleGesture(direction) {
    if (direction === 'idle' || this.isGameOver) return;
    this.player.move(direction.toLowerCase());
  }

  showGameOver(isVictory) {
    if (this.isGameOver) return;
    this.isGameOver = true;
    if (this.unsubGesture) this.unsubGesture();

    const { width, height } = this.scale;
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.fillRect(0, 0, width, height);
    bg.setDepth(999);

    const msg = isVictory ? "VICTORY!" : "GAME OVER";
    const color = isVictory ? "#ffd700" : "#ff0000";
    this.add.text(width / 2, height / 2, msg, {
      fontFamily: 'VCR', fontSize: '48px', color
    }).setOrigin(0.5).setDepth(1000);

    this.time.delayedCall(3000, () => {
      const hud = this.scene.get('HUDScene');
      const elapsedSecs = hud ? Math.floor(hud.elapsed / 1000) : 0;
      let finalScore = elapsedSecs * 10;
      if (isVictory) finalScore += 5000;
      if (this.player.hp === this.player.maxHp && isVictory) finalScore += 3000;
      
      this.scene.stop('HUDScene');
      state.set('lastGameResult', {
        chapterId: this.chapterId, isVictory,
        timeSurvived: elapsedSecs, score: finalScore
      });
      if (window.__screenManager) {
        window.__screenManager.navigate('results-screen', {}, false);
      }
    });
  }

  update(time, delta) {
    if (this.isGameOver) return;
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) this.player.move('up');
    if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) this.player.move('down');
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) this.player.move('left');
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) this.player.move('right');
  }

  shutdown() {
    if (this.unsubGesture) this.unsubGesture();
    this.events.removeAllListeners();
    this.scene.stop('HUDScene');
  }
}
