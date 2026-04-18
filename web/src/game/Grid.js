import * as Phaser from 'phaser';

export class Grid {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} cols 
   * @param {number} rows 
   */
  constructor(scene, cols = 7, rows = 9) {
    this.scene = scene;
    this.cols = cols;
    this.rows = rows;
    
    // Will hold graphic backgrounds or tile sprites
    this.cells = [];
    this.tileSize = 0;
    this.offsetX = 0;
    this.offsetY = 0;

    this.calculateGrid();
    this.drawBackground();
  }

  calculateGrid() {
    const { width, height } = this.scene.scale;
    const leftWidth = Math.max(250, Math.min(450, width * 0.28));
    const rightWidth = width - leftWidth;
    const rightHeight = height;

    this.panelRect = {
      x: leftWidth,
      y: 0,
      w: rightWidth,
      h: rightHeight
    };

    // Calculate maximum STRICTLY SQUARE tileSize to fit within the right panel with significant padding
    const paddingX = rightWidth * 0.12; 
    const paddingY = rightHeight * 0.12;
    const availableWidth = rightWidth - paddingX * 2;
    const availableHeight = rightHeight - paddingY * 2;

    const rawWidth = availableWidth / this.cols;
    const rawHeight = availableHeight / this.rows;
    
    // STRICT SQUARE preserves projectile/highlight integrity
    this.tileSize = Math.floor(Math.min(rawWidth, rawHeight));
    
    // The exact size of the grid itself inside the panel
    const gridWidth = this.tileSize * this.cols;
    const gridHeight = this.tileSize * this.rows;

    // Expose board dimensions for external layout
    this.boardWidth = gridWidth;
    this.boardHeight = gridHeight;

    // Perfectly center the grid INSIDE the right panel avoiding any bleed.
    this.offsetX = leftWidth + Math.floor((rightWidth - gridWidth) / 2);
    this.offsetY = Math.floor((rightHeight - gridHeight) / 2);
  }

  drawBackground() {
    // Add full panel background
    const panelImg = this.scene.add.image(this.panelRect.x + this.panelRect.w / 2, this.panelRect.y + this.panelRect.h / 2, 'grid_panel_bg');
    panelImg.displayHeight = this.panelRect.h;
    panelImg.scaleX = panelImg.scaleY;

    this.bgGraphics = this.scene.add.graphics();
    
    // Add grid background image spanning the identical gameplay space
    const gridW = this.tileSize * this.cols;
    const gridH = this.tileSize * this.rows;
    this.bgImage = this.scene.add.image(this.offsetX + gridW / 2, this.offsetY + gridH / 2, 'grid_bg');
    this.bgImage.setDisplaySize(gridW, gridH);

    this.graphics = this.scene.add.graphics();

    this.render();
  }

  render() {
    this.bgGraphics.clear();
    this.graphics.clear();

    const lineStyle = { width: 2, color: 0x4a4e69, alpha: 0 };
    const fillLight = 0x22223b;
    const fillDark = 0x1a1a2e;

    // Drop Shadow for the gameplay grid
    const gridW = this.tileSize * this.cols;
    const gridH = this.tileSize * this.rows;
    this.bgGraphics.fillStyle(0x000000, 0.4);
    this.bgGraphics.fillRect(this.offsetX + 8, this.offsetY + 12, gridW, gridH);
    this.bgGraphics.fillStyle(0x000000, 0.2);
    this.bgGraphics.fillRect(this.offsetX - 2, this.offsetY + 4, gridW + 16, gridH + 20);

    // 1. Fill the ENTIRE right panel explicitly (Disabled to show image)
    // this.bgGraphics.fillStyle(panelBg, 1);
    // this.bgGraphics.fillRect(this.panelRect.x, this.panelRect.y, this.panelRect.w, this.panelRect.h);
    
    // 2. Thick Outer frame shadow around the complete right panel edges (Disabled entirely to make transparent)
    // this.bgGraphics.lineStyle(20, 0x000000, 0.5);
    // this.bgGraphics.strokeRect(this.panelRect.x + 10, this.panelRect.y + 10, this.panelRect.w - 20, this.panelRect.h - 20);

    // 3. Crisp frame directly outlining the centered inner game grid (Disabled)
    // this.graphics.lineStyle(6, 0x4a4e69, 1);
    // this.graphics.strokeRect(this.offsetX - 3, this.offsetY - 3, gridW + 6, gridH + 6);

    for (let r = 0; r < this.rows; r++) {
      this.cells[r] = [];
      for (let c = 0; c < this.cols; c++) {
        const x = this.offsetX + c * this.tileSize;
        const y = this.offsetY + r * this.tileSize;

        // Checkerboard pattern (now transparent to see bg)
        const isDark = (r + c) % 2 === 0;
        this.graphics.fillStyle(isDark ? fillDark : fillLight, 0);
        this.graphics.fillRect(x, y, this.tileSize, this.tileSize);

        // Grid border
        this.graphics.lineStyle(lineStyle.width, lineStyle.color, lineStyle.alpha);
        this.graphics.strokeRect(x, y, this.tileSize, this.tileSize);

        this.cells[r][c] = { x, y, cx: x + this.tileSize / 2, cy: y + this.tileSize / 2, status: 'safe' };
      }
    }
  }

  // Gets the exact screen pixel coordinate (center of the tile) for an entity
  getPixelPosition(col, row) {
    if(row < 0) row = 0;
    if(row >= this.rows) row = this.rows - 1;
    if(col < 0) col = 0;
    if(col >= this.cols) col = this.cols - 1;

    return { 
      x: this.cells[row][col].cx, 
      y: this.cells[row][col].cy 
    };
  }

  /**
   * Draw a permanently highlighted tile (used for golden damage tiles or hazards).
   * For temporary highlights, use telegraph() instead.
   */
  highlightTile(col, row, colorHex = 0xff0000, alpha = 0.5) {
    const x = this.offsetX + col * this.tileSize;
    const y = this.offsetY + row * this.tileSize;
    this.graphics.fillStyle(colorHex, alpha);
    this.graphics.fillRect(x, y, this.tileSize, this.tileSize);
  }

  /**
   * Modify the physical state of a cell for hazards (Ch 2+)
   */
  setCellStatus(col, row, status, colorHex = 0x000000) {
    if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
      this.cells[row][col].status = status;
      if (status !== 'safe') {
        this.highlightTile(col, row, colorHex, 0.4);
      } else {
        this.render(); // Clear overlay
      }
    }
  }

  /**
   * Power Up Logistics
   */
  spawnChest(col, row, rarityIndex) {
     if (!this.chests) this.chests = {};
     const key = `${col}_${row}`;
     if (this.chests[key]) return; // already a chest

     const pos = this.getPixelPosition(col, row);
     const fxSize = this.tileSize * 2.2; // bigger than the tile

     // All 4 chest FX animations — pick one at random for variety
     const allFxKeys = ['anim_chest1', 'anim_chest2', 'anim_chest3', 'anim_chest4'];
     let pickedKey;
     if (rarityIndex === 8) {
       pickedKey = 'anim_villain_hp_up';
     } else {
       pickedKey = allFxKeys[Phaser.Math.Between(0, allFxKeys.length - 1)];
     }
     
     const texKey = pickedKey.replace('anim_', ''); // e.g. 'chest3' or 'villain_hp_up'

     const fx = this.scene.add.sprite(pos.x, pos.y, texKey)
       .setDisplaySize(fxSize, fxSize)
       .setDepth(22)
       .play(pickedKey);
     // FX self-destructs when done — independently of chest
     fx.once('animationcomplete', () => fx.destroy());

     // Half-durations (ms) for each FX so the chest pops at the midpoint
     const halfMs = {
       'anim_chest1': 350,   // 14f @ 20fps = 700ms
       'anim_chest2': 450,   // 18f @ 20fps = 900ms
       'anim_chest3': 1607,  // 90f @ 28fps ≈ 3214ms
       'anim_chest4': 1428,  // 80f @ 28fps ≈ 2857ms
       'anim_villain_hp_up': 400, // 12f @ 15fps = 800ms
     };

     // Create chest sprite hidden
     const chestSpr = this.scene.add.sprite(pos.x, pos.y, 'powerup_chests', rarityIndex)
       .setScale(3.0).setDepth(20).setAlpha(0);

     const shadow = this.scene.add.ellipse(pos.x, pos.y + 20, 40, 15, 0x000000).setDepth(19).setAlpha(0);

     // Emerge chest at the MIDPOINT of the FX while it's still playing
     this.scene.time.delayedCall(halfMs[pickedKey] ?? 500, () => {
       // Pop in with Back.easeOut scale bounce
       chestSpr.setScale(4.0);
       this.scene.tweens.add({
         targets: chestSpr,
         alpha: 1,
         scale: 3.0,
         duration: 220,
         ease: 'Back.easeOut',
         onComplete: () => {
           // Gentle continuous float — bobs ±8px forever
           const floatTween = this.scene.tweens.add({
             targets: chestSpr,
             y: chestSpr.y - 8,
             duration: 700,
             ease: 'Sine.easeInOut',
             yoyo: true,
             repeat: -1
           });
           
           const shadowTween = this.scene.tweens.add({
             targets: shadow,
             scaleX: 0.7, scaleY: 0.7, alpha: 0.2,
             duration: 700, ease: 'Sine.easeInOut', yoyo: true, repeat: -1
           });
           
           if (this.chests && this.chests[key]) {
               this.chests[key].floatTween = floatTween;
               this.chests[key].shadowTween = shadowTween;
           }
         }
       });
       this.scene.tweens.add({ targets: shadow, alpha: 0.4, duration: 220, ease: 'Back.easeOut' });
     });

     this.chests[key] = { sprite: chestSpr, shadow: shadow, rarity: rarityIndex };

      // Chest stays for 3 seconds max, then despawns if not collected
     const totalSpawnTime = (halfMs[pickedKey] ?? 500) + 220;
     this.scene.time.delayedCall(totalSpawnTime + 3000, () => {
         if (this.chests && this.chests[key]) {
             const data = this.chests[key];
             delete this.chests[key];
             
             if (data.floatTween) data.floatTween.stop();
             if (data.shadowTween) data.shadowTween.stop();
             
             data.sprite.scene.tweens.add({
                 targets: [data.sprite, data.shadow],
                 alpha: 0,
                 scale: 0,
                 duration: 300,
                 ease: 'Back.easeIn',
                 onComplete: () => { data.sprite.destroy(); data.shadow.destroy(); }
             });
         }
     });
  }


  hasChestAt(col, row) {
     if(!this.chests) return false;
     return !!this.chests[`${col}_${row}`];
  }

  removeChestAt(col, row) {
     const key = `${col}_${row}`;
     if (this.chests && this.chests[key]) {
         const data = this.chests[key];
         const rarity = data.rarity;
         delete this.chests[key];

         if (data.floatTween) data.floatTween.stop();
         if (data.shadowTween) data.shadowTween.stop();
         data.shadow.destroy();

         // Play the opening animation, then gently fade out upwards
         if (data.sprite.scene.anims.exists(`chest_open_${rarity}`)) {
            data.sprite.play(`chest_open_${rarity}`);
            data.sprite.once('animationcomplete', () => {
                data.sprite.scene.tweens.add({
                    targets: data.sprite,
                    alpha: 0,
                    scale: 3.5, // Bloom slightly while fading
                    duration: 300,
                    onComplete: () => data.sprite.destroy()
                });
            });
         } else {
            data.sprite.destroy();
         }

         return rarity;
     }
     return null;
  }

  /**
   * Ruby Logistics
   */
  spawnRuby(col, row) {
     if (!this.rubies) this.rubies = {};
     const key = `${col}_${row}`;
     if (this.rubies[key] || this.hasChestAt(col, row)) return;

     const pos = this.getPixelPosition(col, row);

     const rubySpr = this.scene.add.sprite(pos.x, pos.y, 'ruby_loot')
       .setScale(0).setDepth(20);

     const shadow = this.scene.add.ellipse(pos.x, pos.y + 16, 26, 12, 0x000000).setDepth(19).setAlpha(0);

     // Pop in
     this.scene.tweens.add({
         targets: rubySpr,
         scale: 2.0,
         duration: 300,
         ease: 'Back.easeOut',
         onComplete: () => {
             const floatTween = this.scene.tweens.add({
                 targets: rubySpr,
                 y: rubySpr.y - 15,
                 duration: 800,
                 ease: 'Sine.easeInOut',
                 yoyo: true,
                 repeat: -1
             });
             const shadowTween = this.scene.tweens.add({
                 targets: shadow,
                 scaleX: 0.6, scaleY: 0.6, alpha: 0.15,
                 duration: 800, ease: 'Sine.easeInOut', yoyo: true, repeat: -1
             });
             if (this.rubies && this.rubies[key]) {
                 this.rubies[key].floatTween = floatTween;
                 this.rubies[key].shadowTween = shadowTween;
             }
         }
     });
     this.scene.tweens.add({ targets: shadow, alpha: 0.35, duration: 300 });

     this.rubies[key] = { sprite: rubySpr, shadow: shadow };

     // Despawn after 4 seconds
     this.scene.time.delayedCall(4000, () => {
         if (this.rubies && this.rubies[key]) {
             const data = this.rubies[key];
             delete this.rubies[key];
             if (data.floatTween) data.floatTween.stop();
             if (data.shadowTween) data.shadowTween.stop();
             data.sprite.scene.tweens.add({
                 targets: [data.sprite, data.shadow],
                 alpha: 0, scale: 0, duration: 300,
                 onComplete: () => { data.sprite.destroy(); data.shadow.destroy(); }
             });
         }
     });
  }

  hasRubyAt(col, row) {
      if (!this.rubies) return false;
      return !!this.rubies[`${col}_${row}`];
  }

  removeRubyAt(col, row) {
      const key = `${col}_${row}`;
      if (this.rubies && this.rubies[key]) {
          const data = this.rubies[key];
          delete this.rubies[key];
          if (data.floatTween) data.floatTween.stop();
          if (data.shadowTween) data.shadowTween.stop();
          data.shadow.destroy();
          
          // Flash effect
          data.sprite.scene.tweens.add({
              targets: data.sprite,
              alpha: 0,
              scale: 3,
              duration: 200,
              onComplete: () => data.sprite.destroy()
          });
          return true;
      }
      return false;
  }

  /**
   * Diamond Logistics (Trap)
   */
  spawnDiamond(col, row) {
     if (!this.diamonds) this.diamonds = {};
     const key = `${col}_${row}`;
     if (this.diamonds[key] || this.hasChestAt(col, row) || this.hasRubyAt(col, row)) return;

     const pos = this.getPixelPosition(col, row);

     const diamondSpr = this.scene.add.sprite(pos.x, pos.y, 'diamond_loot')
       .setScale(0).setDepth(20);

     const shadow = this.scene.add.ellipse(pos.x, pos.y + 16, 26, 12, 0x000000).setDepth(19).setAlpha(0);

     this.scene.tweens.add({
         targets: diamondSpr,
         scale: 2.0,
         duration: 300,
         ease: 'Back.easeOut',
         onComplete: () => {
             const floatTween = this.scene.tweens.add({
                 targets: diamondSpr,
                 y: diamondSpr.y - 15,
                 duration: 800,
                 ease: 'Sine.easeInOut',
                 yoyo: true,
                 repeat: -1
             });
             const shadowTween = this.scene.tweens.add({
                 targets: shadow,
                 scaleX: 0.6, scaleY: 0.6, alpha: 0.15,
                 duration: 800, ease: 'Sine.easeInOut', yoyo: true, repeat: -1
             });
             if (this.diamonds && this.diamonds[key]) {
                 this.diamonds[key].floatTween = floatTween;
                 this.diamonds[key].shadowTween = shadowTween;
             }
         }
     });
     this.scene.tweens.add({ targets: shadow, alpha: 0.35, duration: 300 });

     this.diamonds[key] = { sprite: diamondSpr, shadow: shadow };

     // Despawn after 4 seconds
     this.scene.time.delayedCall(4000, () => {
         if (this.diamonds && this.diamonds[key]) {
             const data = this.diamonds[key];
             delete this.diamonds[key];
             if (data.floatTween) data.floatTween.stop();
             if (data.shadowTween) data.shadowTween.stop();
             data.sprite.scene.tweens.add({
                 targets: [data.sprite, data.shadow],
                 alpha: 0, scale: 0, duration: 300,
                 onComplete: () => { data.sprite.destroy(); data.shadow.destroy(); }
             });
         }
     });
  }

  hasDiamondAt(col, row) {
      if (!this.diamonds) return false;
      return !!this.diamonds[`${col}_${row}`];
  }

  removeDiamondAt(col, row) {
      const key = `${col}_${row}`;
      if (this.diamonds && this.diamonds[key]) {
          const data = this.diamonds[key];
          delete this.diamonds[key];
          if (data.floatTween) data.floatTween.stop();
          if (data.shadowTween) data.shadowTween.stop();
          data.shadow.destroy();
          
          data.sprite.scene.tweens.add({
              targets: data.sprite,
              alpha: 0,
              scale: 3,
              duration: 200,
              onComplete: () => data.sprite.destroy()
          });
          return true;
      }
      return false;
  }

  /**
   * Show a temporary red warning tile that auto-disappears after durationMs.
   * Uses a separate graphics object so it doesn't pollute the base grid.
   */
  telegraph(col, row, durationMs = 1500) {
    const x = this.offsetX + col * this.tileSize;
    const y = this.offsetY + row * this.tileSize;

    // Create a dedicated temporary graphics object for this telegraph
    const tempGfx = this.scene.add.graphics();
    tempGfx.fillStyle(0xff0000, 0.5);
    tempGfx.fillRect(x, y, this.tileSize, this.tileSize);

    // Pulse animation to make it visually obvious
    this.scene.tweens.add({
      targets: tempGfx,
      alpha: 0.3,
      yoyo: true,
      repeat: 3,
      duration: durationMs / 6,
    });

    // Auto-destroy after the warning period
    this.scene.time.delayedCall(durationMs, () => {
      tempGfx.destroy();
    });
  }
}
