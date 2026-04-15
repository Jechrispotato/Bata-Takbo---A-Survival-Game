import * as Phaser from 'phaser';

export class Player {
  /**
   * @param {Phaser.Scene} scene 
   * @param {import('./Grid.js').Grid} grid 
   */
  constructor(scene, grid) {
    this.scene = scene;
    this.grid = grid;

    // Start at bottom center
    this.col = Math.floor(grid.cols / 2);
    this.row = grid.rows - 1;
    this.isMoving = false;
    this.facing = 'down';
    
    this.hp = 6;
    this.maxHp = 6;
    this.isInvulnerable = false;

    const startPos = this.grid.getPixelPosition(this.col, this.row);
    
    // Sprite strips are 384x64 = 8 frames of 48x64 each
    this.sprite = this.scene.add.sprite(startPos.x, startPos.y, 'player_idle_down');
    
    // Scale to fit within a tile (use tileSize relative to the 48px frame width)
    const scale = (grid.tileSize * 1.4) / 48;
    this.sprite.setScale(scale);
    this.sprite.setOrigin(0.5, 0.75); // Bottom-center anchor

    // Create directional animations — 8 frames each (0 to 7)
    if (!this.scene.anims.exists('idle_down')) {
      // Idle animations
      this.scene.anims.create({ key: 'idle_down', frames: this.scene.anims.generateFrameNumbers('player_idle_down', { start: 0, end: 7 }), frameRate: 8, repeat: -1 });
      this.scene.anims.create({ key: 'idle_up', frames: this.scene.anims.generateFrameNumbers('player_idle_up', { start: 0, end: 7 }), frameRate: 8, repeat: -1 });
      this.scene.anims.create({ key: 'idle_left', frames: this.scene.anims.generateFrameNumbers('player_idle_left', { start: 0, end: 7 }), frameRate: 8, repeat: -1 });
      this.scene.anims.create({ key: 'idle_right', frames: this.scene.anims.generateFrameNumbers('player_idle_right', { start: 0, end: 7 }), frameRate: 8, repeat: -1 });
      
      // Dash animations
      this.scene.anims.create({ key: 'dash_down', frames: this.scene.anims.generateFrameNumbers('player_dash_down', { start: 0, end: 7 }), frameRate: 20, repeat: 0 });
      this.scene.anims.create({ key: 'dash_up', frames: this.scene.anims.generateFrameNumbers('player_dash_up', { start: 0, end: 7 }), frameRate: 20, repeat: 0 });
      this.scene.anims.create({ key: 'dash_left', frames: this.scene.anims.generateFrameNumbers('player_dash_left', { start: 0, end: 7 }), frameRate: 20, repeat: 0 });
      this.scene.anims.create({ key: 'dash_right', frames: this.scene.anims.generateFrameNumbers('player_dash_right', { start: 0, end: 7 }), frameRate: 20, repeat: 0 });
    }

    this.sprite.play('idle_down');
  }

  move(direction) {
    if (this.isMoving) return;

    let dCol = 0, dRow = 0;
    if (direction === 'up') dRow = -1;
    else if (direction === 'down') dRow = 1;
    else if (direction === 'left') dCol = -1;
    else if (direction === 'right') dCol = 1;
    else return;

    const dist = this.hasDash ? 3 : 1;
    let targetCol = this.col + (dCol * dist);
    let targetRow = this.row + (dRow * dist);

    // Clamp dash within grid bounds
    if (targetCol < 0) targetCol = 0;
    if (targetCol >= this.grid.cols) targetCol = this.grid.cols - 1;
    if (targetRow < 0) targetRow = 0;
    if (targetRow >= this.grid.rows) targetRow = this.grid.rows - 1;

    if (targetCol < 0 || targetCol >= this.grid.cols) return;
    if (targetRow < 0 || targetRow >= this.grid.rows) return;

    // Check Chapter 2 Obstacles
    if (this.grid.cells[targetRow][targetCol].status === 'locked') return;

    this.isMoving = true;
    this.facing = direction;
    this.col = targetCol;
    this.row = targetRow;

    const targetPos = this.grid.getPixelPosition(this.col, this.row);

    // Play directional dash animation
    this.sprite.play(`dash_${direction}`);

    // Calculate duration: speed boosted halves transition time, dashing slightly extends it over the longer gap
    let duration = this.isSpeedBoosted ? 75 : 150;
    if (this.hasDash) duration = 200;

    // Clear dash flag once actively moving
    if (this.hasDash) {
        this.hasDash = false;
        this.scene.events.emit('powerup:cleared'); // Tells HUD to turn off the dash slot
    }

    this.scene.tweens.add({
      targets: this.sprite,
      x: targetPos.x,
      y: targetPos.y,
      duration: duration,
      ease: 'Power2',
      onComplete: () => {
        this.isMoving = false;
        this.sprite.play(`idle_${this.facing}`);
        this.scene.events.emit('player:moved', this.col, this.row);

        // Grid Hazard Effects
        if (this.grid.cells[this.row][this.col].status === 'mud') {
          // Slide in the same direction!
          // Note: Because isMoving is false, if this hits a wall, move() softly fails.
          if (!this.isAnchored) {
            this.move(this.facing);
          }
        }
      }
    });
  }

  takeDamage() {
    if (this.isInvulnerable || this.isInvincible || this.hp <= 0) return;
    
    this.hp--;
    this.scene.events.emit('player:health_changed', this.hp);
    
    if (this.hp <= 0) {
      this.die();
      return;
    }
    this.toggleInvulnerability();
  }

  toggleInvulnerability() {
    this.isInvulnerable = true;
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.3,
      yoyo: true,
      repeat: 5,
      duration: 150,
      onComplete: () => {
        this.sprite.alpha = 1;
        this.isInvulnerable = false;
      }
    });
  }

  die() {
    this.sprite.setTint(0xff0000);
    this.scene.tweens.add({
      targets: this.sprite,
      angle: 90,
      alpha: 0,
      y: '+=20',
      duration: 500,
      onComplete: () => {
        this.scene.events.emit('player:died');
      }
    });
  }
}
