import * as Phaser from 'phaser';
import { Projectile } from './Projectile.js';
import { state } from '../utils/StateManager.js';

export class Boss {
  /**
   * @param {Phaser.Scene} scene 
   * @param {import('./Grid.js').Grid} grid 
   */
  constructor(scene, grid) {
    this.scene = scene;
    this.grid = grid;
    if (scene.chapterId === 1) {
      this.maxHp = 5;
    } else if (scene.chapterId === 2) {
      this.maxHp = 8;
    } else if (scene.chapterId === 3) {
      this.maxHp = 10;
    } else {
      this.maxHp = 5; // Default fallback
    }
    this.hp = this.maxHp;
    this.lastAttackId = -1;
    this.secondLastAttackId = -1; // Track two back to prevent problematic pairs
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
        this.scene.events.emit('boss:attack');

        // 7 unique attack patterns with anti-repeat and anti-pair logic
        // Beeswarm (0) and Hibiscus (1) must NEVER be consecutive in either order
        const BEESWARM = 0, HIBISCUS = 1;
        let pattern;
        let safetyCounter = 0;
        do {
          pattern = Phaser.Math.Between(0, 6);
          safetyCounter++;
          // Block: same as last, OR beeswarm↔hibiscus adjacent pair
          const isBadPair = (pattern === BEESWARM && this.lastAttackId === HIBISCUS) ||
                            (pattern === HIBISCUS && this.lastAttackId === BEESWARM);
        } while (safetyCounter < 20 && (pattern === this.lastAttackId || 
          ((pattern === BEESWARM && this.lastAttackId === HIBISCUS) ||
           (pattern === HIBISCUS && this.lastAttackId === BEESWARM))));
        
        this.secondLastAttackId = this.lastAttackId;
        this.lastAttackId = pattern;

        if (pattern === 0) currentAttackDuration = this.ch2AttackBeeswarm();
        else if (pattern === 1) currentAttackDuration = this.ch2AttackHibiscus();
        else if (pattern === 2) currentAttackDuration = this.ch2AttackVines();
        else if (pattern === 3) currentAttackDuration = this.ch2AttackCarrotRain();
        else if (pattern === 4) currentAttackDuration = this.ch2AttackExplodingEggs();
        else if (pattern === 5) currentAttackDuration = this.ch2AttackSnappingFlora();
        else currentAttackDuration = this.ch2AttackAcidSpitter();
      } else {
        // Fallback/Legacy for other chapters until implemented
        targets.push({
          c: Phaser.Math.Between(0, this.grid.cols - 1),
          r: Phaser.Math.Between(0, this.grid.rows - 1)
        });
      }
      // Tell HUDScene to play boss attack animation (for chapters that use generic projectiles)
      if (this.scene.chapterId !== 1 && this.scene.chapterId !== 2) this.scene.events.emit('boss:attack');

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

