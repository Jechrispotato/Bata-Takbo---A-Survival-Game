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
    this.bgGraphics = this.scene.add.graphics();
    this.graphics = this.scene.add.graphics();
    this.render();
  }

  render() {
    this.bgGraphics.clear();
    this.graphics.clear();

    const lineStyle = { width: 2, color: 0x4a4e69, alpha: 0.8 };
    const fillLight = 0x22223b;
    const fillDark = 0x1a1a2e;
    const panelBg = 0x151530;

    // 1. Fill the ENTIRE right panel explicitly
    this.bgGraphics.fillStyle(panelBg, 1);
    this.bgGraphics.fillRect(this.panelRect.x, this.panelRect.y, this.panelRect.w, this.panelRect.h);
    
    // 2. Thick Outer frame around the complete right panel edges
    this.bgGraphics.lineStyle(10, 0x4a4e69, 1);
    this.bgGraphics.strokeRect(this.panelRect.x + 5, this.panelRect.y + 5, this.panelRect.w - 10, this.panelRect.h - 10);
    this.bgGraphics.lineStyle(2, 0x8a8e99, 1);
    this.bgGraphics.strokeRect(this.panelRect.x + 10, this.panelRect.y + 10, this.panelRect.w - 20, this.panelRect.h - 20);

    // 3. Crisp frame directly outlining the centered inner game grid
    const gridW = this.tileSize * this.cols;
    const gridH = this.tileSize * this.rows;
    this.bgGraphics.lineStyle(6, 0x4a4e69, 1);
    this.bgGraphics.strokeRect(this.offsetX - 3, this.offsetY - 3, gridW + 6, gridH + 6);

    for (let r = 0; r < this.rows; r++) {
      this.cells[r] = [];
      for (let c = 0; c < this.cols; c++) {
        const x = this.offsetX + c * this.tileSize;
        const y = this.offsetY + r * this.tileSize;

        // Checkerboard pattern
        const isDark = (r + c) % 2 === 0;
        this.graphics.fillStyle(isDark ? fillDark : fillLight, 1);
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
     const chestSpr = this.scene.add.sprite(pos.x, pos.y, 'powerup_chests', rarityIndex);
     // Base frames are 48x32 but the art is small, so we scale it up substantially
     chestSpr.setScale(2.5).setDepth(20);
     this.chests[key] = { sprite: chestSpr, rarity: rarityIndex };
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
