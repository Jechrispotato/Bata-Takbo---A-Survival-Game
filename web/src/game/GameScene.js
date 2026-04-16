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

    // Boss sprite sheets

    if (this.chapterId === 1) {
      this.load.spritesheet('boss_idle', '/assets/characters/boss/chapter-1/boss_idle.png', { frameWidth: 85, frameHeight: 94 });
      this.load.spritesheet('boss_cast', '/assets/characters/boss/chapter-1/boss_cast.png', { frameWidth: 122, frameHeight: 110 });
      
      // Phase 5: Dynamic Loading of Custom Blood/Gore Sequence Projectiles
      for (let i = 0; i <= 14; i++) {
        this.load.image(`blood_${i}`, `/assets/projectiles/chapter1/blood/1_${i}.png`);
        this.load.image(`dark_blood_${i}`, `/assets/projectiles/chapter1/dark-blood/1_${i}.png`);
      }
      for (let i = 0; i <= 59; i++) {
        const str = i.toString().padStart(3, '0');
        this.load.image(`blood_splat_${str}`, `/assets/projectiles/chapter1/blood-splat/1_${str}.png`);
      }
      this.load.image('ch1_eye', '/assets/projectiles/chapter1/eye.png');
      this.load.image('ch1_hand1', '/assets/projectiles/chapter1/hands-1.png');
      this.load.image('ch1_hand2', '/assets/projectiles/chapter1/hand-2.png');
      this.load.image('ch1_hand3', '/assets/projectiles/chapter1/hand-3.png');

    } else {
      // Default to Chapter 2 Placeholder
      this.load.spritesheet('boss_idle', '/assets/characters/boss/chapter-2/boss_idle.png', { frameWidth: 87, frameHeight: 110 });
      this.load.spritesheet('boss_cast', '/assets/characters/boss/chapter-2/boss_idle.png', { frameWidth: 87, frameHeight: 110 });
    }
    
    // UI elements like Hearts
    this.load.spritesheet('ui_buttons', '/assets/ui/buttons.png', { frameWidth: 16, frameHeight: 16 });

    // Projectiles 
    this.load.image('projectile_1', '/assets/projectiles/bone.png');
    this.load.image('projectile_2', '/assets/projectiles/knife.png');
    this.load.image('projectile_3', '/assets/projectiles/red-potion.png');

    // FX
    this.load.spritesheet('fx_damage', '/assets/gui/GenericSparks/GenericSparks-Sheet.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('symbol_alert', '/assets/fx/symbol_alert.png', { frameWidth: 80, frameHeight: 80 });

    // Power-Up Assets — Chests.png is 288x128 = 9 cols x 4 rows of 32x32 frames
    // Columns 0=Common(green), 1=Rare(blue), 2=Legendary(gold)
    this.load.spritesheet('powerup_chests', '/assets/powerups/Chests.png', { frameWidth: 32, frameHeight: 32 });
    // 02.png is the placeholder icon sheet for the HUD power-up slot
    this.load.image('powerup_ui', '/assets/powerups/02.png');
    
    this.load.spritesheet('lightning_burst', '/assets/fx/lightning_burst.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('stylized_explosion', '/assets/fx/stylized_explosion.png', { frameWidth: 96, frameHeight: 96 });
  }

  create() {
    const { width, height } = this.scale;

    // 1. Initialize dynamic Grid based on Chapter ID
    let gridCols = 7, gridRows = 7;
    if (this.chapterId === 1) {
      gridCols = 5;
      gridRows = 5;
    } else if (this.chapterId === 2) {
      gridCols = 7;
      gridRows = 7;
    } else if (this.chapterId === 3) {
      gridCols = 9;
      gridRows = 9;
    }

    this.grid = new Grid(this, gridCols, gridRows);
    
    // 2. Initialize Player on the grid
    this.player = new Player(this, this.grid);
    
    // 3. Initialize Boss (attack logic only — sprite lives in HUDScene)
    this.boss = new Boss(this, this.grid);
    this.goldenTile = null;

    if (!this.anims.exists('anim_symbol_alert')) {
      this.anims.create({ key: 'anim_symbol_alert', frames: this.anims.generateFrameNumbers('symbol_alert'), frameRate: 20, repeat: 0 });
      this.anims.create({ key: 'anim_lightning_burst', frames: this.anims.generateFrameNumbers('lightning_burst'), frameRate: 20, repeat: 0 });
      this.anims.create({ key: 'anim_stylized_explosion', frames: this.anims.generateFrameNumbers('stylized_explosion'), frameRate: 24, repeat: 0 });

      // Power Up Chest Animations (Vertical animation mapping across 9 columns where rarity defines the column index)
      for (let i = 0; i < 3; i++) {
        this.anims.create({
          key: `chest_open_${i}`,
          frames: [ { key: 'powerup_chests', frame: i }, { key: 'powerup_chests', frame: i + 9 }, { key: 'powerup_chests', frame: i + 18 } ],
          frameRate: 12,
          repeat: 0
        });
      }

      // Compile Phase 5 Chapter 1 Blood Sequences into Animations
      if (this.chapterId === 1 && !this.anims.exists('anim_blood')) {
          let bFrames = [];
          for (let i = 0; i <= 14; i++) bFrames.push({ key: `blood_${i}` });
          this.anims.create({ key: 'anim_blood', frames: bFrames, frameRate: 15, repeat: -1 });

          let dbFrames = [];
          for (let i = 0; i <= 14; i++) dbFrames.push({ key: `dark_blood_${i}` });
          this.anims.create({ key: 'anim_dark_blood', frames: dbFrames, frameRate: 15, repeat: -1 });

          let splatFrames = [];
          for (let i = 0; i <= 59; i++) splatFrames.push({ key: `blood_splat_${i.toString().padStart(3, '0')}` });
          this.anims.create({ key: 'anim_blood_splat', frames: splatFrames, frameRate: 30, repeat: 0 });
      }
    }

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
      // Check for chest collision
      if (this.grid.hasChestAt(col, row)) {
        const rarity = this.grid.removeChestAt(col, row);
        this.events.emit('chest:opened', rarity);
      }
    });

    this.events.on('chest:opened', (rarity) => {
      // ── Particle Burst (grey / blue / gold by rarity) ──
      const particleColors = [0x999999, 0x44aaff, 0xffdd00];
      const px = this.player.sprite.x;
      const py = this.player.sprite.y;
      const burstColor = particleColors[rarity] ?? 0x999999;
      
      // Increased particle count and velocity for a juicier pop
      for (let i = 0; i < 30; i++) {
        const angle = (i / 30) * Math.PI * 2 + Math.random() * 0.2;
        const speed = Phaser.Math.Between(100, 220);
        const prt = this.add.graphics().setDepth(250);
        prt.fillStyle(burstColor, 1);
        prt.fillCircle(0, 0, Phaser.Math.Between(3, 7)); // Larger particles
        prt.x = px; prt.y = py - 10;
        this.tweens.add({
          targets: prt,
          x: px + Math.cos(angle) * speed,
          y: py - 10 + Math.sin(angle) * speed,
          alpha: 0, 
          duration: 700,
          ease: 'Cubic.easeOut', // Makes it explode fast then slow down
          onComplete: () => prt.destroy()
        });
      }

      // ── Pick a random power-up within the rarity tier ──
      const pools = [
        // Common (rarity 0) — grey
        [
          { name: 'SPEED BOOST', apply: () => this._applyBuff('speed', 5000) },
          { name: 'VITALITY',    apply: () => { if (this.player.hp < this.player.maxHp) { this.player.hp++; this.events.emit('player:health_changed', this.player.hp); } } },
          { name: 'SIGHT',       apply: () => this._applyBuff('sight', 6000) },
        ],
        // Rare (rarity 1) — blue
        [
          { name: 'THE ANCHOR',    apply: () => this._applyBuff('anchor', 5000) },
          { name: 'DASH',          apply: () => this._applyBuff('dash', 8000) },
          { name: 'HEALTH POTION', apply: () => { this.player.maxHp++; this.player.hp = this.player.maxHp; this.events.emit('player:health_changed', this.player.hp); } },
        ],
        // Legendary (rarity 2) — gold
        [
          { name: 'INVINCIBILITY', apply: () => this._applyBuff('invincible', 5000) },
          { name: 'TIME STOP',     apply: () => this._applyBuff('timestop', 3000) },
          { name: 'BLINK',         apply: () => this._applyBuff('blink', 0) },
        ],
      ];

      const pool = pools[rarity] ?? pools[0];
      const chosen = Phaser.Math.RND.pick(pool);
      const DURATION = [5000, 5000, 5000][rarity] ?? 5000;
      chosen.apply();

      // Notify HUD powerup slot
      if (chosen.name !== 'VITALITY' && chosen.name !== 'HEALTH POTION' && chosen.name !== 'BLINK') {
        this.events.emit('powerup:activated', chosen.name, rarity, DURATION);
      }

      // Floating text feedback
      const msgColors = ['#aaaaaa', '#44aaff', '#ffdd00'];
      const txt = this.add.text(px, py - 40, chosen.name, {
        fontFamily: 'VCR', fontSize: '18px',
        color: msgColors[rarity] ?? '#ffffff',
        stroke: '#000000', strokeThickness: 4
      }).setOrigin(0.5).setDepth(300);
      this.tweens.add({ targets: txt, y: txt.y - 50, alpha: 0, duration: 2200, onComplete: () => txt.destroy() });
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

      // Spawn alert over player
      if (this.player && this.player.sprite) {
        const alertSpr = this.add.sprite(this.player.sprite.x, this.player.sprite.y - 60, 'symbol_alert');
        alertSpr.setScale(1.2).setDepth(200);
        alertSpr.play('anim_symbol_alert');
        alertSpr.once('animationcomplete', () => alertSpr.destroy());
      }
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

  _applyBuff(type, durationMs) {
    if (type === 'speed') {
      this.player.isSpeedBoosted = true;
      this.time.delayedCall(durationMs, () => this.player.isSpeedBoosted = false);
    } else if (type === 'sight') {
      this.player.hasSight = true;
      this.time.delayedCall(durationMs, () => this.player.hasSight = false);
    } else if (type === 'anchor') {
      this.player.isAnchored = true;
      this.player.sprite.setTint(0x4488ff);
      this.time.delayedCall(durationMs, () => {
        this.player.isAnchored = false;
        this.player.sprite.clearTint();
      });
    } else if (type === 'dash') {
      this.player.hasDash = true;
      // Triggers auto-clear on next move in Player.js
    } else if (type === 'invincible') {
      this.player.isInvincible = true;
      this.player.sprite.setTint(0xffdd00);
      const shim = this.tweens.add({ targets: this.player.sprite, alpha: 0.6, yoyo: true, repeat: -1, duration: 200 });
      this.time.delayedCall(durationMs, () => {
        this.player.isInvincible = false;
        this.player.sprite.clearTint();
        this.player.sprite.alpha = 1;
        shim.stop();
      });
    } else if (type === 'timestop') {
      this.events.emit('boss:timestop', true);
      this.time.delayedCall(durationMs, () => this.events.emit('boss:timestop', false));
    } else if (type === 'blink') {
      if (this.goldenTile) {
        // Flash fx
        const fx = this.add.sprite(this.player.sprite.x, this.player.sprite.y, 'lightning_burst');
        fx.setScale(1.5).setDepth(200).play('anim_lightning_burst');
        fx.once('animationcomplete', () => fx.destroy());

        // TP directly to the target tile
        this.player.col = this.goldenTile.col;
        this.player.row = this.goldenTile.row;
        const tgt = this.grid.getPixelPosition(this.player.col, this.player.row);
        this.player.sprite.x = tgt.x;
        this.player.sprite.y = tgt.y;
        this.events.emit('player:moved', this.player.col, this.player.row);
      }
    }
  }

  update(time, delta) {
    if (this.isGameOver) return;
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) this.player.move('up');
    if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) this.player.move('down');
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) this.player.move('left');
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) this.player.move('right');
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
      
      // Unlock next chapter permanently on victory
      if (isVictory) {
        let progress = state.get('chapterProgress') || { chaptersUnlocked: [1] };
        if (!progress.chaptersUnlocked.includes(this.chapterId + 1)) {
          progress.chaptersUnlocked.push(this.chapterId + 1);
          state.set('chapterProgress', progress);
        }
      }

      state.set('lastGameResult', {
        chapterId: this.chapterId, isVictory,
        timeSurvived: elapsedSecs, score: finalScore
      });
      if (window.__screenManager) {
        window.__screenManager.navigate('results-screen', {}, false);
      }
    });
  }

  shutdown() {
    if (this.unsubGesture) this.unsubGesture();
    this.events.removeAllListeners();
    this.scene.stop('HUDScene');
  }
}
