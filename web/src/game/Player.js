import * as Phaser from 'phaser';

export class Player {
  /**
   * @param {Phaser.Scene} scene 
   * @param {import('./Grid.js').Grid} grid 
   */
  constructor(scene, grid) {
    this.scene = scene;
    this.grid = grid;

    // Start at bottom center (assuming 7 columns, so col 3 is center. Row 8 is bottom for 9 rows)
    this.col = Math.floor(grid.cols / 2);
    this.row = grid.rows - 1;
    this.isMoving = false;
    
    this.hp = 6; // 6 hits equal 3 full hearts
    this.maxHp = 6;
    this.isInvulnerable = false;

    const startPos = this.grid.getPixelPosition(this.col, this.row);
    
    // Add sprite
    this.sprite = this.scene.add.sprite(startPos.x, startPos.y, 'player_idle');
    this.sprite.setScale(1.5);
    // Origin bottom center helps with grid alignment
    this.sprite.setOrigin(0.5, 0.8);

    // Create animations if they don't exist globally
    if (!this.scene.anims.exists('idle_down')) {
      this.scene.anims.create({
        key: 'idle_down',
        frames: this.scene.anims.generateFrameNumbers('player_idle', { start: 0, end: 5 }),
        frameRate: 8,
        repeat: -1
      });
      this.scene.anims.create({
        key: 'dash_anim',
        frames: this.scene.anims.generateFrameNumbers('player_dash', { start: 0, end: 5 }),
        frameRate: 15,
        repeat: 0
      });
    }

    this.sprite.play('idle_down');
  }

  move(direction) {
    if (this.isMoving) return;

    let dCol = 0;
    let dRow = 0;

    if (direction === 'up') dRow = -1;
    else if (direction === 'down') dRow = 1;
    else if (direction === 'left') dCol = -1;
    else if (direction === 'right') dCol = 1;
    else return;

    const targetCol = this.col + dCol;
    const targetRow = this.row + dRow;

    // Bounds checking
    if (targetCol < 0 || targetCol >= this.grid.cols) return;
    if (targetRow < 0 || targetRow >= this.grid.rows) return;

    this.isMoving = true;
    this.col = targetCol;
    this.row = targetRow;

    const targetPos = this.grid.getPixelPosition(this.col, this.row);

    // Play dash animation and flip appropriately
    this.sprite.play('dash_anim');
    if (dCol < 0) this.sprite.setFlipX(true);
    else if (dCol > 0) this.sprite.setFlipX(false);

    // Smooth tween to new tile
    this.scene.tweens.add({
      targets: this.sprite,
      x: targetPos.x,
      y: targetPos.y,
      duration: 150, // Fast snappy dodge action
      ease: 'Power2',
      onComplete: () => {
        this.isMoving = false;
        this.sprite.play('idle_down'); // Return to idle
        
        // Notify scene of our new position (to check for damage/powerup tiles)
        this.scene.events.emit('player:moved', this.col, this.row);
      }
    });
  }

  takeDamage() {
    if (this.isInvulnerable || this.hp <= 0) return;
    
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
    
    // Flash sprite continuously to show invulnerability
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
