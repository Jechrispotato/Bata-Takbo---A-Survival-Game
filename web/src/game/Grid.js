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
    const panelBg = 0x151530; // Consistent background panel color for the whole right span

    // 1. Fill the ENTIRE right panel explicitly (eliminates outer black space)
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

  highlightTile(col, row, colorHex = 0xff0000, alpha = 0.5) {
    const x = this.offsetX + col * this.tileSize;
    const y = this.offsetY + row * this.tileSize;
    this.graphics.fillStyle(colorHex, alpha);
    this.graphics.fillRect(x, y, this.tileSize, this.tileSize);
  }

  telegraph(col, row, durationMs = 1500) {
     this.highlightTile(col, row, 0xff0000, 0.6);
     // Warning: this modifies the root graphics. True implementation should use temporary graphics/sprites.
     // For Step 3.2 this is a visual stub.
  }
}
