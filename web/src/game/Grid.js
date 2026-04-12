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
    
    // We want the grid to leave some padding on the sides and top/bottom for HUD
    const paddingX = width * 0.1; 
    const paddingY = height * 0.15; 

    const rawWidth = (width - paddingX * 2) / this.cols;
    const rawHeight = (height - paddingY * 2) / this.rows;
    
    // The tile should ideally be square, so take the smaller dimension
    this.tileSize = Math.floor(Math.min(rawWidth, rawHeight));
    
    // Calculate total grid dimensions
    const gridWidth = this.tileSize * this.cols;
    const gridHeight = this.tileSize * this.rows;

    // Center vertically, align to the RIGHT with padding
    this.offsetX = width - gridWidth - paddingX;
    this.offsetY = (height - gridHeight) / 2;
  }

  drawBackground() {
    this.graphics = this.scene.add.graphics();
    this.render();
  }

  render() {
    this.graphics.clear();

    const lineStyle = { width: 2, color: 0x4a4e69, alpha: 0.5 };
    const fillLight = 0x22223b;
    const fillDark = 0x1a1a2e;

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