  /** Linger damage check over an area to punish players who walk into active effect sprites */
  createDamageZone(tiles, duration) {
    this.scene.time.addEvent({
      delay: 100,
      repeat: Math.floor(duration / 100) - 1,
      callback: () => {
        if (this.scene.isGameOver) return;
        const p = this.scene.player;
        if (tiles.some(t => t.c === p.col && t.r === p.row)) {
          p.takeDamage();
        }
      }
    });
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
    // The asset natively faces right, so flip it if it comes from the right
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

  // ================= CHAPTER 2: BUNGISNGIS MECHANICS =================

  /** Attack 1: The Beeswarm — Diagonal Sweep */
  ch2AttackBeeswarm() {
    // X pattern: Both TL->BR and TR->BL simultaneously, 3 tiles thick
    const tiles1 = [];
    const tiles2 = [];
    // Pre-compute which tiles each row occupies for precise per-tile damage windows
    const tilesByRow1 = {}; // row -> [{c,r}]
    const tilesByRow2 = {};
    for (let c = 0; c < this.grid.cols; c++) {
      for (let r = 0; r < this.grid.rows; r++) {
        if (Math.abs(r - c) <= 1) {
          tiles1.push({ c, r });
          if (!tilesByRow1[r]) tilesByRow1[r] = [];
          tilesByRow1[r].push({ c, r });
        }
        if (Math.abs(r - (this.grid.cols - 1 - c)) <= 1) {
          tiles2.push({ c, r });
          if (!tilesByRow2[r]) tilesByRow2[r] = [];
          tilesByRow2[r].push({ c, r });
        }
      }
    }

    // Telegraph both thick diagonals
    tiles1.forEach(t => this.grid.telegraph(t.c, t.r, 1500));
    tiles2.forEach(t => this.grid.telegraph(t.c, t.r, 1500));

    // After warning, sweep the beeswarm sprites across
    this.scene.time.delayedCall(1500, () => {
      if (this.hp <= 0) return;

      const scale = this.grid.tileSize * 1.8;

      const spawnSwarmLine = (baseStart, baseEnd, isFlip) => {
        const s = this.grid.getPixelPosition(baseStart.c, baseStart.r);
        const e = this.grid.getPixelPosition(baseEnd.c, baseEnd.r);
        
        // Push start/end well off-screen
        const dx = e.x - s.x;
        const dy = e.y - s.y;
        const startOffX = s.x - dx * 0.5;
        const startOffY = s.y - dy * 0.5;
        const endOffX = e.x + dx * 0.5;
        const endOffY = e.y + dy * 0.5;

        // Vector math for perpendicular spreading
        const perpX = -dy; 
        const perpY = dx;
        const mag = Math.sqrt(perpX*perpX + perpY*perpY);
        const pNormX = perpX / mag;
        const pNormY = perpY / mag;

        // Spawn TRULY many bees (Volume increased to 60 per path for a dense cloud)
        for (let i = 0; i < 60; i++) {
          const spread = Phaser.Math.Between(-200, 200); // Wide coverage for the 3-tile path
          const longitudinalOffset = Phaser.Math.Between(-400, 400); // Varied start times for depth
          
          const beeScale = scale * Phaser.Math.FloatBetween(0.5, 1.1);
          const startX = startOffX + (pNormX * spread) + ( (dx/mag) * longitudinalOffset );
          const startY = startOffY + (pNormY * spread) + ( (dy/mag) * longitudinalOffset );
          
          const bee = this.scene.add.sprite(startX, startY, 'ch2_beeswarm')
            .setDisplaySize(beeScale, beeScale).setDepth(50 + i).setFlipX(isFlip);
            
          // Varied tint/alpha for depth perception
          bee.setTint(i % 4 === 0 ? 0xbbbbbb : (i % 3 === 0 ? 0xdddddd : 0xffffff));
          bee.setAlpha(Phaser.Math.FloatBetween(0.8, 1.0));
            
          bee.play('anim_ch2_beeswarm_in').once('animationcomplete', () => bee.play('anim_ch2_beeswarm_loop'));

          this.scene.tweens.add({
            targets: bee,
            x: endOffX + (startX - startOffX),
            y: endOffY + (startY - startOffY),
            duration: 3500 + Phaser.Math.Between(-500, 500), 
            ease: 'Linear',
            onComplete: () => {
              if (bee.active) {
                bee.play('anim_ch2_beeswarm_out').once('animationcomplete', () => bee.destroy());
              }
            }
          });
        }
      }

      spawnSwarmLine({c: 0, r: 0}, {c: this.grid.cols-1, r: this.grid.rows-1}, false);
      spawnSwarmLine({c: this.grid.cols-1, r: 0}, {c: 0, r: this.grid.rows-1}, true);

      // Per-tile damage windows: only deal damage while bees are ACTIVELY on that row
      // Total travel = ~3500ms. Each row gets a narrow window (~420ms) while bees pass.
      const totalTravel = 3500;
      const rowWindow = totalTravel / this.grid.rows;
      const offscreen = totalTravel * 0.15; // Bees start slightly offscreen

      for (let r = 0; r < this.grid.rows; r++) {
        const rowStart = offscreen + r * rowWindow;
        this.scene.time.delayedCall(rowStart, () => {
          if (this.hp <= 0) return;
          // Active damage for only the rowWindow duration (bees are crossing this row)
          const rowTiles = [...(tilesByRow1[r] || []), ...(tilesByRow2[r] || [])];
          this.createDamageZone(rowTiles, rowWindow);
        });
      }
    });

    return 3000;
  }

  /** Attack 2: Hibiscus Pollen Burst — Concentric Rings Sequence */
  ch2AttackHibiscus() {
    const mc = Math.floor(this.grid.cols / 2);
    const mr = Math.floor(this.grid.rows / 2);
    const centerPos = this.grid.getPixelPosition(mc, mr);

    // Telegraph center
    this.grid.telegraph(mc, mr, 800);

    // SCALE: Hibiscus landing sprite — change tileSize multiplier to resize
    const hibiscusScale = this.grid.tileSize * 2.0;
    const hibiscus = this.scene.add.sprite(centerPos.x, centerPos.y - 200, 'ch2_hibiscus')
      .setDisplaySize(hibiscusScale, hibiscusScale)
      .setDepth(35)
      .setAlpha(0);

    // Drop the hibiscus onto the center tile
    this.scene.tweens.add({
      targets: hibiscus,
      y: centerPos.y, alpha: 1,
      duration: 800, ease: 'Bounce.easeOut',
      onComplete: () => {
        hibiscus.play('anim_ch2_hibiscus');
        
        // Delay before beginning the burst sequence
        this.scene.time.delayedCall(1200, () => {
          if (this.hp <= 0) return;

          // Visual wobble for anticipation
          this.scene.tweens.add({
            targets: hibiscus,
            scaleX: hibiscusScale * 1.15,
            scaleY: hibiscusScale * 0.85,
            duration: 100,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
              if (this.hp <= 0) return;
              
              const burstScale = this.grid.tileSize * 1.5;

              // Sequence 0: burst Center tile
              const b = this.scene.add.sprite(centerPos.x, centerPos.y, 'ch2_hibiscus_burst')
                .setDisplaySize(burstScale, burstScale).setDepth(36);
              b.play('anim_ch2_hibiscus_burst');
              b.once('animationcomplete', () => b.destroy());
              this.createDamageZone([{c: mc, r: mr}], 1500);

              // Destroy plant with a nice fade-out so it doesn't just vanish
              this.scene.tweens.add({
                targets: hibiscus, alpha: 0, scale: hibiscus.scale * 1.5,
                duration: 600, onComplete: () => hibiscus.destroy()
              });

              // True chain reaction: each ring only fires AFTER previous ring's animation ends
              const maxDist = Math.max(mc, this.grid.cols - 1 - mc, mr, this.grid.rows - 1 - mr);
              
              const fireRing = (d) => {
                if (d > maxDist || this.hp <= 0) return;
                
                const ringTiles = [];
                for (let c = 0; c < this.grid.cols; c++) {
                  for (let r = 0; r < this.grid.rows; r++) {
                    if (Math.max(Math.abs(c - mc), Math.abs(r - mr)) === d) ringTiles.push({ c, r });
                  }
                }

                // Telegraph this ring
                ringTiles.forEach(t => this.grid.telegraph(t.c, t.r, 500));

                this.scene.time.delayedCall(500, () => {
                  if (this.hp <= 0) return;

                  let animsComplete = 0;
                  ringTiles.forEach(t => {
                    const dest = this.grid.getPixelPosition(t.c, t.r);
                    const ringBurst = this.scene.add.sprite(dest.x, dest.y, 'ch2_hibiscus_burst')
                      .setDisplaySize(burstScale, burstScale).setDepth(36);
                    ringBurst.play('anim_ch2_hibiscus_burst');
                    ringBurst.once('animationcomplete', () => {
                      ringBurst.destroy();
                      animsComplete++;
                      // When ALL tiles in this ring finish animating, fire the next ring
                      if (animsComplete >= ringTiles.length) {
                        fireRing(d + 1);
                      }
                    });
                  });

                  // Damage only while animation is playing
                  this.createDamageZone(ringTiles, 1800);
                });
              };

              fireRing(1);
            }
          });
        });
      }
    });

    return 6000; // Generous duration to allow full chain to complete
  }

