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
    console.log(`[GameScene] Initializing Chapter ${this.chapterId}`);
  }

  preload() {
    this.cameras.main.setBackgroundColor('#0a0a1a'); // Match UI background
    
    // Characters
    this.load.spritesheet('player_idle', '/assets/characters/male/idle/idle.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('player_walk', '/assets/characters/male/walk/walk.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('player_dash', '/assets/characters/male/dash/Dash.png', { frameWidth: 64, frameHeight: 64 });
    
    // Boss
    this.load.image('boss_redcap', '/assets/ui/duende.jpg');

    // Projectiles 
    this.load.image('projectile_1', '/assets/projectiles/bone.png');
    this.load.image('projectile_2', '/assets/projectiles/knife.png');
    this.load.image('projectile_3', '/assets/projectiles/red-potion.png');

    // GUI & FX
    this.load.spritesheet('fx_healing', '/assets/gui/HealthRegeneration/LifeHealing-Sheet.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('fx_damage', '/assets/gui/GenericSparks/GenericSparks-Sheet.png', { frameWidth: 32, frameHeight: 32 });
  }

  create() {
    // 1. Calculate screen bounds for responsive logic
    const { width, height } = this.scale;
    
    // 2. Temp debug text to verify engine
    this.add.text(width / 2, height / 2, `CHAPTER ${this.chapterId}\nPhaser Engine Online`, {
      fontFamily: 'VCR',
      fontSize: '24px',
      color: '#ffd700',
      align: 'center'
    }).setOrigin(0.5);

    // 3. Initialize dynamic 7x9 Grid
    // For later chapters, we can vary these rows/cols based on this.chapterId
    this.grid = new Grid(this, 7, 9);
    
    // Initialize Player on the grid
    this.player = new Player(this, this.grid);
    
    // Initialize Boss Entity
    this.boss = new Boss(this, this.grid);
    this.goldenTile = null;

    // --- GAME LOGIC EVENTS ---
    
    // 1. Listen for incoming projectiles landing
    this.events.on('projectile:landed', (col, row) => {
      if (this.player.col === col && this.player.row === row) {
        this.player.takeDamage();
      }
    });
    
    // 2. Listen for golden tile spawning
    this.events.on('damageTile:spawned', (col, row) => {
        this.goldenTile = { col, row };
    });
    
    // 3. Listen for golden tile despawning
    this.events.on('damageTile:despawned', (col, row) => {
        if(this.goldenTile && this.goldenTile.col === col && this.goldenTile.row === row) {
            this.goldenTile = null;
        }
    });

    // 4. Listen for player moving (check golden tile hit)
    this.events.on('player:moved', (col, row) => {
        if (this.goldenTile && this.goldenTile.col === col && this.goldenTile.row === row) {
            // Player successfully stepped on the golden tile
            console.log("BOSS HIT!");
            this.boss.takeDamage();
            // Despawn golden tile
            this.goldenTile = null;
            this.grid.render(); // Redraw basic grid without golden tile
        }
    });

    // 5. Game Over / Victory Hooks
    this.events.on('player:health_changed', (hp) => {
        const hud = this.scene.get('HUDScene');
        if(hud) hud.updateLives(hp);
    });

    this.events.on('player:died', () => {
        this.showGameOver(false);
    });

    this.events.on('boss:died', () => {
        this.showGameOver(true);
    });

    // 4. Launch the HUD Scene on top
    this.scene.launch('HUDScene', { chapterId: this.chapterId });

    // 5. Hook into GestureController events via StateManager
    this.unsubGesture = state.on('gesture:detected', (direction) => {
      this.handleGesture(direction);
    });

    // We can also bind keyboard arrows for debugging/fallback
    this.cursors = this.input.keyboard.createCursorKeys();

    console.log('[GameScene] Ready.');
  }

  handleGesture(direction) {
    if (direction === 'idle') return;
    if (this.isGameOver) return;
    
    // Pass control to player entity
    this.player.move(direction.toLowerCase());
  }

  showGameOver(isVictory) {
    if(this.isGameOver) return;
    this.isGameOver = true;

    // Auto-disable controller immediately
    if (this.unsubGesture) this.unsubGesture();

    const { width, height } = this.scale;
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.fillRect(0, 0, width, height);

    const msg = isVictory ? "VICTORY!" : "GAME OVER";
    const color = isVictory ? "#ffd700" : "#ff0000";

    this.add.text(width / 2, height / 2, msg, {
        fontFamily: 'VCR',
        fontSize: '48px',
        color: color
    }).setOrigin(0.5);

    // After 3 seconds, route to Results Screen
    this.time.delayedCall(3000, () => {
       const hud = this.scene.get('HUDScene');
       const elapsedSecs = Math.floor(hud.elapsed / 1000);
       
       // Calculate basic score
       let finalScore = elapsedSecs * 10;
       if(isVictory) finalScore += 5000;
       if(this.player.hp === this.player.maxHp && isVictory) finalScore += 3000; // Flawless bonus
       
       // Stop scenes
       this.scene.stop('HUDScene');
       
       // Save to global state so next screen can read it
       state.set('lastGameResult', {
           chapterId: this.chapterId,
           isVictory,
           timeSurvived: elapsedSecs,
           score: finalScore
       });

       // Trigger DOM navigation
       if (window.__screenManager) {
           window.__screenManager.navigate('results-screen', {}, false); 
       }
    });
  }

  update(time, delta) {
    if(this.isGameOver) return;

    // Keyboard fallback for easy desktop testing
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) this.player.move('up');
    if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) this.player.move('down');
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) this.player.move('left');
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) this.player.move('right');
  }

  // Cleanup when scene is stopped
  shutdown() {
    if (this.unsubGesture) this.unsubGesture();
    this.scene.stop('HUDScene');
  }
}
