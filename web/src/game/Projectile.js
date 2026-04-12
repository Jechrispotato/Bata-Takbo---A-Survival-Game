import * as Phaser from 'phaser';

export class Projectile {
  constructor(scene, grid, startX, startY, targetCol, targetRow) {
    this.scene = scene;
    this.grid = grid;
    this.targetCol = targetCol;
    this.targetRow = targetRow;

    // The pixel center of the target tile
    const targetPos = this.grid.getPixelPosition(targetCol, targetRow);

    // Pick a random projectile key
    const types = ['projectile_1', 'projectile_2', 'projectile_3'];
    const chosen = types[Phaser.Math.Between(0, 2)];

    this.sprite = scene.add.sprite(startX, startY, chosen);
    this.sprite.setScale(0.6);

    // Arc motion setup
    // Animate X linearly
    scene.tweens.add({
      targets: this.sprite,
      x: targetPos.x,
      duration: 600,
      ease: 'Linear'
    });

    // Animate Y with a bounce/arc
    scene.tweens.add({
      targets: this.sprite,
      y: targetPos.y,
      duration: 600,
      ease: 'Sine.easeIn',
      onComplete: () => {
        this.land();
      }
    });

    // Add some spin
    scene.tweens.add({
      targets: this.sprite,
      angle: 360,
      duration: 400,
      repeat: -1
    });
  }

  land() {
    // Flash impact visual on the grid using Sparks pixel art
    const targetPos = this.grid.getPixelPosition(this.targetCol, this.targetRow);
    const impact = this.scene.add.sprite(targetPos.x, targetPos.y, 'fx_damage');
    // Random rotation for variety
    impact.setAngle(Phaser.Math.Between(0, 360));
    impact.setScale(1.5);
    
    // Create animation on the fly if it doesn't exist
    if (!this.scene.anims.exists('spark_anim')) {
      this.scene.anims.create({
        key: 'spark_anim',
        frames: this.scene.anims.generateFrameNumbers('fx_damage', { start: 0, end: 5 }), // guessing length, safe fallback
        frameRate: 20,
        repeat: 0
      });
    }

    impact.play('spark_anim');
    impact.on('animationcomplete', () => {
      impact.destroy();
    });

    // Notify GameScene to check for player collision
    this.scene.events.emit('projectile:landed', this.targetCol, this.targetRow);

    // Remove projectile
    this.sprite.destroy();
  }
}
