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

    this.cheatMode = false; // Activated by the secret cheat code
    this.startAttackLoop();
  }

  startAttackLoop() {
    this.attackCycleCount = 0;
    this.lastAttackId = -1;

    // Explicit 3-second startup breather before the very first shot
    this.attackTimer = this.scene.time.delayedCall(3000, this.executeAttack, [], this);

    // Phase 4: Time Stop buff listener
    this.scene.events.on('boss:timestop', (isStopped) => {
      if (this.attackTimer) {
        this.attackTimer.paused = isStopped;
      }
    });
  }

  executeAttack() {
    this.waveCount++;

    // --- CHEAT MODE: boss sleeps, double loot rains ---
    if (this.cheatMode) {
      this._executeCheatWave();
      return;
    }

    let currentAttackDuration = 2000; // Baseline fallback

    // Every 4th wave, spawn the Golden Damage Tile
    if (this.waveCount % 4 === 0) {
      this.spawnDamageTile();
      currentAttackDuration = 4000;
    } else {
      const targets = [];
      this.attackCycleCount++;

      // Boss Phase 4 Loot Logistics: Spawn a drop every 5 attacks
      if (this.attackCycleCount % 5 === 0 && this.grid.spawnChest) {
        const gt = this.scene.goldenTile; // active attack tile position
        const freeSpots = [];
        for (let r = 0; r < this.grid.rows; r++) {
          for (let c = 0; c < this.grid.cols; c++) {
            if (this.grid.cells[r][c].status === 'safe' &&
              (c !== this.scene.player.col || r !== this.scene.player.row) &&
              !(gt && gt.col === c && gt.row === r) &&
              !this.grid.hasChestAt(c, r)) {
              freeSpots.push({ c, r });
            }
          }
        }
        if (freeSpots.length > 0) {
          const spot = Phaser.Math.RND.pick(freeSpots);
          const roll = Math.random();

          if (roll > 0.85) {
            this.grid.spawnRuby(spot.c, spot.r);
          } else if (roll > 0.70) {
            this.grid.spawnDiamond(spot.c, spot.r);
          } else {
            let rarity = 0; // Common Green
            if (roll > 0.50) rarity = 8; // Cursed skull chest
            else if (roll > 0.40) rarity = 2; // Legendary Gold
            else if (roll > 0.20) rarity = 1; // Rare Blue

            this.grid.spawnChest(spot.c, spot.r, rarity);
          }
        }
      }

      // Chapter 1 Specific Attack Routing
      if (this.scene.chapterId === 1) {
        this.scene.events.emit('boss:attack');

        // Fairness Rule #5: Pure randomization WITH History Blocking (Anti-Repeat Logic)
        let patternId;
        do {
          patternId = Phaser.Math.Between(0, 2);
        } while (patternId === this.lastAttackId);
        this.lastAttackId = patternId;

        if (patternId === 0) currentAttackDuration = this.ch1AttackCrimsonSplatter();
        else if (patternId === 1) currentAttackDuration = this.ch1AttackBleedingEye();
        else currentAttackDuration = this.ch1AttackBloodVolley();

      } else if (this.scene.chapterId === 2) {
        // Retain fairness anti-repeat block here too
        let pattern;
        do {
          pattern = Phaser.Math.Between(0, 4);
        } while (pattern === this.lastAttackId);
        this.lastAttackId = pattern;

        if (pattern === 0) {
          // Attack 1: The X-Crush (Full Diagonals)
          for (let r = 0, c = 0; r < this.grid.rows; r++, c++) targets.push({ c, r });
          for (let r = 0, c = this.grid.cols - 1; r < this.grid.rows; r++, c--) {
            if (c !== r) targets.push({ c, r }); // Prevent duplicate center tile
          }
        } else if (pattern === 1) {
          // Attack 2: Boisterous Laugh (Shockwave)
          const mc = Math.floor(this.grid.cols / 2);
          const mr = Math.floor(this.grid.rows / 2);
          targets.push({ c: mc, r: mr }); // Immediate center hit

          // Spawn the expanding shockwave 800ms later
          this.scene.time.delayedCall(800, () => {
            const waveTargets = [
              { c: mc - 1, r: mr - 1 }, { c: mc, r: mr - 1 }, { c: mc + 1, r: mr - 1 },
              { c: mc - 1, r: mr }, { c: mc + 1, r: mr },
              { c: mc - 1, r: mr + 1 }, { c: mc, r: mr + 1 }, { c: mc + 1, r: mr + 1 }
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
            for (let c = 0; c < this.grid.cols; c++) targets.push({ c, r });
          } else {
            const c = Phaser.Math.Between(0, this.grid.cols - 1);
            for (let r = 0; r < this.grid.rows; r++) targets.push({ c, r });
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
      if (this.scene.chapterId !== 1) this.scene.events.emit('boss:attack');

      // Unleash generic projectiles with strict Fairness Rule (legacy format)
      const telegraphTime = Phaser.Math.Between(1500, 2000);
      currentAttackDuration = telegraphTime + 500; // Track the legacy duration logic

      targets.forEach(t => {
        this.grid.telegraph(t.c, t.r, telegraphTime);
        this.scene.time.delayedCall(telegraphTime, () => {
          if (this.hp > 0) {
            new Projectile(this.scene, this.grid, t.c, t.r);
          }
        });
      });
    }

    // Dynamic Cascading Pause Scheduler setup
    // This strictly ensures the game rests for precisely 3.0 seconds AFTER the active attack phase completely clears!
    if (this.hp > 0) {
      if (this.attackTimer) this.attackTimer.remove(); // Safely clear old references
      this.attackTimer = this.scene.time.delayedCall(currentAttackDuration + 3000, this.executeAttack, [], this);
    }
  }

  // ── Cheat wave: no attacks, doubled loot ───────────────────────────
  _executeCheatWave() {
    this.attackCycleCount++;
    let duration = 2000;

    // Spawn golden attack tile every 2 waves (double the normal rate)
    // On the bonus run, spawn a second tile 600ms later for true doubling
    if (this.waveCount % 2 === 0) {
      this.spawnDamageTile();
      this.scene.time.delayedCall(600, () => {
        if (this.hp > 0) this.spawnDamageTile();
      });
      duration = 3500;
    }

    // Spawn 2 chests every 2 cycles instead of 1 chest every 5
    if (this.attackCycleCount % 2 === 0 && this.grid.spawnChest) {
      const gt = this.scene.goldenTile;
      const freeSpots = [];
      for (let r = 0; r < this.grid.rows; r++) {
        for (let c = 0; c < this.grid.cols; c++) {
          if (this.grid.cells[r][c].status === 'safe' &&
            (c !== this.scene.player.col || r !== this.scene.player.row) &&
            !(gt && gt.col === c && gt.row === r) &&
            !this.grid.hasChestAt(c, r)) {
            freeSpots.push({ c, r });
          }
        }
      }
      // Spawn up to 2 chests from random free spots
      for (let i = 0; i < 2 && freeSpots.length > 0; i++) {
        const idx = Phaser.Math.Between(0, freeSpots.length - 1);
        const spot = freeSpots.splice(idx, 1)[0];
        const roll = Math.random();

        if (roll > 0.85) {
          this.grid.spawnRuby(spot.c, spot.r);
        } else if (roll > 0.70) {
          this.grid.spawnDiamond(spot.c, spot.r);
        } else {
          let rarity = 0;
          if (roll > 0.50) rarity = 8; // Cursed chest
          else if (roll > 0.40) rarity = 2;
          else if (roll > 0.20) rarity = 1;
          this.grid.spawnChest(spot.c, spot.r, rarity);
        }
      }
    }

    // Schedule next cheat wave (faster cycle — 1s breather)
    if (this.hp > 0) {
      if (this.attackTimer) this.attackTimer.remove();
      this.attackTimer = this.scene.time.delayedCall(duration + 1000, this.executeAttack, [], this);
    }
  }

  // ================= CHAPTER 1 BLOOD MECHANICS =================

  ch1AttackCrimsonSplatter() {
    const numAttacks = Phaser.Math.Between(3, 4);
    for (let i = 0; i < numAttacks; i++) {
      const c = Phaser.Math.Between(0, this.grid.cols - 1);
      const r = Phaser.Math.Between(0, this.grid.rows - 1);
      this.grid.telegraph(c, r, 1500);

      this.scene.time.delayedCall(1500, () => {
        const dest = this.grid.getPixelPosition(c, r);
        const startY = dest.y - 450; // Drop from sky high

        // Force angle downwards naturally, scale up the 16px beam to be 6x larger
        const blood = this.scene.add.sprite(dest.x, startY, 'blood_chem', 6);
        blood.setDisplaySize(80, 20).setRotation(Math.PI / 2).setDepth(30);

        this.scene.tweens.add({
          targets: blood, y: dest.y, duration: 400, ease: 'Power2',
          onComplete: () => {
            blood.destroy();
            // Scale up the 32px splat to 5x
            const splat = this.scene.add.sprite(dest.x, dest.y, 'blood_splat_000').setScale(5.0).setDepth(20);
            splat.play('anim_blood_splat').once('animationcomplete', () => splat.destroy());

            // Native Area Damage Check
            if (this.scene.player.col === c && this.scene.player.row === r) {
              this.scene.player.takeDamage();
            }
          }
        });
      });
    }
    // Execution duration is precisely 1500ms warning + 400ms physical impact
    return 1900;
  }

  ch1AttackBleedingEye() {
    // Lock onto player immediately but do not adjust!
    const c = this.scene.player.col;
    const r = this.scene.player.row;
    this.grid.telegraph(c, r, 1500);

    // Spawn eye off-screen
    const fromLeft = Math.random() > 0.5;
    const startX = fromLeft ? -50 : this.scene.scale.width + 50;
    const startY = -100;

    // Eye is 2500x2500 native. Dialed up to 0.06
    const eye = this.scene.add.sprite(startX, startY, 'ch1_eye').setScale(1.5).setDepth(40);
    eye.play('anim_ch1_eye');
    // If it comes from the left, flip it horizontally! The asset natively faces left.
    if (fromLeft) {
      eye.setFlipX(true);
    }

    const dest = this.grid.getPixelPosition(c, r);

    // Animate to target over 1.5s warning period (giving the dripping trail time to render continuously)
    this.scene.tweens.add({
      targets: eye, x: dest.x, y: dest.y, duration: 1500, ease: 'Cubic.easeIn',
      onComplete: () => {
        eye.destroy();
        // Eye explosion FX
        const splat = this.scene.add.sprite(dest.x, dest.y, 'eye_explosion').setScale(2.0).setDepth(22);
        splat.play('anim_eye_explosion').once('animationcomplete', () => splat.destroy());
        // Exact Area Damage Check
        if (this.scene.player.col === c && this.scene.player.row === r) {
          this.scene.player.takeDamage();
        }
      }
    });

    // Dripping Trail loop - stamps a dark frame every 50 ms in its wake
    const dripCount = Math.floor(1500 / 50);
    const dripTimer = this.scene.time.addEvent({
      delay: 50, repeat: dripCount - 1,
      callback: () => {
        // Dark blood is 16px native. Scale up 7x for a wide, heavy trail
        const drip = this.scene.add.sprite(eye.x, eye.y, 'dark_blood_0').setScale(7.0).setDepth(35);
        drip.play('anim_dark_blood');
        this.scene.tweens.add({
          targets: drip, alpha: 0, scale: 2.0, y: drip.y + 60, duration: 800, onComplete: () => drip.destroy()
        });
      }
    });

    // Execution physically takes 1500ms to arrive directly at the target, and splat clears itself organically
    return 1500;
  }

  ch1AttackBloodVolley() {
    // Rhythm Combo: 3 to 5 rapid burst beats
    const numShots = Phaser.Math.Between(3, 5);
    let sequenceDelay = 0;

    for (let i = 0; i < numShots; i++) {
      this.scene.time.delayedCall(sequenceDelay, () => {
        const roll = Math.random();
        let handImg = 'ch1_hand1';
        let startLoc = { x: 0, y: 0 };

        // Recompute target on the player at the start of each individual beat to force them to react constantly
        const targetCol = Phaser.Math.Clamp(this.scene.player.col, 0, this.grid.cols - 1);
        const targetRow = Phaser.Math.Clamp(this.scene.player.row, 0, this.grid.rows - 1);
        const dest = this.grid.getPixelPosition(targetCol, targetRow);

        let scaleOverride = 1.0;

        // Tether spawns VISIBLY ON the border of the physical grid so it plays nice with tight camera zooms.
        const gridRight = this.grid.offsetX + (this.grid.cols * this.grid.tileSize);
        const gridTop = this.grid.offsetY;
        const gridBottom = this.grid.offsetY + (this.grid.rows * this.grid.tileSize);

        if (roll < 0.33) {
          handImg = 'ch1_hand1'; // Native: 1080x1663 -> Scale down heavily
          startLoc = { x: dest.x, y: gridBottom - 10 }; // Just barely hugging the bottom tile line
          scaleOverride = 0.09;
        } else if (roll < 0.66) {
          handImg = 'ch1_hand2'; // Native: 344x240 -> Mid scale
          startLoc = { x: gridRight - 40, y: gridTop + 20 }; // Pushed significantly IN to the grid top-right
          scaleOverride = 0.35;
        } else {
          handImg = 'ch1_hand3'; // Native: 181x322 -> Less scaled down
          startLoc = { x: gridRight - 40, y: gridBottom - 40 }; // Pushed significantly IN to the grid bottom-right
          scaleOverride = 0.5;
        }

        // Hand flashes into view
        const hand = this.scene.add.sprite(startLoc.x, startLoc.y, handImg).setScale(scaleOverride).setDepth(50);

        // Calculate angle once to point hand toward target
        const targetAngle = Math.atan2(dest.y - startLoc.y, dest.x - startLoc.x);

        // Adjust base rotations so fingers point correctly
        // ch1_hand1 points UP by default ( -Math.PI/2 )
        // ch1_hand2 faces top-right
        // ch1_hand3 faces bottom-right
        if (handImg === 'ch1_hand1') hand.setRotation(targetAngle + Math.PI / 2);
        else hand.setRotation(targetAngle);

        this.grid.telegraph(targetCol, targetRow, 1000);

        this.scene.time.delayedCall(1000, () => {
          hand.destroy();
          const blood = this.scene.add.sprite(startLoc.x, startLoc.y, 'blood_chem', 6).setDisplaySize(80, 20).setDepth(45);

          // Calculates precise geometry projection angle to face the target exactly
          const angle = Math.atan2(dest.y - startLoc.y, dest.x - startLoc.x);
          blood.setRotation(angle);

          // Blood trail: stamp blood_chem images along the path
          const trailTimer = this.scene.time.addEvent({
            delay: 30, repeat: Math.floor(200 / 30) - 1,
            callback: () => {
              if (!blood || !blood.active) return;
              const trail = this.scene.add.sprite(blood.x, blood.y, 'blood_chem', 6)
                .setDisplaySize(60, 15).setDepth(40).setAlpha(0.7).setRotation(angle);
              this.scene.tweens.add({ targets: trail, alpha: 0, scale: 0.02, duration: 300, onComplete: () => trail.destroy() });
            }
          });

          // High-speed beam connection
          this.scene.tweens.add({
            targets: blood, x: dest.x, y: dest.y, duration: 200,
            onComplete: () => {
              blood.destroy();
              trailTimer.remove();
              const splat = this.scene.add.sprite(dest.x, dest.y, 'blood_splat_000').setScale(5.0).setDepth(20);
              splat.play('anim_blood_splat').once('animationcomplete', () => splat.destroy());

              if (this.scene.player.col === targetCol && this.scene.player.row === targetRow) {
                this.scene.player.takeDamage();
              }
            }
          });
        });
      });
      sequenceDelay += 1300; // Perfect Rhythm interval space
    }
    // Execution physically encompasses the staggered looping timing until the final beam lands
    return (numShots - 1) * 1300 + 1200;
  }

  spawnDamageTile() {
    // Fairness Rule #3: Spawn relatively close to player (within 2-3 tiles)
    // Retry up to 10 times to avoid landing on a cell that already has a chest
    let tC, tR;
    let attempts = 0;
    do {
      tC = Phaser.Math.Clamp(
        this.scene.player.col + Phaser.Math.Between(-2, 2),
        0, this.grid.cols - 1
      );
      tR = Phaser.Math.Clamp(
        this.scene.player.row + Phaser.Math.Between(-2, 2),
        0, this.grid.rows - 1
      );
      attempts++;
    } while (
      attempts < 10 &&
      ((tC === this.scene.player.col && tR === this.scene.player.row) ||
        this.grid.hasChestAt(tC, tR))
    );

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

  heal(amount = 1) {
    if (this.hp <= 0) return; // Don't heal if dead
    this.hp = Math.min(this.maxHp, this.hp + amount);
    this.scene.events.emit('boss:damaged', this.hp, this.maxHp);
  }

  die() {
    if (this.attackTimer) this.attackTimer.remove();
    console.log("BOSS DEFEATED");
    this.scene.events.emit('boss:died');
  }
}
