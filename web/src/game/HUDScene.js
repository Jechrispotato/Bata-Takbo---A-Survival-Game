import * as Phaser from 'phaser';
import { state } from '../utils/StateManager.js';

export class HUDScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HUDScene' });
  }

  init(data) {
    this.chapterId = data.chapterId;
    this.startTime = Date.now();
    this.elapsed = 0;
  }

  create() {
    const { width, height } = this.scale;
    const leftWidth = Math.max(width < 768 ? 160 : 250, Math.min(450, width * 0.28));

    // ========== LEFT PANEL BACKGROUND ==========
    this.panelBg = this.add.graphics();
    this.panelBg.fillStyle(0x130f04, 1);
    this.panelBg.fillRect(0, 0, leftWidth, height);

    // Panel divider line
    this.panelBg.lineStyle(4, 0x201c11, 1);
    this.panelBg.beginPath();
    this.panelBg.moveTo(leftWidth, 0);
    this.panelBg.lineTo(leftWidth, height);
    this.panelBg.strokePath();

    // ========== TOP BAR (moved to top of Grid panel) ==========
    const topBarX = leftWidth + 40;
    const topBarY = 28;

    // Pause button
    const pauseBtn = this.add.text(topBarX, topBarY - 6, '❚❚ PAUSE', {
      fontFamily: 'DungeonFont', fontSize: '24px', color: '#f0e6d3'
    }).setInteractive({ useHandCursor: true }).setDepth(20);

    pauseBtn.on('pointerdown', () => {
      state.emit('game:pause');
    });

    // TIME
    this.add.text(topBarX + 160, topBarY - 12, 'TIME:', {
      fontFamily: 'VCR', fontSize: '16px', color: '#a89b8c'
    }).setDepth(20);
    this.timerText = this.add.text(topBarX + 160, topBarY + 6, '00:00', {
      fontFamily: 'VCR', fontSize: '26px', color: '#f0e6d3'
    }).setDepth(20);

    // Score
    this.add.text(topBarX + 310, topBarY - 12, 'SCORE:', {
      fontFamily: 'VCR', fontSize: '16px', color: '#a89b8c'
    }).setDepth(20);
    this.scoreText = this.add.text(topBarX + 310, topBarY + 6, '0', {
      fontFamily: 'VCR', fontSize: '26px', color: '#ffd700'
    }).setDepth(20);

    // Hearts (top right of grid side)
    this.hearts = [];
    const rightPanelW = width - leftWidth;
    const heartStartX = leftWidth + rightPanelW - 60 - (2 * 36);
    for (let i = 0; i < 3; i++) {
      // Render the full heart by default (frame 147)
      const heart = this.add.sprite(heartStartX + (i * 36), topBarY + 6, 'ui_buttons', 147);
      heart.setScale(3.0).setOrigin(0.5, 0.5).setDepth(20);
      this.hearts.push(heart);
    }

    // ========== BOSS DISPLAY BOX ==========
    const boxPadX = 24;
    // Pushed down further to give more top breathing room for the title text
    const bossBoxY = 155;
    const bossBoxW = leftWidth - boxPadX * 2;
    const remainingHeight = height - bossBoxY;
    const bossBoxH = Math.floor(remainingHeight * 0.38);

    // Box background
    this.panelBg.fillStyle(0x201c11, 1);
    this.panelBg.fillRect(boxPadX, bossBoxY, bossBoxW, bossBoxH);
    // Border
    this.panelBg.lineStyle(3, 0x100c04, 1);
    this.panelBg.strokeRect(boxPadX, bossBoxY, bossBoxW, bossBoxH);

    // Chapter Title and description headers
    let bossName = `CHAPTER ${this.chapterId}`;
    let bossTitle = "";
    let desc = "Description Goes Here...\nA chilling battle awaits.";
    if (this.chapterId == 1) {
      bossName = "SI IMELDA";
      bossTitle = "ANG UNANG MANANANGGAL";
      desc = "[LORE PLACEHOLDER] Avoid her gaze and dodge the aerial attacks.";
    }

    // Main Title (Giga Saturn) — absolute Y ~10px from top
    this.add.text(boxPadX, bossBoxY - 143, bossName, {
      fontFamily: 'GigaSaturn', fontSize: '32px', color: '#ffd700', align: 'left'
    }).setOrigin(0, 0);

    // Subtitle
    this.add.text(boxPadX, bossBoxY - 102, bossTitle, {
      fontFamily: 'VCR', fontSize: '15px', color: '#f0e6d3', align: 'left'
    }).setOrigin(0, 0);

    // Placeholder Lore Description
    this.add.text(boxPadX, bossBoxY - 82, desc, {
      fontFamily: 'VCR', fontSize: '11px', color: '#a89b8c', align: 'left', wordWrap: { width: bossBoxW }
    }).setOrigin(0, 0);

    // *** BOSS ANIMATED SPRITE — rendered HERE in HUDScene so it's visible ***
    // The boss_idle and boss_cast spritesheets were loaded by GameScene.
    const bossCenterX = boxPadX + bossBoxW / 2;
    const bossCenterY = bossBoxY + bossBoxH / 2;

    // Create boss animations first
    if (!this.anims.exists('anim_boss_idle')) {
      this.anims.create({
        key: 'anim_boss_idle',
        frames: this.anims.generateFrameNumbers('boss_idle', { start: 0, end: 54 }), // 55 frame animation
        frameRate: 24,
        repeat: -1
      });
      this.anims.create({
        key: 'anim_boss_attack',
        frames: this.anims.generateFrameNumbers('boss_cast', { start: 0, end: 7 }), // 8 frame animation
        frameRate: 10,
        repeat: 0
      });
    }

    this.bossSprite = this.add.sprite(bossCenterX, bossCenterY, 'boss_idle');
    this.bossSprite.setOrigin(0.5, 0.5);

    const updateBossScale = () => {
      const w = this.bossSprite.width || 122;
      const h = this.bossSprite.height || 110;
      const fitScale = Math.min((bossBoxW - 10) / w, (bossBoxH - 10) / h);
      this.bossSprite.setScale(fitScale);
    };

    updateBossScale();

    // Revert to idle after attacking
    this.bossSprite.on('animationcomplete-anim_boss_attack', () => {
      this.bossSprite.setTexture('boss_idle');
      updateBossScale();
      this.bossSprite.play('anim_boss_idle');
    });

    this.bossSprite.play('anim_boss_idle');

    // Boss Frame Overlay (added as an effect over the boss box)
    this.bossFrameOverlay = this.add.image(boxPadX + bossBoxW / 2, bossBoxY + bossBoxH / 2, 'boss_frame');
    this.bossFrameOverlay.setOrigin(0.5, 0.5);
    this.bossFrameOverlay.setDisplaySize(bossBoxW, bossBoxH);
    // You can also add blend modes or alpha if needed, but a standard overlay is a good start
    this.bossFrameOverlay.setDepth(15);
    // Make HUD expose playBossAttack for the GameScene to call
    this.playBossAttack = () => {
      this.bossSprite.setTexture('boss_cast');
      updateBossScale();
      this.bossSprite.play('anim_boss_attack');
    };



    // ========== HP BAR (MinimumDamage sprite) ==========
    // 50 frames, 64x16px each. Frame 0 = full HP, frame 49 = empty (top-to-bottom, no reversal needed).
    const HP_BAR_FRAMES = 50;
    const hpBarScaleY = 2.2;

    // Position below the lore text (bossBoxY - 82), let's say bossBoxY - 40
    this.hpBarSprite = this.add.sprite(boxPadX, bossBoxY - 40, 'boss_hp_bar', 0);
    this.hpBarSprite.setOrigin(0, 0.5); // left-center aligned
    this.hpBarSprite.setScale(3, hpBarScaleY); // 3x width = 192px
    this.hpBarSprite.setDepth(10);

    // Default to the first frame (base HP)
    this.hpBarSprite.setFrame(0);

    this._hpBarFrames = HP_BAR_FRAMES;
    this._hpBarMaxHp = 1;
    this._hpBarCurrent = 1;
    this._hpBarState = 0;

    // Add HP text to the right side of the panel
    this.hpText = this.add.text(boxPadX + bossBoxW, bossBoxY - 40, '1000/1000', {
      fontFamily: 'VCR', fontSize: '13px', color: '#ff4444'
    }).setOrigin(1, 0.5);

    // ========== POWER-UP SLOT ==========
    // sits below the boss box
    const puY = bossBoxY + bossBoxH + 8;

    this.add.text(boxPadX, puY, 'POWER-UP', {
      fontFamily: 'VCR', fontSize: '13px', color: '#a89b8c'
    });

    const puBoxH = 50;
    const puBoxY = puY + 16;

    // Inventory slot background image instead of drawn box
    this.inventoryBg = this.add.sprite(boxPadX, puBoxY, 'inventory_slot');
    this.inventoryBg.setOrigin(0, 0);
    this.inventoryBg.setDisplaySize(puBoxH, puBoxH);

    // Chest icon (frame will change by rarity)
    this.puIcon = this.add.sprite(boxPadX + puBoxH / 2, puBoxY + puBoxH / 2, 'powerup_chests', 0);
    this.puIcon.setScale(1.4).setAlpha(0);

    // Power-up name label (shifted right of the square slot)
    const labelX = boxPadX + puBoxH + 12;
    this.puLabel = this.add.text(labelX, puBoxY + 6, ' — ', {
      fontFamily: 'VCR', fontSize: '13px', color: '#666688'
    });

    // Timer bar background
    const puBarY = puBoxY + puBoxH - 8;
    this.panelBg.fillStyle(0x1a1a33, 1);
    this.panelBg.fillRect(labelX, puBarY, bossBoxW - puBoxH - 12, 5);

    // Timer bar fill (redrawn every update)
    this.puBarFill = this.add.graphics();
    this.puBarMaxW = bossBoxW - puBoxH - 12;
    this.puBarX = labelX;
    this.puBarY = puBarY;

    this._puEndTime = 0;
    this._puDuration = 0;
    this._puColor = 0x888888;
    this._puActive = false;

    // ========== CAMERA BOX — centered in space below power-up section ==========
    const puEndY = puBoxY + puBoxH + 8; // bottom of power-up box + small gap
    const targetCamH = Math.floor(bossBoxW * 0.75); // Ideal 4:3 aspect ratio
    const camBoxH = Math.min(targetCamH, Math.floor(remainingHeight * 0.40));
    // Center the box in the available space between power-up bottom and screen bottom
    const camBoxY = puEndY + Math.floor((height - puEndY - camBoxH) / 2);

    this.panelBg.fillStyle(0x100c04, 1);
    this.panelBg.fillRect(boxPadX, camBoxY, bossBoxW, camBoxH);

    // Position DOM camera PiP over the camera box
    const pip = document.getElementById('game-camera-pip');
    if (pip) {
      pip.style.left = `${boxPadX + 2}px`;
      pip.style.top = `${camBoxY + 2}px`;
      pip.style.width = `${bossBoxW - 4}px`;
      pip.style.height = `${camBoxH - 4}px`;
      pip.style.bottom = 'auto';
      pip.style.borderRadius = '0px';
      pip.style.border = 'none';
      pip.style.boxShadow = 'none';
      pip.style.opacity = '1';

      // Attach translucent eye camera overlay
      let overlay = document.getElementById('cam-eye-overlay');
      if (!overlay) {
        overlay = document.createElement('img');
        overlay.id = 'cam-eye-overlay';
        overlay.src = '/assets/gui/eye_camera.png';
        overlay.style.position = 'absolute';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '51'; // exactly above pip (50) but below pause menu (100)
        pip.parentNode.appendChild(overlay);
      }
      overlay.style.left = pip.style.left;
      overlay.style.top = pip.style.top;
      overlay.style.width = pip.style.width;
      overlay.style.height = pip.style.height;
      overlay.style.display = pip.style.display;
    }

    // Hide duplicate DOM timer (we use Phaser text)
    const domTimer = document.getElementById('game-timer-dom');
    if (domTimer) domTimer.style.display = 'none';

    // Listen for boss attack events from GameScene
    const gameScene = this.scene.get('GameScene');
    if (gameScene) {
      gameScene.events.on('boss:attack', () => this.playBossAttack());
      gameScene.events.on('boss:damaged', (current, max) => {
        this.updateBossHp(current, max);
        this.playBossDamageVfx();
      });
      gameScene.events.on('boss:died', () => this.onBossDied());
      gameScene.events.on('boss:timestop', (isStopped) => {
        if (!this.bossSprite) return;
        if (isStopped) {
          this.bossSprite.setTint(0x00aaff); // Freeze frosty blue
          this.bossSprite.anims.pause();
        } else {
          this.bossSprite.clearTint();
          this.bossSprite.anims.resume();
        }
      });
      gameScene.events.on('powerup:activated', (name, rarity, durationMs) => {
        this.showPowerup(name, rarity, durationMs);
      });
      gameScene.events.on('powerup:cleared', () => this.clearPowerup());
      gameScene.events.on('player:health_changed', (hp) => this.updateLives(hp));
    }

    // ========== BLOOD SCREEN OVERLAY (right panel / grid area) ==========
    // Semi-transparent so grid/projectiles/player remain visible beneath it.
    // Depth 5 keeps it above the grid background but below all HUD controls (depth 20).
    this.bloodOverlay = this.add.image(leftWidth, 0, 'blood_screen_2left');
    this.bloodOverlay.setOrigin(0, 0);
    this.bloodOverlay.setDisplaySize(width - leftWidth, height);
    this.bloodOverlay.setDepth(5);
    this.bloodOverlay.setAlpha(0); // hidden until needed
  }

  showPowerup(name, rarity, durationMs) {
    if (!this.puIcon) return;
    const colors = [0x888888, 0x44aaff, 0xffdd00];
    const hexStr = ['#aaaaaa', '#44aaff', '#ffdd00'];
    const frames = [0, 1, 2]; // Chests.png column per rarity
    this._puActive = true;
    this._puEndTime = Date.now() + durationMs;
    this._puDuration = durationMs;
    this._puColor = colors[rarity] ?? 0x888888;
    this.puIcon.setFrame(frames[rarity] ?? 0).setAlpha(1);
    this.puLabel.setText(name).setColor(hexStr[rarity] ?? '#aaaaaa');
  }

  clearPowerup() {
    this._puActive = false;
    if (this.puIcon) this.puIcon.setAlpha(0);
    if (this.puLabel) this.puLabel.setText(' — ').setColor('#666688');
    if (this.puBarFill) this.puBarFill.clear();
  }

  playBossAttack() {
    if (!this.bossSprite) return;
    this.bossSprite.play('anim_boss_attack');
    this.bossSprite.once('animationcomplete', () => {
      this.bossSprite.play('anim_boss_idle');
    });
  }

  playBossDamageVfx() {
    if (!this.bossSprite) return;

    // Spawn the explosion right over the boss sprite in the HUD
    const explosion = this.add.sprite(this.bossSprite.x, this.bossSprite.y, 'eye_explosion');
    explosion.setScale(3.0).setDepth(200);
    explosion.play('anim_eye_explosion');
    explosion.on('animationcomplete', () => explosion.destroy());

    // ── White-flash hit indicator ──────────────────────────────────────
    // Cancel any in-flight tint timer so rapid hits never stack/get stuck.
    if (this._tintTimer) {
      this._tintTimer.remove(false);
      this._tintTimer = null;
    }

    // Immediately flash the villain portrait white
    this.bossSprite.setTint(0xffffff);

    // Clear after a short 150ms — quick, snappy, never lingers
    this._tintTimer = this.time.delayedCall(150, () => {
      if (this.bossSprite) this.bossSprite.clearTint();
      this._tintTimer = null;
    });
  }

  onBossDied() {
    if (!this.bossSprite) return;
    this.bossSprite.setTint(0xff0000);
    this.tweens.add({
      targets: this.bossSprite,
      scaleX: 0, scaleY: 0, alpha: 0,
      duration: 500
    });
  }

  updateScore(score) {
    if (this.scoreText) this.scoreText.setText(`${score}`);
  }

  updateLives(lives) {
    if (!this.hearts) return;
    for (let i = 0; i < 3; i++) {
      // Frame indexes: 147 (full), 146 (half), 145 (empty)
      let frame = 145;
      if (lives >= (i + 1) * 2) {
        frame = 147;
      } else if (lives === (i * 2) + 1) {
        frame = 146;
      }
      if (this.hearts[i]) {
        this.hearts[i].setFrame(frame);
      }
    }

    // Blood screen overlay: show the correct image based on remaining HP
    if (this.bloodOverlay) {
      if (lives <= 1) {
        // half heart left
        this.bloodOverlay.setTexture('blood_screen_halfleft').setAlpha(0.55);
      } else if (lives === 2) {
        // 1 full heart left
        this.bloodOverlay.setTexture('blood_screen_1left').setAlpha(0.5);
      } else if (lives === 3) {
        // 1.5 hearts left
        this.bloodOverlay.setTexture('blood_screen_1_5left').setAlpha(0.45);
      } else if (lives === 4) {
        // 2 hearts left
        this.bloodOverlay.setTexture('blood_screen_2left').setAlpha(0.4);
      } else {
        // > 4 HP — hide overlay
        this.bloodOverlay.setAlpha(0);
      }
    }
  }

  updateBossHp(current, max) {
    if (!this.hpBarSprite) return;

    const tookDamage = current < this._hpBarCurrent;
    this._hpBarMaxHp = max;
    this._hpBarCurrent = current;

    const ratio = Math.max(0, current / max);

    // 8 damage states (each 6 frames), plus state 0 (base full HP, 2 frames)
    const maxStates = 8;
    // ratio 1.0 -> 0, ratio 0.0 -> 8
    const newState = Math.min(maxStates, Math.floor((1 - ratio) * (maxStates + 1)));
    // Wait, let's map ratio precisely: 
    // If ratio > 0.875 -> state 0, ratio 0.75-0.875 -> state 1...
    // Actually Math.round((1 - ratio) * maxStates) maps evenly.
    const mappedState = Math.round((1 - ratio) * maxStates);

    if (this._hpBarState !== mappedState || tookDamage) {
      if (mappedState === 0) {
        // Base state (frames 0 and 1)
        if (tookDamage) {
          const animKey = 'anim_hp_state_0';
          if (!this.anims.exists(animKey)) {
            this.anims.create({
              key: animKey,
              frames: this.anims.generateFrameNumbers('boss_hp_bar', { start: 0, end: 1 }),
              frameRate: 10,
              repeat: 0
            });
          }
          this.hpBarSprite.play(animKey);
        } else {
          this.hpBarSprite.setFrame(0);
        }
      } else {
        // Decrement states 1 to 8
        // State 1 = frames 2 to 7. State 8 = frames 44 to 49.
        const startFrame = (mappedState - 1) * 6 + 2;
        const endFrame = startFrame + 5;
        const animKey = 'anim_hp_state_' + mappedState;

        if (!this.anims.exists(animKey)) {
          this.anims.create({
            key: animKey,
            frames: this.anims.generateFrameNumbers('boss_hp_bar', { start: startFrame, end: endFrame }),
            frameRate: 15,
            repeat: 0
          });
        }
        this.hpBarSprite.play(animKey);
      }
      this._hpBarState = mappedState;
    }

    if (this.hpText) {
      const displayHp = Math.ceil(ratio * 1000);
      this.hpText.setText(`${displayHp}/1000`);
    }
  }

  update(time, delta) {
    this.elapsed = Date.now() - this.startTime;
    const seconds = Math.floor(this.elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const displaySecs = seconds % 60;
    if (this.timerText) {
      this.timerText.setText(`${minutes.toString().padStart(2, '0')}:${displaySecs.toString().padStart(2, '0')}`);
    }

    // Live power-up timer bar drain
    if (this._puActive && this.puBarFill) {
      const remaining = Math.max(0, this._puEndTime - Date.now());
      const ratio = remaining / this._puDuration;
      this.puBarFill.clear();
      this.puBarFill.fillStyle(this._puColor, 1);
      this.puBarFill.fillRect(this.puBarX, this.puBarY, this.puBarMaxW * ratio, 5);
      if (remaining <= 0) this.clearPowerup();
    }
  }
}
