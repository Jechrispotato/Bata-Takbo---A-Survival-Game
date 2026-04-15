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
    const leftWidth = Math.max(250, Math.min(450, width * 0.28));

    // ========== LEFT PANEL BACKGROUND ==========
    this.panelBg = this.add.graphics();
    this.panelBg.fillStyle(0x0a0a1a, 1); 
    this.panelBg.fillRect(0, 0, leftWidth, height);
    
    // Panel divider line
    this.panelBg.lineStyle(4, 0x4a4e69, 1);
    this.panelBg.beginPath();
    this.panelBg.moveTo(leftWidth, 0);
    this.panelBg.lineTo(leftWidth, height);
    this.panelBg.strokePath();

    // ========== TOP BAR (inside left panel) ==========
    const padX = 12;

    // Pause button
    const pauseBtn = this.add.text(padX, 10, '❚❚ PAUSE', {
      fontFamily: 'DungeonFont', fontSize: '18px', color: '#f0e6d3'
    }).setInteractive({ useHandCursor: true });
    
    pauseBtn.on('pointerdown', () => {
      state.emit('game:pause');
    });

    // TIME
    this.add.text(padX + 90, 2, 'TIME:', {
      fontFamily: 'VCR', fontSize: '14px', color: '#a89b8c'
    });
    this.timerText = this.add.text(padX + 90, 16, '00:00', {
      fontFamily: 'VCR', fontSize: '20px', color: '#f0e6d3'
    });

    // Score
    this.add.text(padX + 170, 2, 'SCORE:', {
      fontFamily: 'VCR', fontSize: '14px', color: '#a89b8c'
    });
    this.scoreText = this.add.text(padX + 170, 16, '0', {
      fontFamily: 'VCR', fontSize: '20px', color: '#ffd700'
    });

    // Hearts (top right of left panel)
    this.hearts = [];
    const heartStartX = leftWidth - padX - (2 * 26);
    for (let i = 0; i < 3; i++) {
      // Render the full heart by default (frame 147)
      const heart = this.add.sprite(heartStartX + (i * 26), 20, 'ui_buttons', 147);
      heart.setScale(2.0).setOrigin(0.5, 0.5);
      this.hearts.push(heart);
    }

    // ========== BOSS DISPLAY BOX (blue border per wireframe) ==========
    const boxPadX = 20;
    const bossBoxY = 44;
    const bossBoxW = leftWidth - boxPadX * 2;
    const remainingHeight = height - 44;
    const bossBoxH = Math.floor(remainingHeight * 0.55);

    // Box background
    this.panelBg.fillStyle(0x151530, 1);
    this.panelBg.fillRect(boxPadX, bossBoxY, bossBoxW, bossBoxH);
    // Blue border per wireframe
    this.panelBg.lineStyle(3, 0x3a86c8, 1);
    this.panelBg.strokeRect(boxPadX, bossBoxY, bossBoxW, bossBoxH);

    // Chapter label
    this.add.text(boxPadX, bossBoxY - 4, `CH ${this.chapterId}`, {
      fontFamily: 'VCR', fontSize: '14px', color: '#ffd700'
    }).setOrigin(0, 1);

    // *** BOSS ANIMATED SPRITE — rendered HERE in HUDScene so it's visible ***
    // The boss_idle and boss_cast spritesheets were loaded by GameScene.
    const bossCenterX = boxPadX + bossBoxW / 2;
    const bossCenterY = bossBoxY + bossBoxH / 2;
    
    // Create boss animations first
    if (!this.anims.exists('anim_boss_idle')) {
      this.anims.create({
        key: 'anim_boss_idle',
        frames: this.anims.generateFrameNumbers('boss_idle', { start: 0, end: 7 }), // 8 frame animation
        frameRate: 6,
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
    // Scale to fit within the box (based on original 122x110 cast size)
    const fitScale = Math.min((bossBoxW - 10) / 122, (bossBoxH - 10) / 110);
    this.bossSprite.setScale(fitScale);
    this.bossSprite.setOrigin(0.5, 0.5);

    // Revert to idle after attacking
    this.bossSprite.on('animationcomplete-anim_boss_attack', () => {
      this.bossSprite.setTexture('boss_idle');
      this.bossSprite.play('anim_boss_idle');
    });

    this.bossSprite.play('anim_boss_idle');

    // Make HUD expose playBossAttack for the GameScene to call
    this.playBossAttack = () => {
      this.bossSprite.setTexture('boss_cast');
      this.bossSprite.play('anim_boss_attack');
    };

    // Gentle float animation
    this.tweens.add({
      targets: this.bossSprite,
      y: bossCenterY - 6,
      yoyo: true,
      repeat: -1,
      duration: 1200,
      ease: 'Sine.easeInOut'
    });

    // ========== HP BAR ==========
    const hpBarY = bossBoxY + bossBoxH + 8;
    const hpBarH = 10;
    this.hpBarBg = this.add.graphics();
    this.hpBarBg.fillStyle(0x333333, 1);
    this.hpBarBg.fillRect(boxPadX, hpBarY, bossBoxW, hpBarH);
    this.hpBarFill = this.add.graphics();
    this.hpBarFill.fillStyle(0xe63946, 1);
    this.hpBarFill.fillRect(boxPadX, hpBarY, bossBoxW, hpBarH);
    this.hpBarWidth = bossBoxW;
    this.hpBarX = boxPadX;
    this.hpBarY = hpBarY;
    this.hpBarH = hpBarH;

    // ========== POWER-UP SLOT ==========
    const puY = hpBarY + hpBarH + 8;
    
    this.add.text(boxPadX, puY, 'POWER-UP', {
      fontFamily: 'VCR', fontSize: '11px', color: '#a89b8c'
    });

    // Slot background box
    const puBoxH = 44;
    const puBoxY = puY + 14;
    this.panelBg.fillStyle(0x0d0d22, 1);
    this.panelBg.fillRect(boxPadX, puBoxY, bossBoxW, puBoxH);
    this.panelBg.lineStyle(1.5, 0x333355, 1);
    this.panelBg.strokeRect(boxPadX, puBoxY, bossBoxW, puBoxH);

    // Chest icon (frame will change by rarity)
    this.puIcon = this.add.sprite(boxPadX + 22, puBoxY + puBoxH / 2, 'powerup_chests', 0);
    this.puIcon.setScale(1.4).setAlpha(0);

    // Power-up name label
    this.puLabel = this.add.text(boxPadX + 44, puBoxY + 6, ' — ', {
      fontFamily: 'VCR', fontSize: '13px', color: '#666688'
    });

    // Timer bar background
    const puBarY = puBoxY + puBoxH - 8;
    this.panelBg.fillStyle(0x1a1a33, 1);
    this.panelBg.fillRect(boxPadX + 44, puBarY, bossBoxW - 44, 5);

    // Timer bar fill (redrawn every update)
    this.puBarFill = this.add.graphics();
    this.puBarMaxW = bossBoxW - 44;
    this.puBarX = boxPadX + 44;
    this.puBarY = puBarY;
    
    this._puEndTime = 0;
    this._puDuration = 0;
    this._puColor = 0x888888;
    this._puActive = false;

    // ========== CAMERA BOX (bottom of left panel) ==========
    const camBoxH = Math.floor(remainingHeight * 0.30);
    const camBoxY = height - camBoxH - boxPadX;
    
    this.panelBg.fillStyle(0x151530, 1);
    this.panelBg.fillRect(boxPadX, camBoxY, bossBoxW, camBoxH);
    this.panelBg.lineStyle(3, 0x4a4e69, 1);
    this.panelBg.strokeRect(boxPadX, camBoxY, bossBoxW, camBoxH);

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
    }
  }

  showPowerup(name, rarity, durationMs) {
    if (!this.puIcon) return;
    const colors   = [0x888888,  0x44aaff, 0xffdd00];
    const hexStr   = ['#aaaaaa', '#44aaff', '#ffdd00'];
    const frames   = [0, 1, 2]; // Chests.png column per rarity
    this._puActive   = true;
    this._puEndTime  = Date.now() + durationMs;
    this._puDuration = durationMs;
    this._puColor    = colors[rarity] ?? 0x888888;
    this.puIcon.setFrame(frames[rarity] ?? 0).setAlpha(1);
    this.puLabel.setText(name).setColor(hexStr[rarity] ?? '#aaaaaa');
  }

  clearPowerup() {
    this._puActive = false;
    if (this.puIcon)    this.puIcon.setAlpha(0);
    if (this.puLabel)   this.puLabel.setText(' — ').setColor('#666688');
    if (this.puBarFill) this.puBarFill.clear();
  }

  playBossAttack() {
    if (!this.bossSprite) return;
    this.bossSprite.play('boss_attack');
    this.bossSprite.once('animationcomplete', () => {
      this.bossSprite.play('boss_idle');
    });
  }

  playBossDamageVfx() {
    if (!this.bossSprite) return;
    
    // Spawn the explosion right over the boss sprite in the HUD
    const explosion = this.add.sprite(this.bossSprite.x, this.bossSprite.y, 'stylized_explosion');
    explosion.setScale(4.0).setDepth(200); // Scale up for massive impact
    explosion.play('anim_stylized_explosion');
    
    // Dynamic flash tint to show pain
    this.bossSprite.setTint(0xffffff);
    this.time.delayedCall(100, () => this.bossSprite.setTint(0xff0000));
    this.time.delayedCall(200, () => this.bossSprite.setTint(0xffffff));
    this.time.delayedCall(300, () => this.bossSprite.clearTint());

    explosion.on('animationcomplete', () => {
      explosion.destroy();
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
  }

  updateBossHp(current, max) {
    if (!this.hpBarFill) return;
    this.hpBarFill.clear();
    const ratio = Math.max(0, current / max);
    this.hpBarFill.fillStyle(ratio > 0.3 ? 0xe63946 : 0xff4444, 1);
    this.hpBarFill.fillRect(this.hpBarX, this.hpBarY, this.hpBarWidth * ratio, this.hpBarH);
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
