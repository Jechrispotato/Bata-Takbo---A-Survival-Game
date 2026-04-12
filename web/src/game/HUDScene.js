import * as Phaser from 'phaser';

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

    // Left HUD Panel Background
    this.panelBg = this.add.graphics();
    this.panelBg.fillStyle(0x0a0a1a, 1); 
    this.panelBg.fillRect(0, 0, leftWidth, height);
    
    // Panel Divider
    this.panelBg.lineStyle(4, 0x4a4e69, 1);
    this.panelBg.beginPath();
    this.panelBg.moveTo(leftWidth, 0);
    this.panelBg.lineTo(leftWidth, height);
    this.panelBg.strokePath();

    // Centering Fix: Use a larger symmetric padding to shrink bounding boxes slightly and perfectly target the left panel horizontal center
    const padX = 28; 
    let boxSize = leftWidth - (padX * 2);

    // Guard against very short screens forcing overlap
    const minRequiredHeight = boxSize * 2 + 80;
    if (height < minRequiredHeight) {
       boxSize = Math.floor((height - 80) / 2);
    }
    
    // Lowered Y to natively avoid cutting off the top edge of CH1 label
    const infoBoxY = 32;

    // 1. Info Box
    this.panelBg.fillStyle(0x151530, 1);
    this.panelBg.fillRect(padX, infoBoxY, boxSize, boxSize);
    this.panelBg.lineStyle(4, 0x4a4e69, 1);
    this.panelBg.strokeRect(padX, infoBoxY, boxSize, boxSize);

    // 1. CH1 Title as a label safely outside and above the Top Box
    this.chapterText = this.add.text(padX, infoBoxY - 20, `CH ${this.chapterId}`, {
      fontFamily: 'VCR', fontSize: '16px', color: '#ffd700'
    });

    // 2. Boss Portrait inside
    // Takes precisely 75% of the box dimensions seamlessly!
    const innerPad = 10;
    const portraitSize = Math.floor(boxSize * 0.75); // Exactly 75% of height and width
    const portraitX = padX + innerPad;
    const portraitY = infoBoxY + innerPad;
    
    this.panelBg.fillStyle(0x0a0a1a, 1);
    this.panelBg.fillRect(portraitX, portraitY, portraitSize, portraitSize);
    this.panelBg.lineStyle(2, 0x4a4e69, 1);
    this.panelBg.strokeRect(portraitX, portraitY, portraitSize, portraitSize);

    if (this.scene.manager.keys['GameScene']) {
      const bossKey = this.chapterId === 1 ? 'boss_redcap' : 'boss_redcap';
      const bossImg = this.add.image(portraitX + portraitSize / 2, portraitY + portraitSize / 2, bossKey);
      bossImg.setDisplaySize(portraitSize - 4, portraitSize - 4);
    }

    // 3. Text Grouping (LIFE, POWERUP tightly tucked below portrait to use remaining bottom strip)
    // Retain strict font limits ensuring 0 layout shifts.
    const availableTextHeight = boxSize - portraitSize - (innerPad * 2);
    const lineHeight = availableTextHeight / 2; // Split remaining vertical height
    const gapRatio = 0.2; 
    const maxFontByHeight = Math.floor(lineHeight * (1 - gapRatio));
    
    // Total available bottom row width spans the full inner width roughly.
    // 13 characters for "POWERUP: NONE". Using strict font width constraint.
    const availableTextWidth = boxSize - (innerPad * 2);
    const maxFontByWidth = Math.floor(availableTextWidth / (13 * 0.65)); 
    
    const fontSizeNum = Math.floor(Math.min(maxFontByHeight, maxFontByWidth));
    const fontSize = `${fontSizeNum}px`;
    
    // Centered vertically in the bottom strip tucked beneath the portrait
    const startY = portraitY + portraitSize + Math.floor((lineHeight - fontSizeNum) / 2);
    const textX = padX + innerPad; // flush left below portrait
    
    // Grouped compactly on remaining space (stacked vertically, compactly tucked)
    this.lifeText = this.add.text(textX, startY, 'LIFE: ♥ ♥ ♥', {
      fontFamily: 'VCR', fontSize: fontSize, color: '#cadc9f'
    });

    // Place Powerup text compactly directly beneath it in the remaining strip
    // Wait, wait! The original replaced block also needs to leave the newly placed SCORE text rendering untouched!
    // I am avoiding replacing the SCORE by stopping this replacement chunk HERE.

    // Relocated Score (Top right corner, neatly under PAUSE button)
    this.scoreText = this.add.text(width - Math.max(25, width * 0.04), 70, 'SCORE: 0', {
      fontFamily: 'VCR', fontSize: '28px', color: '#ffd700', align: 'right', stroke: '#000000', strokeThickness: 4
    }).setOrigin(1, 0);

    // Place Powerup text compactly directly beneath it in the remaining strip
    this.powerupText = this.add.text(textX, startY + lineHeight, 'POWERUP: NONE', {
      fontFamily: 'VCR', fontSize: fontSize, color: '#cadc9f'
    });
    
    // Bottom Box position (at the bottom of the screen with symmetric padding)
    const paddingBottom = 28; // Matched perfectly with top padX for absolute vertical framing balance
    const cameraBoxY = height - boxSize - paddingBottom;

    // 3. Sync DOM Timer (Top left of right panel, mirroring PAUSE CSS style exactly)
    const domTimer = document.getElementById('game-timer-dom');
    if (domTimer) {
      // Anchor dynamically to right of HUD dividing panel with identical var(--space-md) margin mapping
      const spacingToLine = Math.max(16, width * 0.02); 
      domTimer.style.left = `${leftWidth + spacingToLine}px`;
    }

    // 4. Camera View Box Placeholder
    this.panelBg.fillStyle(0x151530, 1);
    this.panelBg.fillRect(padX, cameraBoxY, boxSize, boxSize);
    this.panelBg.lineStyle(4, 0x4a4e69, 1);
    this.panelBg.strokeRect(padX, cameraBoxY, boxSize, boxSize);

    // Bind PIP webcam directly over the Camera View Box
    const pip = document.getElementById('game-camera-pip');
    if (pip) {
      pip.style.left = `${padX + 2}px`;
      pip.style.top = `${cameraBoxY + 2}px`;
      pip.style.width = `${boxSize - 4}px`;
      pip.style.height = `${boxSize - 4}px`;
      pip.style.bottom = 'auto'; // Remove bottom pin
      pip.style.borderRadius = '0px'; 
      pip.style.aspectRatio = '1 / 1';
      pip.style.border = 'none';
      pip.style.boxShadow = 'none';
    }
  }

  updateScore(score) {
    this.scoreText.setText(`SCORE: ${score}`);
  }

  updateLives(lives) {
    let hearts = '';
    for(let i=0; i<Math.floor(lives/2); i++) hearts += '♥ ';
    if (lives % 2 === 1) hearts += '♡ ';
    this.lifeText.setText(hearts);
  }

  update(time, delta) {
    this.elapsed = Date.now() - this.startTime;
    const seconds = Math.floor(this.elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const displaySecs = seconds % 60;
    
    const domTimer = document.getElementById('game-timer-dom');
    if (domTimer) {
      domTimer.innerText = `${minutes.toString().padStart(2, '0')}:${displaySecs.toString().padStart(2, '0')}`;
    }
  }
}
