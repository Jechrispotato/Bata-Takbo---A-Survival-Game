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
    
    this.attackCycleCount = 0;

    // Phase 4: Time Stop buff listener
    this.scene.events.on('boss:timestop', (isStopped) => {
        if (this.attackTimer) {
            this.attackTimer.paused = isStopped;
        }
    });
  }

  executeAttack() {
    this.waveCount++;
    
    // Every 4th wave, spawn the Golden Damage Tile
    if (this.waveCount % 4 === 0) {
      this.spawnDamageTile();
      return;
    }
    
    const targets = [];
    this.attackCycleCount++;

    // Boss Phase 4 Loot Logistics: Spawn a drop every 5 attacks
    if (this.attackCycleCount % 5 === 0 && this.grid.spawnChest) {
       const freeSpots = [];
       for(let r=0; r<this.grid.rows; r++) {
         for(let c=0; c<this.grid.cols; c++) {
           if (this.grid.cells[r][c].status === 'safe' &&
               (c !== this.scene.player.col || r !== this.scene.player.row)) {
               freeSpots.push({c, r});
           }
         }
       }
       if (freeSpots.length > 0) {
         const spot = Phaser.Math.RND.pick(freeSpots);
         const roll = Math.random();
         let rarity = 0; // Common Green
         if (roll > 0.9) rarity = 2; // Legendary Gold
         else if (roll > 0.7) rarity = 1; // Rare Blue
         
         this.grid.spawnChest(spot.c, spot.r, rarity);
       }
    }
    
    // Chapter 1 Specific Attack Generation
    if (this.scene.chapterId === 1) {
      const pattern = Phaser.Math.Between(0, 1); // 0 = Spot Dodging, 1 = Player Tracking
      
      if (pattern === 0) {
        // Spot Dodging: 3-4 random tiles
        const numAttacks = Phaser.Math.Between(3, 4);
        for (let i = 0; i < numAttacks; i++) {
          targets.push({
            c: Phaser.Math.Between(0, this.grid.cols - 1),
            r: Phaser.Math.Between(0, this.grid.rows - 1)
          });
        }
      } else if (pattern === 1) {
        // Player Tracking: Drops exactly on the player's current tile 
        // to force them to move continuously
        targets.push({
          c: this.scene.player.col,
          r: this.scene.player.row
        });
      }
    } else if (this.scene.chapterId === 2) {
      const pattern = Phaser.Math.Between(0, 4);
      
      if (pattern === 0) {
        // Attack 1: The X-Crush (Full Diagonals)
        for(let r=0, c=0; r < this.grid.rows; r++, c++) targets.push({c,r});
        for(let r=0, c=this.grid.cols-1; r < this.grid.rows; r++, c--) {
          if (c !== r) targets.push({c,r}); // Prevent duplicate center tile
        }
      } else if (pattern === 1) {
        // Attack 2: Boisterous Laugh (Shockwave)
        const mc = Math.floor(this.grid.cols / 2);
        const mr = Math.floor(this.grid.rows / 2);
        targets.push({c: mc, r: mr}); // Immediate center hit
        
        // Spawn the expanding shockwave 800ms later
        this.scene.time.delayedCall(800, () => {
          const waveTargets = [
            {c: mc-1, r: mr-1}, {c: mc, r: mr-1}, {c: mc+1, r: mr-1},
            {c: mc-1, r: mr},                     {c: mc+1, r: mr},
            {c: mc-1, r: mr+1}, {c: mc, r: mr+1}, {c: mc+1, r: mr+1}
          ];
          waveTargets.forEach(t => {
            this.grid.telegraph(t.c, t.r, 1500);
            this.scene.time.delayedCall(1500, () => {
              if (this.hp > 0) new Projectile(this.scene, this.grid, t.c, t.r);
            });
          });
        });
      } else if (pattern === 2) {
        // Attack 3: The Mud Pit (Geometry Shift)
        // Spawns a 3x3 mud pit at a random spot, decays after 5 seconds
        let rootC, rootR;
        
        // 50% chance to target the player directly to prevent camping
        if (Phaser.Math.Between(0, 1) === 0 && this.scene.player) {
          rootC = Phaser.Math.Clamp(this.scene.player.col, 1, this.grid.cols - 2);
          rootR = Phaser.Math.Clamp(this.scene.player.row, 1, this.grid.rows - 2);
        } else {
          rootC = Phaser.Math.Between(1, this.grid.cols - 2);
          rootR = Phaser.Math.Between(1, this.grid.rows - 2);
        }
        
        for (let x = -1; x <= 1; x++) {
          for (let y = -1; y <= 1; y++) {
            this.grid.setCellStatus(rootC + x, rootR + y, 'mud', 0x593d2b); // Brown mud
          }
        }
        this.scene.time.delayedCall(5000, () => {
          for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
              this.grid.setCellStatus(rootC + x, rootR + y, 'safe');
            }
          }
        });
      } else if (pattern === 3) {
        // Attack 4: Heavy Lockdown (Geometry Block)
        // Drops a 2x2 padlock wall that physically traps the player or reroutes them for 6 seconds
        const rootC = Phaser.Math.Between(0, this.grid.cols - 2);
        const rootR = Math.min(this.grid.rows - 2, Phaser.Math.Between(1, this.grid.rows - 2));

        for (let x = 0; x <= 1; x++) {
          for (let y = 0; y <= 1; y++) {
            this.grid.setCellStatus(rootC + x, rootR + y, 'locked', 0x222222); // Solid gray block
          }
        }
        this.scene.time.delayedCall(6000, () => {
          for (let x = 0; x <= 1; x++) {
            for (let y = 0; y <= 1; y++) {
              this.grid.setCellStatus(rootC + x, rootR + y, 'safe');
            }
          }
        });
      } else if (pattern === 4) {
        // Attack 5: The Column/Row Sweep
        // Unleashes a massive horizontal OR vertical laser beam spanning the entire grid
        const isHorizontal = Phaser.Math.Between(0, 1) === 0;
        if (isHorizontal) {
          const r = Phaser.Math.Between(0, this.grid.rows - 1);
          for (let c = 0; c < this.grid.cols; c++) targets.push({c, r});
        } else {
          const c = Phaser.Math.Between(0, this.grid.cols - 1);
          for (let r = 0; r < this.grid.rows; r++) targets.push({c, r});
        }
      }
    } else {
      // Fallback/Legacy for other chapters until implemented
      targets.push({
         c: Phaser.Math.Between(0, this.grid.cols - 1),
         r: Phaser.Math.Between(0, this.grid.rows - 1)
      });
    }
    // Tell HUDScene to play boss attack animation (texture swaps to boss_cast)
    this.scene.events.emit('boss:attack');

    // Unleash projectiles with strict Fairness Rule #4 (1.5 - 2.0 second telegraph)
    const telegraphTime = Phaser.Math.Between(1500, 2000);
    targets.forEach(t => {
      this.grid.telegraph(t.c, t.r, telegraphTime);
      this.scene.time.delayedCall(telegraphTime, () => {
        if (this.hp > 0) {
          new Projectile(this.scene, this.grid, t.c, t.r);
        }
      });
    });
  }

  spawnDamageTile() {
    // Fairness Rule #3: Spawn relatively close to player (within 2-3 tiles)
    let tC = this.scene.player.col + Phaser.Math.Between(-2, 2);
    let tR = this.scene.player.row + Phaser.Math.Between(-2, 2);

    // Keep within bounds
    tC = Phaser.Math.Clamp(tC, 0, this.grid.cols - 1);
    tR = Phaser.Math.Clamp(tR, 0, this.grid.rows - 1);

    // Ensure it doesn't spawn exactly ON the player immediately for fairness
    if (tC === this.scene.player.col && tR === this.scene.player.row) {
      tC = (tC + 1) % this.grid.cols;
    }
    
    this.grid.highlightTile(tC, tR, 0xffd700, 0.8);
    this.scene.events.emit('damageTile:spawned', tC, tR);
    
    // Gives player exactly 4 seconds to reach it
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