  /** Attack 3: Strangling Vines — Immobilization + Gesture QTE */
  ch2AttackVines() {
    const pCol = this.scene.player.col;
    const pRow = this.scene.player.row;

    // Telegraph a 3x3 area centered on player
    const vineTiles = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const c = Phaser.Math.Clamp(pCol + dx, 0, this.grid.cols - 1);
        const r = Phaser.Math.Clamp(pRow + dy, 0, this.grid.rows - 1);
        vineTiles.push({ c, r });
        this.grid.telegraph(c, r, 1200);
      }
    }

    // After warning, spawn vines and check if player is caught
    this.scene.time.delayedCall(1200, () => {
      if (this.hp <= 0 || this.scene.isGameOver) return;

      // Spawn vine animations on EVERY tile in the 3x3 regardless of escape
      const vineSprites = [];
      const vineScale = this.grid.tileSize * 1.6;
      vineTiles.forEach(t => {
        const dest = this.grid.getPixelPosition(t.c, t.r);
        const vine = this.scene.add.sprite(dest.x, dest.y, 'ch2_vines')
          .setDisplaySize(vineScale, vineScale) // 1 to 1 instead of 1.2 height
          .setDepth(25);
        vine.play('anim_ch2_vines_grow');
        vine.once('animationcomplete', () => vine.play('anim_ch2_vines_idle'));
        vineSprites.push(vine);
      });

      // Check if player is ACTUALLY in the zone to be frozen
      const caught = vineTiles.some(t => t.c === this.scene.player.col && t.r === this.scene.player.row);
      if (!caught) {
        // Player escaped! Just let the vines despawn automatically after 2s
        this.scene.time.delayedCall(2000, () => {
          vineSprites.forEach(v => {
            v.play('anim_ch2_vines_shrink');
            v.once('animationcomplete', () => v.destroy());
          });
        });
        return; 
      }

      // Freeze the player
      this.scene.player.isFrozen = true;
      this.scene.player.sprite.setTint(0x44aa44);
      const playerPos = this.grid.getPixelPosition(this.scene.player.col, this.scene.player.row);



      // QTE: Show 3 random arrow prompts
      const directions = ['up', 'down', 'left', 'right'];
      const arrows = { up: '⬆', down: '⬇', left: '⬅', right: '➡' };
      const sequence = [];
      for (let i = 0; i < 3; i++) sequence.push(Phaser.Math.RND.pick(directions));

      let qteIndex = 0;
      const qteTexts = [];

      // Render all 3 arrows above the player
      for (let i = 0; i < 3; i++) {
        const txt = this.scene.add.text(
          playerPos.x - 40 + i * 40, playerPos.y - 70,
          arrows[sequence[i]],
          { fontFamily: 'VCR', fontSize: '28px', color: i === 0 ? '#ffff00' : '#888888', stroke: '#000', strokeThickness: 4 }
        ).setOrigin(0.5).setDepth(600);
        qteTexts.push(txt);
      }

      const titleTxt = this.scene.add.text(playerPos.x, playerPos.y - 100, 'BREAK FREE!', {
        fontFamily: 'GigaSaturn', fontSize: '16px', color: '#ff4444', stroke: '#000', strokeThickness: 4
      }).setOrigin(0.5).setDepth(600);

      // Listen for correct gestures
      const onGesture = (direction) => {
        if (this.scene.isGameOver || qteIndex >= 3) return;
        if (direction.toLowerCase() === sequence[qteIndex]) {
          // Correct! Highlight completed arrow green
          qteTexts[qteIndex].setColor('#00ff00');
          qteIndex++;
          if (qteIndex < 3) {
            qteTexts[qteIndex].setColor('#ffff00'); // Highlight next
          }
          if (qteIndex >= 3) {
            // QTE complete! Free the player
            cleanupQte(true);
          }
        }
      };

      const cleanupQte = (escaped) => {
        // Unsub gesture
        if (this.scene._vineQteUnsub) {
          this.scene._vineQteUnsub();
          this.scene._vineQteUnsub = null;
        }
        // Remove arrows
        qteTexts.forEach(t => t.destroy());
        titleTxt.destroy();
        // Unfreeze player
        this.scene.player.isFrozen = false;
        this.scene.player.sprite.clearTint();
        // Shrink vines
        vineSprites.forEach(v => {
          if (v.active) {
            v.play('anim_ch2_vines_shrink');
            v.once('animationcomplete', () => v.destroy());
          }
        });

        if (escaped) {
          const txt = this.scene.add.text(playerPos.x, playerPos.y - 60, 'ESCAPED!', {
            fontFamily: 'VCR', fontSize: '20px', color: '#00ff00', stroke: '#000', strokeThickness: 5
          }).setOrigin(0.5).setDepth(600);
          this.scene.tweens.add({ targets: txt, y: txt.y - 40, alpha: 0, duration: 1500, onComplete: () => txt.destroy() });
        }
      };

      // Subscribe to gesture events
      this.scene._vineQteUnsub = state.on('gesture:detected', onGesture);

      // 10 second window to escape — deal damage only if they completely failed
      this.scene.time.delayedCall(10000, () => {
        if (qteIndex < 3 && this.scene.player.isFrozen) {
          // Failed to escape in time — deal real damage
          this.scene.player.takeDamage();
          cleanupQte(false);
        }
      });
    });

    return 4000;
  }

  /** Attack 4: Carrot Rain — Line Attack */
  ch2AttackCarrotRain() {
    // Pick 1 to 3 distinct rows OR distinct columns (NO diagonals)
    const isRow = Math.random() > 0.5;
    const numLines = Phaser.Math.Between(1, 3);
    const chosenLines = [];

    while (chosenLines.length < numLines) {
      const idx = Phaser.Math.Between(0, (isRow ? this.grid.rows : this.grid.cols) - 1);
      if (!chosenLines.includes(idx)) chosenLines.push(idx);
    }

    const tiles = [];
    chosenLines.forEach(idx => {
      if (isRow) {
        for (let c = 0; c < this.grid.cols; c++) tiles.push({ c, r: idx });
      } else {
        for (let r = 0; r < this.grid.rows; r++) tiles.push({ c: idx, r });
      }
    });

    // Telegraph all tiles
    tiles.forEach(t => this.grid.telegraph(t.c, t.r, 1500));

    // Stagger carrot drops
    tiles.forEach((t, i) => {
      this.scene.time.delayedCall(1500 + i * 150, () => {
        if (this.hp <= 0) return;
        const dest = this.grid.getPixelPosition(t.c, t.r);
        // Carrots fall from top-right
        const startX = dest.x + 200;
        const startY = dest.y - 350;

        // SCALE: Carrot sprite — change tileSize multiplier to resize
        const carrotScale = this.grid.tileSize * 1.5;
        const carrot = this.scene.add.sprite(startX, startY, 'ch2_carrot')
          .setDisplaySize(carrotScale, carrotScale) // ← SCALE CONTROL
          .setDepth(40)
          .setRotation(-0.5); // Slight angle for falling from top-right

        this.scene.tweens.add({
          targets: carrot,
          x: dest.x, y: dest.y,
          rotation: 0,
          duration: 350, ease: 'Power2',
          onComplete: () => {
            carrot.play('anim_ch2_carrot');
            carrot.once('animationcomplete', () => carrot.destroy());
            // Damage check on impact - lingers for the duration of the animation
            this.createDamageZone([{ c: t.c, r: t.r }], 1200);
          }
        });
      });
    });

    return 1500 + tiles.length * 150 + 500;
  }

  /** Attack 5: Exploding Eggs — Spot Hazard */
  ch2AttackExplodingEggs() {
    const numEggs = Phaser.Math.Between(5, 10);
    const chosen = [];

    for (let i = 0; i < numEggs; i++) {
      let c, r, attempts = 0;
      do {
        c = Phaser.Math.Between(0, this.grid.cols - 1);
        r = Phaser.Math.Between(0, this.grid.rows - 1);
        attempts++;
      } while (attempts < 15 && chosen.some(t => t.c === c && t.r === r));
      chosen.push({ c, r });
    }

    // Telegraph
    chosen.forEach(t => this.grid.telegraph(t.c, t.r, 1500));

    // Drop eggs after warning
    chosen.forEach(t => {
      this.scene.time.delayedCall(1500, () => {
        if (this.hp <= 0) return;
        const dest = this.grid.getPixelPosition(t.c, t.r);

        // SCALE: Egg sprite — change tileSize multiplier to resize
        const eggScale = this.grid.tileSize * 1.4;
        const egg = this.scene.add.sprite(dest.x, dest.y - 150, 'ch2_eggs')
          .setDisplaySize(eggScale, eggScale * 1.2) // ← SCALE CONTROL (w, h)
          .setDepth(40);

        this.scene.tweens.add({
          targets: egg,
          y: dest.y,
          duration: 400, ease: 'Bounce.easeOut',
          onComplete: () => {
            egg.play('anim_ch2_eggs');
            egg.once('animationcomplete', () => egg.destroy());
            this.scene.cameras.main.shake(150, 0.01);
            // Persistent damage zone while it explodes
            this.createDamageZone([{c: t.c, r: t.r}], 1800);
          }
        });
      });
    });

    return 1600;
  }

  /** Attack 6: Snapping Flora — Melee Trap (Persistent, fire-and-forget) */
  ch2AttackSnappingFlora() {
    for (let i = 0; i < 3; i++) {
      // Find a safe tile ≥2 tiles from the player
      let pc, pr, attempts = 0;
      do {
        pc = Phaser.Math.Between(0, this.grid.cols - 1);
        pr = Phaser.Math.Between(0, this.grid.rows - 1);
        attempts++;
      } while (attempts < 20 && (
        Math.abs(pc - this.scene.player.col) + Math.abs(pr - this.scene.player.row) < 2 ||
        this.grid.hasChestAt(pc, pr) ||
        this.grid.cells[pr][pc].status !== 'safe' ||
        this.scene.persistentEntities.some(e => e.col === pc && e.row === pr)
      ));

      // If we couldn't find a spot after 20 tries (unlikely unless grid is packed), skip
      if (attempts >= 20) continue;

      const pos = this.grid.getPixelPosition(pc, pr);
      this.grid.setCellStatus(pc, pr, 'locked', 0x336633);

      // SCALE: Melee plant sprite — change multiplier to resize
      const plantScale = this.grid.tileSize / 64 * 1.8;
      const plant = this.scene.add.sprite(pos.x, pos.y, 'ch2_plant_melee', 0)
        .setScale(plantScale) // ← SCALE CONTROL
        .setDepth(18)
        .setAlpha(0);

      // Add a persistent light red danger cross indicating its melee range (up, down, left, right)
      // Clamp each arm so it stays strictly within the board edges
      const size = this.grid.tileSize;
      const gridLeft   = this.grid.offsetX;
      const gridRight  = this.grid.offsetX + this.grid.cols * this.grid.tileSize;
      const gridTop    = this.grid.offsetY;
      const gridBottom = this.grid.offsetY + this.grid.rows * this.grid.tileSize;

      const dangerZone = this.scene.add.graphics();
      dangerZone.fillStyle(0xff0000, 0.25); // faint red

      // Horizontal bar: clamp left/right edges to grid bounds
      const hLeft  = Math.max(gridLeft,  pos.x - size * 1.5);
      const hRight = Math.min(gridRight, pos.x + size * 1.5);
      dangerZone.fillRect(hLeft, pos.y - size * 0.5, hRight - hLeft, size);

      // Vertical bar: clamp top/bottom edges to grid bounds
      const vTop    = Math.max(gridTop,    pos.y - size * 1.5);
      const vBottom = Math.min(gridBottom, pos.y + size * 1.5);
      dangerZone.fillRect(pos.x - size * 0.5, vTop, size, vBottom - vTop);

      dangerZone.setDepth(15);
      dangerZone.setAlpha(0);

      // Pop-in animation
      this.scene.tweens.add({
        targets: [plant, dangerZone], alpha: 1, duration: 300, ease: 'Back.easeOut'
      });

      const entity = { type: 'melee', col: pc, row: pr, sprite: plant, danger: dangerZone, active: true, _attackCooldown: false };
      this.scene.persistentEntities.push(entity);

      // Remove after 8 seconds
      entity.timer = this.scene.time.delayedCall(8000, () => {
        if (!entity.active) return;
        entity.active = false;
        this.grid.setCellStatus(pc, pr, 'safe');
        this.scene.tweens.add({
          targets: [plant, dangerZone], alpha: 0, scale: 0, duration: 300,
          onComplete: () => {
            plant.destroy();
            dangerZone.destroy();
            const idx = this.scene.persistentEntities.indexOf(entity);
            if (idx !== -1) this.scene.persistentEntities.splice(idx, 1);
          }
        });
      });

      entity.onAttackComplete = () => {
        entity.active = false;
        if (entity.timer) entity.timer.remove();
        this.grid.setCellStatus(entity.col, entity.row, 'safe');
        this.scene.tweens.add({
          targets: [plant, dangerZone], alpha: 0, scale: 0, quantity: 0, duration: 300,
          onComplete: () => {
            plant.destroy();
            dangerZone.destroy();
            const idx = this.scene.persistentEntities.indexOf(entity);
            if (idx !== -1) this.scene.persistentEntities.splice(idx, 1);
          }
        });
      };
    }

    return 1000;
  }

  /** Attack 7: Acid Spitter — Wall of Ranged Plants (3 right, 4 left), each fires 3 shots of 3 random tiles */
  ch2AttackAcidSpitter() {
    const SHOTS_PER_PLANT = 3;
    const SHOT_DELAY = 1000;
    const PLANT_SCALE = this.grid.tileSize / 64 * 2.0;
    const PROJ_SCALE  = this.grid.tileSize / 32 * 0.5;
    const SPLAT_SCALE = this.grid.tileSize / 32 * 0.8;

    const gridLeft  = this.grid.offsetX;
    const gridRight = this.grid.offsetX + this.grid.cols * this.grid.tileSize;
    const offscreenPad = 80;

    const allRows = Array.from({ length: this.grid.rows }, (_, i) => i);
    Phaser.Utils.Array.Shuffle(allRows);
    const rightRows = allRows.slice(0, 3);
    const leftRows  = allRows.slice(3, 7);

    const totalDuration = SHOTS_PER_PLANT * SHOT_DELAY + 2500;

    const spawnPlantAndFire = (plantRow, side) => {
      const isRight = side === 'right';
      const pixelY  = this.grid.getPixelPosition(0, plantRow).y;
      const pixelX  = isRight ? gridRight + offscreenPad : gridLeft - offscreenPad;

      // Row 3 (frames 14) = left, Row 4 (frames 21) = right  — correct per sprite sheet
      const idleFrame = isRight ? 14 : 21; // left-facing for right-side, right-facing for left-side
      const plant = this.scene.add.sprite(pixelX, pixelY, 'ch2_plant_ranged', idleFrame)
        .setScale(PLANT_SCALE).setDepth(18).setAlpha(0);

      this.scene.tweens.add({ targets: plant, alpha: 1, duration: 400, ease: 'Back.easeOut' });

      for (let shot = 0; shot < SHOTS_PER_PLANT; shot++) {
        this.scene.time.delayedCall(500 + shot * SHOT_DELAY, () => {
          if (this.hp <= 0 || this.scene.isGameOver) return;

          // Play correct facing animation
          plant.play(isRight ? 'anim_ch2_plant_ranged_left' : 'anim_ch2_plant_ranged_right');

          // Pick 3 random UNIQUE columns on THIS plant's own row
          const targetTiles = [];
          const usedCols = new Set();
          let safety = 0;
          while (targetTiles.length < 3 && safety++ < 30) {
            const tc = Phaser.Math.Between(0, this.grid.cols - 1);
            if (!usedCols.has(tc)) {
              usedCols.add(tc);
              targetTiles.push({ c: tc, r: plantRow }); // Always fires on its own row
            }
          }

          // Telegraph all 3 target tiles
          targetTiles.forEach(({ c, r }) => this.grid.telegraph(c, r, 700));

          this.scene.time.delayedCall(700, () => {
            if (this.hp <= 0 || this.scene.isGameOver) return;

            targetTiles.forEach(({ c, r }) => {
              const targetPos = this.grid.getPixelPosition(c, r);
              const startX = isRight ? gridRight + 10 : gridLeft - 10;

              // Step 1: Charge at the plant mouth
              const charge = this.scene.add.sprite(pixelX, pixelY, 'ch2_acid_charge', 0)
                .setScale(PROJ_SCALE).setDepth(41);
              charge.play('anim_ch2_acid_charge');

              // anim_ch2_acid_charge: 10 frames @ 12fps = ~833ms
              const CHARGE_MS = Math.floor(10 / 12 * 1000);

              charge.once('animationcomplete', () => {
                charge.destroy();

                // Step 2: Travel (Acid-02Repeatable) from edge toward target tile
                const angle = Math.atan2(targetPos.y - pixelY, targetPos.x - pixelX);
                const travel = this.scene.add.sprite(startX, pixelY, 'ch2_acid_travel', 0)
                  .setScale(PROJ_SCALE).setDepth(42).setRotation(angle);
                travel.play('anim_ch2_acid_travel');

                const dist = Math.sqrt((targetPos.x - startX) ** 2 + (targetPos.y - pixelY) ** 2);
                const travelDuration = Math.max(400, dist * 0.8);

                // Pre-spawn splat ONE FRAME before travel ends — no gap!
                const ONE_FRAME = 16;

                this.scene.time.delayedCall(travelDuration - ONE_FRAME, () => {
                  if (this.hp <= 0 || this.scene.isGameOver) return;
                  // Step 3: Splat — last 6 frames of Acid-01.png (frames 10-15)
                  const splat = this.scene.add.sprite(targetPos.x, targetPos.y, 'ch2_acid_charge', 10)
                    .setScale(SPLAT_SCALE).setDepth(20);
                  splat.play('anim_ch2_acid_burst');
                  splat.once('animationcomplete', () => splat.destroy());
                  this.createDamageZone([{ c, r }], 1200);
                });

                this.scene.tweens.add({
                  targets: travel,
                  x: targetPos.x, y: targetPos.y,
                  duration: travelDuration, ease: 'Linear',
                  onComplete: () => travel.destroy()
                });
              });
            });
          });
        });
      }

      // Fade plant out after all shots done
      this.scene.time.delayedCall(totalDuration, () => {
        if (plant.active) {
          this.scene.tweens.add({
            targets: plant, alpha: 0, duration: 400,
            onComplete: () => plant.destroy()
          });
        }
      });
    };

    rightRows.forEach(r => spawnPlantAndFire(r, 'right'));
    leftRows.forEach(r  => spawnPlantAndFire(r, 'left'));

    return totalDuration + 500;
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
