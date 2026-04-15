# Asset Dimensions & Manifest

This document provides a comprehensive list of all asset dimensions used in **Bata, Takbo!**, as well as recommended sizes for new assets you are planning to add to ensure perfect pixel-art scaling and layout alignment.

## Current Asset Manifest

### Character & Boss Sprites
| Asset | Current File | Total Size | Frame Size | Notes |
|-------|--------------|------------|------------|-------|
| **Player (All)** | `idle_down.png` etc. | 384x64 | **48x64** | 8 frames horizontal |
| **Boss (Duende)**| `duende-sprite.png` | 5088x832 | **848x832** | 6 frames horizontal |

### UI & Environment
| Asset | Current File | Size | Notes |
|-------|--------------|------|-------|
| **Main Title** | `Main_title.png` | 1080x1080 | Center-anchored floating title |
| **Menu BG** | `background.gif` | 960x540 | Upscaled to fill viewport |
| **Chapter Card**| `chapter1.png` | 1728x2454 | Unlocked state card |
| **Locked Card** | `locked-chapter.png`| 1728x2240 | Locked (chained) card |
| **Tileset** | `mainlevbuild.png` | 1024x640 | Main dungeon floor/wall tiles |
| **GUISprite** | `GUISprite.png` | 320x224 | Generic HUD bars/frames |
| **Buttons** | `buttons.png` | 320x160 | Hearts/UI icons (16x16 frames) |

### Gameplay FX
| Asset | Current File | Total Size | Frame Size | Notes |
|-------|--------------|------------|------------|-------|
| **Projectiles** | `bone.png` etc. | 32x32 | **32x32** | Scaled to 2x in-game |
| **Alert** | `symbol_alert.png` | 1120x80 | **80x80** | 14 frames |
| **Lightning** | `lightning_burst.png`| 576x64 | **64x64** | 9 frames |
| **Explosion** | `stylized_explosion.png`| 864x96 | **96x96** | 9 frames |

---

## Required Asset Specifications (7x7 Grid)

Below are the exact recommended dimensions for assets compatible with the current **7x7 grid** system. Use these specific sizes for all new art imports.

### 1. Grid & Game Board
- **Grid Background (Right Panel)**: 1400 x 1080 px
- **Inner Game Board Frame**: 840 x 840 px (Wraps the 7x7 grid area)
- **Base Grid Tile**: 128 x 128 px
- **Red "Target" Tile**: 128 x 128 px
- **Golden "Boss Hurt" Tile**: 128 x 128 px

### 2. HUD & UI Boxes
- **Boss Box Background**: 450 x 600 px
- **Boss Box Border/Frame**: 450 x 600 px
- **Camera Feed Box Background**: 450 x 300 px
- **Camera Feed Box Border**: 450 x 300 px
- **HUD Side-Bar Background**: 450 x 1080 px

### 3. Decorative & Polish Assets
- **"Chapter Start" Banner**: 800 x 200 px
- **Victory/Defeat Art**: 1920 x 1080 px
- **Pause Menu Overlay Art**: 1920 x 1080 px
- **Floor Tile Decorative Variant**: 128 x 128 px (Cracks, moss, etc.)
- **Projectile Shadow**: 32 x 32 px (Small transparent circle)

---

## Upcoming Mechanics & Boss Sprites (Placeholders)

The following assets are required for the newly expanded Master Plan (Power-Ups and Chapters 1-3).
Please review these and provide the specific image files/paths you'd like to use. If not provided, placeholders will be generated.

### 4. Power-Up Ecosystem (Grid Drops)

**Asset Strategy (Per User Input):**
- **Grid Drops:** Use `Game Assets/Chest Sprite/Chests.png` (First 3 columns: Bronze/Silver/Gold) for Common, Rare, and Legendary grid drops.
- **Chest VFX:** Yes! When the player touches a chest, it will play the opening animation and trigger a Phaser 3 Particle Emitter burst effect before the power-up is applied.
- **HUD Active UI:** Use `Game Assets/PowerUpsUI/02.png` as a universal placeholder. It features green/blue/gold borders that visually map to the rarity tiers, alongside a duration indicator.

| Mechanic | Need | Recommended Size | User Sprite Comment |
|----------|------|------------------|---------------------|
| **Common: Speed Boost** | Ground item & HUD icon | 64x64 | Use `Chests.png` (Col 1) for drop. Use `02.png` for HUD placeholder. |
| **Common: Vitality (Shield)** | Ground item & player bubble FX | 64x64 | Use `Chests.png` (Col 1) for drop. Use `02.png` for HUD placeholder. |
| **Common: Sight (Compass)** | Ground item & glowing path FX | 64x64 | Use `Chests.png` (Col 1) for drop. Use `02.png` for HUD placeholder. |
| **Rare: The Anchor** | Ground item & active HUD icon | 64x64 | Use `Chests.png` (Col 2) for drop. Use `02.png` for HUD placeholder. |
| **Rare: Dash** | Ground item & blur trail FX | 64x64 | Use `Chests.png` (Col 2) for drop. Use `02.png` for HUD placeholder. |
| **Rare: Health Potion** | Ground item & heal sparkle FX | 64x64 | Use `Chests.png` (Col 2) for drop. HUD instant (no duration). |
| **Legendary: Invincibility Aura** | Ground item & gold flash FX | 64x64 | Use `Chests.png` (Col 3) for drop. Use `02.png` for HUD placeholder. |
| **Legendary: Time Stop** | Ground item & screen tint/clock FX | 64x64 | Use `Chests.png` (Col 3) for drop. Use `02.png` for HUD placeholder. |
| **Legendary: Teleport (Blink)** | Ground item & snap flash FX | 64x64 | Use `Chests.png` (Col 3) for drop. HUD instant (no duration). |

### 5. Boss Mechanics & Hazards
| Mechanic | Need | Recommended Size | User Sprite Comment |
|----------|------|------------------|---------------------|
| **Golden Tile** | Glowing objective tile | 128x128 | _Pending user input_ |
| **Wandering Torso (Ch 1)** | Obstacle sprite | 128x128 | _Pending user input_ |
| **Mud Pit (Ch 2)** | Ground hazard texture (3x3) | 384x384 total | _Pending user input_ |
| **Heavy Lockdown (Ch 2)** | Padlock/Chains overlay (2x2) | 256x256 total | _Pending user input_ |
| **Tidal Wave (Ch 3)** | Large sweeping hazard | Sweeps grid | _Pending user input_ |
| **Whirlpool (Ch 3)** | Animated water trap (2x2) | 256x256 total | _Pending user input_ |
| **Siren's Current (Ch 3)** | Directional water flow (Row/Col) | Tiles | _Pending user input_ |
| **Geyser Trap (Ch 3)** | Ground eruption FX | 128x128 | _Pending user input_ |

