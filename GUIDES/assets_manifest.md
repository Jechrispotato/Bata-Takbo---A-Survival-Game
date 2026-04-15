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

## Suggested Additional Assets

To further enhance the game's premium pixel-art aesthetic, consider adding these:

1. **Chapter Transition Banner**: A splash sprite that appears when a level starts (approx. 800x200 px).
2. **HUD Panel Texture**: A stone or parchment texture overlaying the left status panel (450x1080 px).
3. **Animated Environment Props**: Animated wall torches or dripping pipes (64x64 px).
4. **Tile Edge Variations**: Edge/corner sprites to make the grid transition into the background more naturally (128x128 px).
