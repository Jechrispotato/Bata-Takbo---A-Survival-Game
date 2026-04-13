import * as Phaser from 'phaser';
import { Projectile } from './Projectile.js';

export class Boss {
  /**
   * @param {Phaser.Scene} scene 
   * @param {import('./Grid.js').Grid} grid 
   */
  constructor(scene, grid) {
    this.scene = scene;
    this.grid = grid;
    
    this.hp = 5;
    this.maxHp = 5;
    this.waveCount = 0;

    // Boss sprite is rendered by HUDScene (since HUD covers the left panel).
    // Projectiles originate from the top-center of the grid area.
    const gridCenterX = grid.offsetX + (grid.tileSize * grid.cols) / 2;
    this.projectileOriginX = gridCenterX;
    this.projectileOriginY = grid.offsetY - 30;

    this.startAttackLoop();
  }

  startAttackLoop() {
    this.attackTimer = this.scene.time.addEvent({
      delay: 3500,
      callback: this.executeAttack,
      callbackScope: this,
      loop: true
    });
  }

  executeAttack() {
    this.waveCount++;
    
    // Every 4th wave, spawn the Golden Damage Tile
    if (this.waveCount % 4 === 0) {
      this.spawnDamageTile();
      return;
    }
    
    const pattern = Phaser.Math.Between(0, 3);
    const targets = [];
    
    if (pattern === 0) {
      // Scatter Shot: 2-4 random tiles
      const numAttacks = Phaser.Math.Between(2, 4);
      for (let i = 0; i < numAttacks; i++) {
        targets.push({
          c: Phaser.Math.Between(0, this.grid.cols - 1),
          r: Phaser.Math.Between(0, this.grid.rows - 1)
        });
      }
    } else if (pattern === 1) {
      // Drop Column
      const col = Phaser.Math.Between(0, this.grid.cols - 1);
      for (let r = 0; r < this.grid.rows; r += 2) {
        targets.push({ c: col, r });
      }
    } else if (pattern === 2) {
      // Sweep Row
      const row = Phaser.Math.Between(0, this.grid.rows - 1);
      for (let c = 0; c < this.grid.cols; c += 2) {
        targets.push({ c, r: row });
      }
    } else if (pattern === 3) {
      // Center Blast
      const mc = Math.floor(this.grid.cols / 2);
      const mr = Math.floor(this.grid.rows / 2);
      targets.push(
        { c: mc, r: mr }, { c: mc - 1, r: mr }, { c: mc + 1, r: mr },
        { c: mc, r: mr - 1 }, { c: mc, r: mr + 1 }
      );
    }

    // Tell HUDScene to play boss attack animation
    this.scene.events.emit('boss:attack');

    // Unleash projectiles
    targets.forEach(t => {
      this.grid.telegraph(t.c, t.r, 1500);
      this.scene.time.delayedCall(1500, () => {
        if (this.hp > 0) {
          new Projectile(this.scene, this.grid, this.projectileOriginX, this.projectileOriginY, t.c, t.r);
        }
      });
    });
  }

  spawnDamageTile() {
    const tC = Phaser.Math.Between(0, this.grid.cols - 1);
    const tR = Phaser.Math.Between(3, this.grid.rows - 1);
    
    this.grid.highlightTile(tC, tR, 0xffd700, 0.8);
    this.scene.events.emit('damageTile:spawned', tC, tR);
    
    this.scene.time.delayedCall(4000, () => {
      this.scene.events.emit('damageTile:despawned', tC, tR);
      this.grid.render();
    });
  }

  takeDamage() {
    this.hp--;
    this.scene.cameras.main.shake(200, 0.02);
    this.scene.events.emit('boss:damaged', this.hp, this.maxHp);

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    if (this.attackTimer) this.attackTimer.remove();
    console.log("BOSS DEFEATED");
    this.scene.events.emit('boss:died');
  }
}
