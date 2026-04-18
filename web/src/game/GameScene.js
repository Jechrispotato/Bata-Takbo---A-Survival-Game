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
    if (this.chapterId === 2) {
      this.load.image('grid_bg', '/assets/gui/grid2.png');
    } else if (this.chapterId === 3) {
      this.load.image('grid_bg', '/assets/gui/grid3.png');
    } else {
      this.load.image('grid_bg', '/assets/gui/grid.png');
    }
    this.load.image('grid_panel_bg', '/assets/gui/grid_second_bg.png');
    this.load.image('boss_frame', '/assets/gui/boss_frame.png');

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
      this.load.spritesheet('boss_idle', '/assets/characters/boss/Chapter1A/CHAPTER 1 IDLE_sprite.png', { frameWidth: 576, frameHeight: 324 });
      this.load.spritesheet('boss_cast', '/assets/characters/boss/chapter-1/boss_cast.png', { frameWidth: 122, frameHeight: 110 });

      // Phase 5: Dynamic Loading of Custom Blood/Gore Sequence Projectiles
      for (let i = 0; i <= 14; i++) {
        this.load.image(`dark_blood_${i}`, `/assets/projectiles/chapter1/dark-blood/1_${i}.png`);
      }
      this.load.spritesheet('blood_chem', '/assets/projectiles/chapter1/blood_chem.png', { frameWidth: 1540, frameHeight: 93 });
      for (let i = 0; i <= 59; i++) {
        const str = i.toString().padStart(3, '0');
        this.load.image(`blood_splat_${str}`, `/assets/projectiles/chapter1/blood-splat/1_${str}.png`);
      }
      this.load.spritesheet('ch1_eye', '/assets/projectiles/chapter1/eye/eyeball.png', { frameWidth: 64, frameHeight: 64 });
      this.load.spritesheet('eye_explosion', '/assets/fx/eye_explosion.png', { frameWidth: 96, frameHeight: 96 });
      this.load.image('ch1_hand1', '/assets/projectiles/chapter1/hands-1.png');
      this.load.image('ch1_hand2', '/assets/projectiles/chapter1/hand-2.png');
      this.load.image('ch1_hand3', '/assets/projectiles/chapter1/hand-3.png');

      // Random horizontal projectiles
      this.load.image('ch1_monster_hand', '/assets/projectiles/monster-hand.png');
      this.load.image('ch1_monster_finger', '/assets/projectiles/monster-finger.png');
      this.load.image('ch1_monster_feet', '/assets/projectiles/monster-feet.png');
      this.load.image('ch1_heart', '/assets/projectiles/heart.png');
      this.load.image('ch1_brain', '/assets/projectiles/brain.png');

      // Hit effect for horizontal projectiles
      this.load.spritesheet('moving_hit', '/assets/fx/moving_hit1.png', { frameWidth: 32, frameHeight: 32 });

      // Ultimate attack spritesheets (start → loop → end)
      this.load.spritesheet('ult_start', '/assets/fx/chapter 1/ULTIMATE/attack.png', { frameWidth: 128, frameHeight: 128 });
      this.load.spritesheet('ult_loop', '/assets/fx/chapter 1/ULTIMATE/loop.png', { frameWidth: 128, frameHeight: 128 });
      this.load.spritesheet('ult_end', '/assets/fx/chapter 1/ULTIMATE/end.png', { frameWidth: 128, frameHeight: 128 });

      // Loot and FX
      this.load.image('ruby_loot', '/assets/projectiles/ruby.png');
      this.load.image('diamond_loot', '/assets/projectiles/diamond.png');
      this.load.spritesheet('lives_up', '/assets/fx/lives_up.png', { frameWidth: 128, frameHeight: 128 });
      this.load.spritesheet('frozen', '/assets/fx/frozen.png', { frameWidth: 128, frameHeight: 128 });

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
    this.load.spritesheet('symbol_alert2', '/assets/fx/symbol_alert2.png', { frameWidth: 80, frameHeight: 80 });
    this.load.spritesheet('attack_up', '/assets/fx/attack_up.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('smoke_up', '/assets/fx/smoke_up.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('chest1', '/assets/fx/chest1.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('chest2', '/assets/fx/chest2.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('chest3', '/assets/fx/chest3.png', { frameWidth: 100, frameHeight: 100 });
    this.load.spritesheet('chest4', '/assets/fx/chest4.png', { frameWidth: 100, frameHeight: 100 });
    this.load.spritesheet('lives_decreased', '/assets/fx/lives_decreased.png', { frameWidth: 64, frameHeight: 64 });

    // Power-Up Assets — Chests.png is 288x128 = 9 cols x 4 rows of 32x32 frames
    // Columns 0=Common(green), 1=Rare(blue), 2=Legendary(gold)
    this.load.spritesheet('powerup_chests', '/assets/powerups/Chests.png', { frameWidth: 32, frameHeight: 32 });
    // 02.png is the placeholder icon sheet for the HUD power-up slot
    this.load.image('powerup_ui', '/assets/powerups/02.png');

    this.load.spritesheet('lightning_burst', '/assets/fx/lightning_burst.png', { frameWidth: 64, frameHeight: 64 });

    // Boss HP bar — MinimumDamage sheet (64x16, 50 frames: frame 0 = full, frame 49 = empty, top-to-bottom)
    this.load.spritesheet('boss_hp_bar', '/assets/gui/MinimumDamage/MinimumDamage-Sheet.png', { frameWidth: 64, frameHeight: 16 });
    this.load.image('inventory_slot', '/assets/gui/Inventory.png');
    this.load.spritesheet('villain_hp_up', '/assets/fx/villain_hpUP.png', { frameWidth: 64, frameHeight: 64 });

    // Blood screen overlays (low HP warnings on right panel)
    this.load.image('blood_screen_2left', '/assets/gui/blood screen/2left.png');
    this.load.image('blood_screen_1_5left', '/assets/gui/blood screen/1.5left.png');
    this.load.image('blood_screen_1left', '/assets/gui/blood screen/1left.png');
    this.load.image('blood_screen_halfleft', '/assets/gui/blood screen/halfleft.png');
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
    this.isUltimateActive = false;
    this._ultCooldown = false;

    if (!this.anims.exists('anim_symbol_alert')) {
      this.anims.create({ key: 'anim_symbol_alert', frames: this.anims.generateFrameNumbers('symbol_alert'), frameRate: 20, repeat: 0 });
      this.anims.create({ key: 'anim_symbol_alert2', frames: this.anims.generateFrameNumbers('symbol_alert2'), frameRate: 60, repeat: 0 });
      this.anims.create({ key: 'anim_lightning_burst', frames: this.anims.generateFrameNumbers('lightning_burst'), frameRate: 20, repeat: 0 });
      this.anims.create({ key: 'anim_attack_up', frames: this.anims.generateFrameNumbers('attack_up', { start: 0, end: 17 }), frameRate: 14, repeat: -1 });
      this.anims.create({ key: 'anim_smoke_up', frames: this.anims.generateFrameNumbers('smoke_up', { start: 0, end: 20 }), frameRate: 20, repeat: 0 });
      this.anims.create({ key: 'anim_chest1', frames: this.anims.generateFrameNumbers('chest1', { start: 0, end: 13 }), frameRate: 20, repeat: 0 });
      this.anims.create({ key: 'anim_chest2', frames: this.anims.generateFrameNumbers('chest2', { start: 0, end: 17 }), frameRate: 20, repeat: 0 });
      this.anims.create({ key: 'anim_chest3', frames: this.anims.generateFrameNumbers('chest3', { start: 0, end: 79 }), frameRate: 28, repeat: 0 });
      this.anims.create({ key: 'anim_chest4', frames: this.anims.generateFrameNumbers('chest4', { start: 0, end: 79 }), frameRate: 28, repeat: 0 });
      this.anims.create({ key: 'anim_villain_hp_up', frames: this.anims.generateFrameNumbers('villain_hp_up', { start: 0, end: 11 }), frameRate: 15, repeat: 0 });
      this.anims.create({ key: 'anim_moving_hit', frames: this.anims.generateFrameNumbers('moving_hit', { start: 0, end: 43 }), frameRate: 30, repeat: 0 });
      this.anims.create({ key: 'anim_lives_up', frames: this.anims.generateFrameNumbers('lives_up', { start: 0, end: 22 }), frameRate: 20, repeat: 0 });
      this.anims.create({ key: 'anim_lives_decreased', frames: this.anims.generateFrameNumbers('lives_decreased', { start: 105, end: 119 }), frameRate: 30, repeat: 0 });
      this.anims.create({ key: 'anim_frozen', frames: this.anims.generateFrameNumbers('frozen', { start: 0, end: 11 }), frameRate: 15, repeat: 0 });
      this.anims.create({ key: 'anim_ch1_eye', frames: this.anims.generateFrameNumbers('ch1_eye'), frameRate: 10, repeat: -1 });
      this.anims.create({ key: 'anim_eye_explosion', frames: this.anims.generateFrameNumbers('eye_explosion'), frameRate: 18, repeat: 0 });

      // Power Up Chest Animations (Vertical animation mapping across 9 columns where rarity defines the column index)
      const activeChests = [0, 1, 2, 8];
      for (let i of activeChests) {
        this.anims.create({
          key: `chest_open_${i}`,
          frames: [{ key: 'powerup_chests', frame: i }, { key: 'powerup_chests', frame: i + 9 }, { key: 'powerup_chests', frame: i + 18 }],
          frameRate: 12,
          repeat: 0
        });
      }

      // Compile Phase 5 Chapter 1 Blood Sequences into Animations
      if (this.chapterId === 1 && !this.anims.exists('anim_dark_blood')) {

        // Ultimate vortex animations
        this.anims.create({ key: 'anim_ult_start', frames: this.anims.generateFrameNumbers('ult_start', { start: 0, end: 7 }), frameRate: 12, repeat: 0 });
        this.anims.create({ key: 'anim_ult_loop', frames: this.anims.generateFrameNumbers('ult_loop', { start: 0, end: 4 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'anim_ult_end', frames: this.anims.generateFrameNumbers('ult_end', { start: 0, end: 5 }), frameRate: 10, repeat: 0 });

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
      const pos = this.grid.getPixelPosition(col, row);

      // 1. Play smoke intro (1050ms total at 20fps × 21 frames)
      const smoke = this.add.sprite(pos.x, pos.y, 'smoke_up')
        .setDisplaySize(this.grid.tileSize * 1.4, this.grid.tileSize * 1.4)
        .setDepth(16)
        .play('anim_smoke_up');
      // Smoke self-destructs when done — no waiting needed
      smoke.once('animationcomplete', () => smoke.destroy());

      // 2. Emerge attack_up at the MIDPOINT of the smoke (525ms) while smoke is still playing
      this.time.delayedCall(525, () => {
        if (!this.goldenTile || this.goldenTile.col !== col || this.goldenTile.row !== row) return;
        const shadow = this.add.ellipse(pos.x, pos.y + 20, 35, 15, 0x000000).setDepth(14).setAlpha(0);

        const glowSpr = this.add.sprite(pos.x, pos.y, 'attack_up')
          .setDisplaySize(this.grid.tileSize * 0.85, this.grid.tileSize * 0.85)
          .setDepth(14.5)
          .setAlpha(0)
          .setTint(0xffaa00)
          .setBlendMode(Phaser.BlendModes.ADD)
          .play('anim_attack_up');

        const spr = this.add.sprite(pos.x, pos.y, 'attack_up')
          .setDisplaySize(this.grid.tileSize * 0.75, this.grid.tileSize * 0.75)
          .setDepth(15)
          .setAlpha(0)
          .play('anim_attack_up');

        // Scale-pop from slightly bigger then fade+pulse
        spr.setScale(spr.scaleX * 1.4);
        glowSpr.setScale(glowSpr.scaleX * 1.4);

        this.tweens.add({
          targets: [spr, glowSpr], alpha: 1, scaleX: spr.scaleX / 1.4, scaleY: spr.scaleY / 1.4,
          duration: 250, ease: 'Back.easeOut',
          onComplete: () => {
            if (!spr.active || !glowSpr.active) return;
            this.tweens.add({ targets: spr, alpha: 0.8, yoyo: true, repeat: -1, duration: 400 });
            this.tweens.add({ targets: glowSpr, alpha: 0.4, scaleX: glowSpr.scaleX * 1.1, scaleY: glowSpr.scaleY * 1.1, yoyo: true, repeat: -1, duration: 400 });
          }
        });
        this.tweens.add({ targets: shadow, alpha: 0.4, duration: 250 });

        this.goldenTile.sprite = spr;
        this.goldenTile.glow = glowSpr;
        this.goldenTile.shadow = shadow;
      });
    });


    this.events.on('damageTile:despawned', (col, row) => {
      if (this.goldenTile && this.goldenTile.col === col && this.goldenTile.row === row) {
        if (this.goldenTile.sprite) this.goldenTile.sprite.destroy();
        if (this.goldenTile.glow) this.goldenTile.glow.destroy();
        if (this.goldenTile.shadow) this.goldenTile.shadow.destroy();
        this.goldenTile = null;
      }
    });

    this.events.on('player:moved', (col, row) => {
      if (this.goldenTile && this.goldenTile.col === col && this.goldenTile.row === row) {
        console.log("BOSS HIT!");
        if (this.goldenTile.sprite) this.goldenTile.sprite.destroy();
        if (this.goldenTile.glow) this.goldenTile.glow.destroy();
        if (this.goldenTile.shadow) this.goldenTile.shadow.destroy();
        this.boss.takeDamage();
        this.goldenTile = null;
        this.grid.render();
      }
      // Check for chest collision
      if (this.grid.hasChestAt(col, row)) {
        const rarity = this.grid.removeChestAt(col, row);
        this.events.emit('chest:opened', rarity);
      }

      // Check for ruby collision
      if (this.grid.hasRubyAt(col, row)) {
        this.grid.removeRubyAt(col, row);
        this.events.emit('ruby:collected');
      }

      // Check for diamond collision
      if (this.grid.hasDiamondAt(col, row)) {
        this.grid.removeDiamondAt(col, row);
        this.events.emit('diamond:collected');
      }
    });

    this.events.on('diamond:collected', () => {
      // Freeze the player
      this.player.isFrozen = true;
      this.player.sprite.setTint(0x00ffff);
      this.time.delayedCall(2000, () => {
        this.player.isFrozen = false;
        this.player.sprite.clearTint();
      });

      const px = this.player.sprite.x;
      const py = this.player.sprite.y;

      const fx = this.add.sprite(px, py - 40, 'frozen').play('anim_frozen').setDepth(300);
      fx.setScale(1.2);
      fx.once('animationcomplete', () => fx.destroy());

      const txt = this.add.text(px, py - 60, 'FROZEN!', {
        fontFamily: 'VCR', fontSize: '20px', color: '#00ffff', stroke: '#000000', strokeThickness: 5
      }).setOrigin(0.5).setDepth(300);
      this.tweens.add({ targets: txt, y: txt.y - 50, alpha: 0, duration: 2000, onComplete: () => txt.destroy() });
    });

    this.events.on('ruby:collected', () => {
      // Heal half a heart (+1 HP since max is 6 and there are 3 hearts)
      if (this.player.hp < this.player.maxHp) {
        this.player.hp++;
        this.events.emit('player:health_changed', this.player.hp);
      }

      const px = this.player.sprite.x;
      const py = this.player.sprite.y;

      const fx = this.add.sprite(px, py - 40, 'lives_up').play('anim_lives_up').setDepth(300);
      // Slightly scale up for visibility
      fx.setScale(1.2);
      fx.once('animationcomplete', () => fx.destroy());

      const txt = this.add.text(px, py - 60, '+1/2 HP', {
        fontFamily: 'VCR', fontSize: '18px', color: '#ff4444', stroke: '#000000', strokeThickness: 4
      }).setOrigin(0.5).setDepth(300);
      this.tweens.add({ targets: txt, y: txt.y - 50, alpha: 0, duration: 2000, onComplete: () => txt.destroy() });
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

      if (rarity === 8) {
        // Cursed chest — heals the boss!
        if (this.boss && this.boss.heal) {
          this.boss.heal(1);
        }

        const txt = this.add.text(px, py - 60, 'CURSED!', {
          fontFamily: 'VCR', fontSize: '20px',
          color: '#ff0000',
          stroke: '#000000', strokeThickness: 5
        }).setOrigin(0.5).setDepth(300);
        this.tweens.add({ targets: txt, y: txt.y - 50, alpha: 0, duration: 2200, onComplete: () => txt.destroy() });
        return; // Don't give a powerup
      }

      const pools = [
        // Common (rarity 0) — grey
        [
          { name: 'SPEED BOOST', apply: () => this._applyBuff('speed', 5000) },
          { name: 'VITALITY', apply: () => { if (this.player.hp < this.player.maxHp) { this.player.hp++; this.events.emit('player:health_changed', this.player.hp); } } },
          { name: 'SIGHT', apply: () => this._applyBuff('sight', 6000) },
        ],
        // Rare (rarity 1) — blue
        [
          { name: 'THE ANCHOR', apply: () => this._applyBuff('anchor', 5000) },
          { name: 'DASH', apply: () => this._applyBuff('dash', 8000) },
          { name: 'HEALTH POTION', apply: () => { this.player.maxHp++; this.player.hp = this.player.maxHp; this.events.emit('player:health_changed', this.player.hp); } },
        ],
        // Legendary (rarity 2) — gold
        [
          { name: 'INVINCIBILITY', apply: () => this._applyBuff('invincible', 5000) },
          { name: 'TIME STOP', apply: () => this._applyBuff('timestop', 3000) },
          { name: 'BLINK', apply: () => this._applyBuff('blink', 0) },
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

      if (this.chapterId === 1 && current <= 600 && !this._horizontalProjectilesStarted) {
        this._horizontalProjectilesStarted = true;
        this.queueHorizontalProjectile();
      }

      // Revenge Ultimate: 2s after player damages boss
      if (this.chapterId === 1 && !this._ultCooldown && !this.isGameOver) {
        this._ultCooldown = true;
        this.time.delayedCall(2000, () => {
          if (!this.isGameOver && this.boss && this.boss.hp > 0) this._triggerUltimate();
        });
        // Cooldown: won't trigger again for 25s
        this.time.delayedCall(25000, () => { this._ultCooldown = false; });
      }
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

    // --- HIDDEN CHEAT CODE: "jecpogi" ---
    this._cheatBuffer = '';
    this._cheatCode = 'jecpogi';
    this._cheatKeyHandler = (e) => {
      // Only listen to printable single characters
      if (e.key.length !== 1) return;
      this._cheatBuffer += e.key.toLowerCase();
      // Trim buffer to cheat code length so it doesn't balloon
      if (this._cheatBuffer.length > this._cheatCode.length) {
        this._cheatBuffer = this._cheatBuffer.slice(-this._cheatCode.length);
      }
      if (this._cheatBuffer === this._cheatCode) {
        this._cheatBuffer = '';
        this._activateCheat();
      }
    };
    window.addEventListener('keydown', this._cheatKeyHandler);

    this.horizontalProjectiles = this.add.group();
    this._horizontalProjectilesStarted = false;

    console.log('[GameScene] Ready.');
  }

  handleGesture(direction) {
    if (direction === 'idle' || this.isGameOver) return;
    this.player.move(direction.toLowerCase());
  }

  _triggerUltimate() {
    if (this.isGameOver || !this.boss || this.boss.hp <= 0) return;
    this.isUltimateActive = true;

    const { width, height } = this.scale;
    const leftWidth = Math.max(width < 768 ? 160 : 250, Math.min(450, width * 0.28));

    // Pick a random target tile (slightly away from grid edges for drama)
    const tC = Phaser.Math.Between(1, this.grid.cols - 2);
    const tR = Phaser.Math.Between(1, this.grid.rows - 2);
    const targetPos = this.grid.getPixelPosition(tC, tR);
    const gridW = this.grid.cols * this.grid.tileSize;

    // Smaller vortex — roughly 1 tile size worth
    const vortexScale = (this.grid.tileSize / 128) * 2.2;

    // "REVENGE!" warning text (smaller)
    this.cameras.main.shake(500, 0.015);
    const revengeText = this.add.text(targetPos.x, targetPos.y - 55, 'REVENGE!', {
      fontFamily: 'GigaSaturn', fontSize: '20px', color: '#ff0000',
      stroke: '#000', strokeThickness: 5
    }).setOrigin(0.5).setDepth(600);
    this.tweens.add({
      targets: revengeText, alpha: 0, y: revengeText.y - 35, duration: 1400,
      onComplete: () => revengeText.destroy()
    });

    // Throw vortex from the villain sprite position in the left panel.
    // Boss sprite center in HUDScene: bossCenterX = leftWidth/2, bossCenterY = 155 + bossBoxH/2
    // bossBoxH = (height - 155) * 0.38
    const bossBoxH = Math.floor((height - 155) * 0.38);
    const throwFromX = leftWidth / 2;
    const throwFromY = 155 + bossBoxH / 2;
    const vortex = this.add.sprite(throwFromX, throwFromY, 'ult_start')
      .setScale(vortexScale * 0.3).setDepth(50).setAlpha(0.9);

    // === PHASE 1: Throw (fly + grow toward target) ===
    this.tweens.add({
      targets: vortex,
      x: targetPos.x, y: targetPos.y,
      scaleX: vortexScale, scaleY: vortexScale,
      duration: 700, ease: 'Power2',
      onComplete: () => {
        // Play start anim on landing
        vortex.play('anim_ult_start');
        this.cameras.main.shake(300, 0.02);

        // "RESIST!" hint
        const hintTxt = this.add.text(targetPos.x, targetPos.y - 70, 'RESIST THE PULL!', {
          fontFamily: 'GigaSaturn', fontSize: '18px', color: '#ff6600',
          stroke: '#000', strokeThickness: 5
        }).setOrigin(0.5).setDepth(601);
        this.tweens.add({
          targets: hintTxt, alpha: 0, y: hintTxt.y - 40, duration: 2000,
          onComplete: () => hintTxt.destroy()
        });

        // === PHASE 2: Loop (blackhole active for 3s) ===
        vortex.once('animationcomplete', () => {
          vortex.play('anim_ult_loop');

          // Pulsing glow ring around vortex tile
          const glowRing = this.add.graphics().setDepth(9);
          const pulseGlow = this.tweens.add({
            targets: glowRing, alpha: 0.2, yoyo: true, repeat: -1, duration: 300
          });

          // Pull the player toward vortex every 1 second, 3 times
          let pullsDone = 0;
          const PULL_COUNT = 3;
          const pullTimer = this.time.addEvent({
            delay: 1000,
            repeat: PULL_COUNT - 1,
            callback: () => {
              pullsDone++;
              if (this.isGameOver || !this.player) return;

              // Draw glow ring
              glowRing.clear();
              glowRing.lineStyle(4, 0xff2200, 0.8);
              glowRing.strokeCircle(targetPos.x, targetPos.y, (PULL_COUNT - pullsDone + 1) * 30);

              // Calculate pull direction (one tile toward vortex)
              const dc = Math.sign(tC - this.player.col);
              const dr = Math.sign(tR - this.player.row);
              const newCol = Phaser.Math.Clamp(this.player.col + dc, 0, this.grid.cols - 1);
              const newRow = Phaser.Math.Clamp(this.player.row + dr, 0, this.grid.rows - 1);

              // Only pull if there's movement to do
              if (newCol !== this.player.col || newRow !== this.player.row) {
                this.player.col = newCol;
                this.player.row = newRow;
                const newPos = this.grid.getPixelPosition(newCol, newRow);

                // Slide player toward vortex
                this.tweens.add({
                  targets: this.player.sprite,
                  x: newPos.x, y: newPos.y,
                  duration: 250, ease: 'Power2'
                });

                // Visual: floating "PULL!" text over player
                const pullTxt = this.add.text(this.player.sprite.x, this.player.sprite.y - 30, 'PULL!', {
                  fontFamily: 'VCR', fontSize: '16px', color: '#ff4400', stroke: '#000', strokeThickness: 3
                }).setOrigin(0.5).setDepth(602);
                this.tweens.add({
                  targets: pullTxt, alpha: 0, y: pullTxt.y - 30, duration: 600,
                  onComplete: () => pullTxt.destroy()
                });

                this.events.emit('player:moved', newCol, newRow);
              }

              // Damage if sucked onto vortex tile
              if (this.player.col === tC && this.player.row === tR && !this.player.isInvincible) {
                this.player.takeDamage();
                this.cameras.main.shake(200, 0.03);
              }
            }
          });

          // === PHASE 3: After 3s loop — end vortex ===
          this.time.delayedCall(3000, () => {
            pullTimer.remove();
            pulseGlow.stop();
            glowRing.destroy();

            vortex.play('anim_ult_end');
            vortex.once('animationcomplete', () => vortex.destroy());

            this.isUltimateActive = false;
          });
        });
      }
    });
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

  // ── Cheat activation ("jechrispogi") ──────────────────────────────
  _activateCheat() {
    // One-time per game session guard
    if (this._cheatUsed) return;
    this._cheatUsed = true;

    // Enable cheat mode on the boss (stops attacks, doubles loot)
    if (this.boss) this.boss.cheatMode = true;

    // Flash the screen gold briefly
    const { width, height } = this.scale;
    const flash = this.add.graphics().setDepth(998);
    flash.fillStyle(0xffd700, 0.25);
    flash.fillRect(0, 0, width, height);
    this.tweens.add({ targets: flash, alpha: 0, duration: 600, onComplete: () => flash.destroy() });

    // On-screen toast message
    const toast = this.add.text(width / 2, height * 0.18, '✦ JECJEC ACTIVATED ✦', {
      fontFamily: 'VCR',
      fontSize: '20px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 5,
      shadow: { offsetX: 0, offsetY: 0, color: '#ff6b1a', blur: 16, fill: true }
    }).setOrigin(0.5).setAlpha(0).setDepth(999);

    this.tweens.add({
      targets: toast, alpha: 1, y: height * 0.15,
      duration: 350, ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(3200, () => {
          this.tweens.add({
            targets: toast, alpha: 0, y: height * 0.12,
            duration: 400, onComplete: () => toast.destroy()
          });
        });
      }
    });
  }

  getProjectileDifficulty() {
    const hud = this.scene.get('HUDScene');
    const elapsedSecs = hud ? Math.floor(hud.elapsed / 1000) : 0;

    // Start scaling difficulty after 60 seconds
    // Max difficulty at 180 seconds (3 minutes)
    let difficulty = 0;
    if (elapsedSecs > 60) {
      difficulty = Math.min(1, (elapsedSecs - 60) / 120); // 0.0 to 1.0
    }
    return difficulty;
  }

  queueHorizontalProjectile() {
    if (this.isGameOver) return;

    const diff = this.getProjectileDifficulty();
    const minDelay = Phaser.Math.Linear(1500, 500, diff);
    const maxDelay = Phaser.Math.Linear(4500, 1500, diff);

    // During ultimate: greatly reduce horizontal projectile frequency
    const delay = this.isUltimateActive
      ? Phaser.Math.Between(10000, 15000)
      : Phaser.Math.Between(minDelay, maxDelay);

    this.time.delayedCall(delay, () => {
      this.spawnHorizontalProjectile();
      this.queueHorizontalProjectile();
    });
  }

  spawnHorizontalProjectile() {
    if (this.isGameOver || (this.boss && this.boss.hp <= 0)) return;

    const keys = ['ch1_monster_hand', 'ch1_monster_finger', 'ch1_monster_feet', 'ch1_heart', 'ch1_brain'];
    const key = Phaser.Math.RND.pick(keys);

    const row = Phaser.Math.Between(0, this.grid.rows - 1);
    const startLeft = Phaser.Math.Between(0, 1) === 0;

    const leftWidth = Math.max(this.scale.width < 768 ? 160 : 250, Math.min(450, this.scale.width * 0.28));
    const y = this.grid.offsetY + row * this.grid.tileSize + this.grid.tileSize / 2;
    const startX = startLeft ? leftWidth - 50 : this.scale.width + 50;
    const endX = startLeft ? this.scale.width + 50 : leftWidth - 50;

    // 1. Show Alert outside the grid
    const alertX = startLeft ? this.grid.offsetX - 40 : this.grid.offsetX + this.grid.cols * this.grid.tileSize + 40;
    const alertSpr = this.add.sprite(alertX, y, 'symbol_alert2');
    alertSpr.setScale(1.2).setDepth(200);
    alertSpr.play('anim_symbol_alert2');
    alertSpr.once('animationcomplete', () => alertSpr.destroy());

    // 2. Wait 1 second before spawning the moving part
    this.time.delayedCall(1000, () => {
      if (this.isGameOver || (this.boss && this.boss.hp <= 0)) return;

      const proj = this.add.sprite(startX, y, key);
      // Base scaling down since typical source sizes are large
      proj.setDisplaySize(75, 75);
      proj.setDepth(50);
      this.horizontalProjectiles.add(proj);

      const rotSign = startLeft ? 1 : -1;

      const diff = this.getProjectileDifficulty();
      // Slower speed than before
      const minDuration = Phaser.Math.Linear(4500, 3000, diff);
      const maxDuration = Phaser.Math.Linear(6500, 4000, diff);
      const duration = Phaser.Math.Between(minDuration, maxDuration);

      // Dripping Blood Trail
      const dripCount = Math.floor(duration / 50);
      const dripTimer = this.time.addEvent({
        delay: 50, repeat: dripCount - 1,
        callback: () => {
          if (!proj || !proj.active) return;
          const scale = Phaser.Math.FloatBetween(2.0, 4.5);
          const drip = this.add.sprite(proj.x, proj.y, 'dark_blood_0').setScale(scale).setDepth(45);
          if (this.anims.exists('anim_dark_blood')) drip.play('anim_dark_blood');

          this.tweens.add({
            targets: drip, alpha: 0, scale: 1.0, y: drip.y + Phaser.Math.Between(30, 60), duration: 600, onComplete: () => drip.destroy()
          });
        }
      });

      this.tweens.add({
        targets: proj,
        x: endX,
        angle: rotSign * 360 * 3, // Rotate nicely
        duration: duration,
        onComplete: () => {
          proj.destroy();
          dripTimer.remove();
        }
      });
    });
  }

  update(time, delta) {
    if (this.isGameOver) return;
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) this.player.move('up');
    if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) this.player.move('down');
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) this.player.move('left');
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) this.player.move('right');

    if (this.chapterId === 1 && this.horizontalProjectiles) {
      this.horizontalProjectiles.getChildren().forEach(proj => {
        if (!proj.active) return;
        const dist = Phaser.Math.Distance.Between(proj.x, proj.y, this.player.sprite.x, this.player.sprite.y);
        // Increased hit radius to account for larger sprites
        if (dist < 35) {
          if (!this.player.isInvincible) {
            this.player.takeDamage();
            // Play the new custom hit effect instead of blood
            if (this.anims.exists('anim_moving_hit')) {
              const hitFx = this.add.sprite(proj.x, proj.y, 'moving_hit', 0).play('anim_moving_hit').setDepth(55);
              // Scale it up a bit since 32x32 might be small
              hitFx.setScale(1.5);
              hitFx.once('animationcomplete', () => hitFx.destroy());
            }
          }
          proj.destroy();
        }
      });
    }
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

    // Center on the RIGHT panel (grid area), not the full screen
    const leftWidth = Math.max(250, Math.min(450, width * 0.28));
    const rightPanelCenterX = leftWidth + (width - leftWidth) / 2;

    this.add.text(rightPanelCenterX, height / 2, msg, {
      fontFamily: 'GigaSaturn', fontSize: '72px', color,
      stroke: '#000000', strokeThickness: 8,
      shadow: { offsetX: 0, offsetY: 0, color: color, blur: 30, fill: true }
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
    // Remove cheat listener to prevent memory leaks across scene restarts
    if (this._cheatKeyHandler) window.removeEventListener('keydown', this._cheatKeyHandler);
    this.events.removeAllListeners();
    this.scene.stop('HUDScene');
  }
}
