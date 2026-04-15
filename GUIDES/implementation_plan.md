# Bata, Takbo! ── Full Implementation Plan

> **Last Updated:** 2026-04-15  
> **Project Type:** Mobile-first PWA (Progressive Web App)  
> **Genre:** Boss-battle survival / dodge game with hand-gesture controls  

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Architecture](#3-project-architecture)
4. [Asset Inventory & Map](#4-asset-inventory--map)
5. [Module Breakdown](#5-module-breakdown)
   - 5.1 [PWA Shell & Service Worker](#51-pwa-shell--service-worker)
   - 5.2 [Main Menu System](#52-main-menu-system)
   - 5.3 [Hand Gesture ML System](#53-hand-gesture-ml-system)
   - 5.4 [Game Engine & Core Loop](#54-game-engine--core-loop)
   - 5.5 [Chapter / Level Design](#55-chapter--level-design)
   - 5.6 [HUD & In-Game UI](#56-hud--in-game-ui)
   - 5.7 [Settings System](#57-settings-system)
   - 5.8 [Account & Leaderboard System](#58-account--leaderboard-system)
   - 5.9 [Spellbook / Bestiary](#59-spellbook--bestiary)
   - 5.10 [Webcam Capture Feature](#510-webcam-capture-feature)
   - 5.11 [Tutorial System](#511-tutorial-system)
   - 5.12 [About / Credits Screen](#512-about--credits-screen)
6. [Security Plan](#6-security-plan)
7. [Folder Structure](#7-folder-structure)
8. [Development Phases & Timeline](#8-development-phases--timeline)
9. [Testing & QA Strategy](#9-testing--qa-strategy)
10. [Deployment](#10-deployment)

---

## 1. Project Overview

**Bata, Takbo!** (Filipino for "Kid, Run!") is a mobile-first PWA boss-battle survival game inspired by the "Just One Boss" genre. The player navigates a grid-based battlefield using **custom hand gestures** recognized by an on-device ML model, dodging projectiles thrown by a boss while trying to reach specific damage-dealing tiles.

### Core Pillars
| Pillar | Description |
|--------|-------------|
| **Gesture Control** | Players train their own hand gestures for UP/DOWN/LEFT/RIGHT movement using their device camera |
| **Boss Battles** | 3 Chapters, each introducing a unique boss with escalating attack patterns |
| **Accessibility** | Installable PWA ── no app store needed; works offline after first load |
| **Competition** | Optional account system + global leaderboard (highest score / fastest clear) |
| **Security** | Camera privacy controls, no server-side gesture data storage, all ML runs on-device |

### Game Flow (High Level)
```
Main Menu ─†’ Chapter Select ─†’ Boss Battle ─†’ Results/Capture ─†’ Leaderboard
     ┐‚
     ┐─ Hand Gesture Training
     ┐─ Settings
     ┐─ Spellbook (Bestiary)
     ┐─ Tutorial
     ┐─ Leaderboard
     ┐─ About / Credits
```

---

## 2. Technology Stack

### Frontend (Game Client)
| Technology | Purpose | Version |
|------------|---------|---------|
| **Vite** | Build tool & dev server | Latest (^6.x) |
| **Phaser 3** | 2D game engine (grid, sprites, physics, animations) | ^3.80 |
| **MediaPipe Hands** | Real-time hand landmark detection (21 keypoints) | `@mediapipe/hands` ^0.4 |
| **TensorFlow.js** | On-device KNN classifier for custom gesture recognition | `@tensorflow/tfjs` ^4.x |
| **kNN Classifier** | Lightweight classifier for user-trained gestures | `@tensorflow-models/knn-classifier` |
| **Vanilla CSS** | All styling ── no Tailwind | ── |
| **Howler.js** | Cross-browser audio (SFX + music) | ^2.2 |

### Backend (Leaderboard & Auth)
| Technology | Purpose |
|------------|---------|
| **Firebase Auth** | Email/password + Google sign-in for leaderboard accounts |
| **Cloud Firestore** | Leaderboard data, user profiles, chapter progress |
| **Firebase Security Rules** | Row-level security, rate limiting |

### PWA
| Technology | Purpose |
|------------|---------|
| **Workbox** | Service worker generation, caching strategies |
| **Web App Manifest** | Install prompt, splash screen, icons |

### Why These Choices
- **Phaser 3** ── Battle-tested 2D engine with built-in sprite animation, tilemaps, and mobile touch support. Perfect for grid-based gameplay.
- **MediaPipe Hands** ── Google's hand-tracking solution runs efficiently on mobile GPUs via WebGL. Provides 21 3D landmarks per hand with ~30fps on mid-range phones.
- **KNN Classifier** ── Zero training time. User gesture samples are stored as feature vectors and classified in real-time using k-nearest-neighbors. No need for model compilation or GPU training.
- **Firebase** ── Free tier covers thousands of users. Auth + Firestore provide a complete account/leaderboard backend with minimal code.

---

## 3. Project Architecture

```
┌─────────────────────────────────────────────────────────────────┐
┐‚                        PWA Shell (Vite)                         ┐‚
┐‚  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ ┐‚
┐‚  ┐‚   UI Layer   ┐‚  ┐‚  Game Engine  ┐‚  ┐‚    ML/Gesture Layer   ┐‚ ┐‚
┐‚  ┐‚  (HTML/CSS)  ┐‚  ┐‚  (Phaser 3)  ┐‚  ┐‚ (MediaPipe + TF.js)  ┐‚ ┐‚
┐‚  ┐‚              ┐‚  ┐‚              ┐‚  ┐‚                       ┐‚ ┐‚
┐‚  ┐‚ ─¢ Main Menu  ┐‚  ┐‚ ─¢ Grid System┐‚  ┐‚ ─¢ Camera Manager      ┐‚ ┐‚
┐‚  ┐‚ ─¢ Settings   ┐‚  ┐‚ ─¢ Boss AI    ┐‚  ┐‚ ─¢ Hand Detector       ┐‚ ┐‚
┐‚  ┐‚ ─¢ Spellbook  ┐‚  ┐‚ ─¢ Projectiles┐‚  ┐‚ ─¢ KNN Classifier      ┐‚ ┐‚
┐‚  ┐‚ ─¢ Tutorial   ┐‚  ┐‚ ─¢ Player Ctrl┐‚  ┐‚ ─¢ Gesture Trainer     ┐‚ ┐‚
┐‚  ┐‚ ─¢ Leaderboard┐‚  ┐‚ ─¢ Power-ups  ┐‚  ┐‚ ─¢ Landmark Normalizer ┐‚ ┐‚
┐‚  ┐‚ ─¢ About      ┐‚  ┐‚ ─¢ HUD        ┐‚  ┐‚                       ┐‚ ┐‚
┐‚  ┐─┐¬───────┐˜  ┐─┐¬───────┐˜  ┐─┐¬───────────┐˜ ┐‚
┐‚         ┐‚                 ┐‚                      ┐‚             ┐‚
┐‚  ┌──────┐´─────────────────┐´──────────────────────┐´───────────┐ ┐‚
┐‚  ┐‚                    State Manager (EventBus)               ┐‚ ┐‚
┐‚  ┐‚         Game State, Settings, Gesture Model, Auth         ┐‚ ┐‚
┐‚  ┐─┐¬────────────────────────────────┐˜ ┐‚
┐‚                             ┐‚                                  ┐‚
┐‚  ┌──────────────────────────┐´────────────────────────────────┐ ┐‚
┐‚  ┐‚              Persistence Layer (IndexedDB + Firebase)     ┐‚ ┐‚
┐‚  ┐‚  ─¢ Gesture Model (local)   ─¢ Leaderboard (cloud)         ┐‚ ┐‚
┐‚  ┐‚  ─¢ Settings (local)        ─¢ Auth Tokens (secure)        ┐‚ ┐‚
┐‚  ┐‚  ─¢ Progress (local+cloud)  ─¢ Chapter Unlock (local+cloud)┐‚ ┐‚
┐‚  ┐─┐˜ ┐‚
┐─┐˜
```

---

## 4. Asset Inventory & Map

### 4.1 UI Assets
| Asset | Path | Usage |
|-------|------|-------|
| `Main_title.png` | `Game Assets/UI/` | Title card on main menu (orange/red pixel art "BATA TAKBO!") |
| `background.gif` | `Game Assets/UI/` | Animated main menu background |
| `chapter-1.png` | `Game Assets/UI/` | Chapter 1 card ── "The RedCap's Lair" (unlocked state) |
| `chapter-2.png` | `Game Assets/UI/` | Chapter 2 card (locked state ── chains + padlock) |
| `chapter-3.png` | `Game Assets/UI/` | Chapter 3 card (locked state ── chains + padlock) |
| `game-ref.png` | `Game Assets/UI/` | **REFERENCE ONLY** ── layout guide for in-game HUD |
| `buttons.png` | `Game Assets/PowerUpsUI/` | Spritesheet ── back arrows, stars, hearts, UI buttons |
| `GUISprite.png` | `Game Assets/GameplayUI/` | Health bars, progress bars, UI frames |
| `Inventory.png` | `Game Assets/GameplayUI/` | Inventory panel layouts |

### 4.2 Fonts
| Font | Path | Usage |
|------|------|-------|
| `VCRosdNEUE.ttf` | `Game Assets/Main Font/` | **Primary UI font** ── all menus, HUD text, buttons |
| `DirtyHarold.ttf` | `Game Assets/Main Font/` | **Accent font** ── chapter titles, boss names |

### 4.3 Character Sprites (Male & Female ── identical structure)
| Animation | Files | Notes |
|-----------|-------|-------|
| Idle | `idle.png` (full sheet) + directional singles | 4 directions |
| Walk | `walk.png` (full sheet) + directional singles | 4 directions |
| Dash | `Dash.png` (full sheet) + directional singles + `Dust/` particles | 4 directions |
| Death | `death_normal.png` (full sheet) + directional singles | 4 directions |
| Jump | Subdirectory | For power-up or special animations |

### 4.4 Projectile Items (48 Static Loots)
These are thrown by bosses as projectiles onto the grid:
- **Bones:** bone.png, bone-1.png, bone-2.png, bone-hand.png, bone-ribs.png, broken-bone.png
- **Skulls:** skull.png, broken-skull.png, candle-skull.png
- **Weapons:** knife.png, broken-arrow.png
- **Potions/Items:** red-potion.png, bottle.png, candle.png, food.png, bawang.png
- **Valuables:** diamond.png, ruby.png, crown.png, gold-pouch.png, ring.png, ring1.png, necklace.png
- **Body Parts:** brain.png, eyes.png, teeth.png, monster-feet.png, monster-feet1.png, monster-finger.png, monster-hand.png
- **Equipment:** helmet.png, boots.png, gloves.png, mail.png
- **Scrolls/Books:** scroll.png, scroll1.png, scroll2.png, book.png
- **Misc:** key.png, puppet.png, heart.png
- **Generic Icons:** Icon9.png, Icon10.png, Icon23.png, Icon32.png, Icon37.png, Icon39.png, Icon48.png

### 4.5 Platform & Environment
| Asset | Path | Usage |
|-------|------|-------|
| `mainlevbuild.png` | `Platform Design/` | Dark dungeon tileset (walls, floors, pillars) |
| `dungeon_components.png` | `Platform Design2/` | Furniture, rugs, chairs, banners ── environmental decoration |
| `decorative.png` | `Platform Design/` | Decorative wall elements |
| Candles A/B (4 frames each) | `Platform Design/` | Animated candle props |
| Torches (4 frames) | `Platform Design/` | Animated torch props |
| Spikes (5 frames) | `Platform Design/` | Animated spike traps (damage tiles) |
| Decorative animation sheets | `Platform Design2/decorative_animations_sheet/` | Chests, coins, doors, keys, trapdoors |

### 4.6 Game FX (Frame-by-frame animations)
| Category | Effects Available |
|----------|-----------------|
| **Explosions** | 8 types (epic x2, stylized x3, symmetrical x3) |
| **Fantasy Spells** | absorb, attack_up, death, defense_up, haste, heal, poison |
| **Impacts** | 9 types (directional x4, symmetrical x5) |
| **Lightning** | 4 types (bursts x3, strike x1) |
| **Magic Bursts** | Various burst effects |
| **Smoke Bursts** | Smoke particle effects |
| **Splatters** | Hit splatter effects |
| **Symbols** | UI/spell indicator symbols |

### 4.7 Gameplay UI Elements
| Asset | Path | Usage |
|-------|------|-------|
| `GUISprite.png` | `GameplayUI/` | Hearts (full/half/empty), health bars, progress bars, frames |
| PowerUps `01-07.png` | `PowerUpsUI/` | Individual powerup icons for in-game pickups |
| `Chests.png` | `Chest Sprite/` | Animated chest variants (reward containers) |

---

## 5. Module Breakdown

### 5.1 PWA Shell & Service Worker

**Goal:** Make the game installable on mobile devices and playable offline after first load.

#### Files to Create
```
web/
┐─ index.html              # Single-page shell
┐─ manifest.json           # PWA manifest (name, icons, theme)
┐─ sw.js                   # Service worker (via Workbox)
┐─ icons/                  # PWA icons (192x192, 512x512)
```

#### PWA Manifest Details
```json
{
  "name": "Bata, Takbo! ── A Survival Game",
  "short_name": "Bata Takbo",
  "start_url": "/",
  "display": "fullscreen",
  "orientation": "landscape",
  "background_color": "#0a0a1a",
  "theme_color": "#ff6b1a",
  "icons": [...]
}
```

#### Caching Strategy
| Resource Type | Strategy | Reason |
|---------------|----------|--------|
| Game assets (sprites, audio) | **Cache First** | Rarely change, large files |
| HTML/JS/CSS | **Stale While Revalidate** | Updated on deploys |
| Firebase API calls | **Network Only** | Must be real-time (leaderboard) |
| MediaPipe WASM | **Cache First** | Large downloads, versioned |

#### Offline Behavior
- Game is fully playable offline (gesture training, all chapters)
- Leaderboard syncs when online ── queued submissions stored in IndexedDB
- Auth state persisted via Firebase persistence

---

### 5.2 Main Menu System

**Goal:** A visually stunning main menu that feels polished and is easy to navigate on mobile.

#### Layout (Portrait Mobile)
```
┌────────────────────────────┐
┐‚                            ┐‚
┐‚    ─•─•─•─•─•─•─•─•─•─•─•─•─•─•─•─•─•─•─•─•─•—   ┐‚
┐‚    ─•‘  [background.gif] ─•‘   ┐‚  ─† Full-screen animated BG
┐‚    ─•‘                   ─•‘   ┐‚
┐‚    ─•‘  [Main_title.png] ─•‘   ┐‚  ─† Title card with float animation
┐‚    ─•‘                   ─•‘   ┐‚
┐‚    ─•‘   ─–¸ PLAY          ─•‘   ┐‚  ─† VCRosdNEUE font
┐‚    ─•‘   ─–¸ GESTURE SETUP ─•‘   ┐‚  ─† Neon glow on hover/focus
┐‚    ─•‘   ─–¸ SPELLBOOK     ─•‘   ┐‚  ─† Pulse animation on click
┐‚    ─•‘   ─–¸ LEADERBOARD   ─•‘   ┐‚
┐‚    ─•‘   ─–¸ SETTINGS      ─•‘   ┐‚
┐‚    ─•‘   ─–¸ ABOUT         ─•‘   ┐‚
┐‚    ─•‘   ─–¸ EXIT          ─•‘   ┐‚
┐‚    ─•š─•─•─•─•─•─•─•─•─•─•─•─•─•─•─•─•─•─•─•─•   ┐‚
┐‚                            ┐‚
┐─┐˜
```

#### Button Interactions
- **Idle state:** White text, VCRosdNEUE font, slight text-shadow
- **Hover/Focus:** Orange-red glow radiating outward (`text-shadow` with 3 layers), slight scale-up (1.05x)
- **Active/Click:** Quick flash of bright yellow, screen-shake micro-animation, then navigate
- **Navigation:** Arrow indicator (─–¸) slides to hovered item; can be navigated with swipe gestures too

#### Implementation Details
- `background.gif` loaded as a CSS background on the menu container
- `Main_title.png` positioned top-center with a CSS `@keyframes float` animation (gentle up/down bob)
- Font loaded via `@font-face` with `font-display: swap`
- All menu items are `<button>` elements for accessibility
- Exit button calls `window.close()` or hides menu on mobile (PWA can't truly exit)

---

### 5.3 Hand Gesture ML System

**Goal:** Let users define and train custom hand gestures for UP/DOWN/LEFT/RIGHT movement in real-time.

#### Architecture
```
Camera Feed
    ┐‚
    ▼
MediaPipe Hands (21 landmarks Ã— 3 coords = 63 values)
    ┐‚
    ▼
Landmark Normalizer (translation + scale invariant)
    ┐‚
    ▼
KNN Classifier (4 classes: UP, DOWN, LEFT, RIGHT + IDLE)
    ┐‚
    ▼
Gesture Event Emitter ─†’ Game Engine
```

#### Landmark Normalization Pipeline
1. **Extract** 21 hand landmarks from MediaPipe (x, y, z each)
2. **Translate** ── Subtract wrist position (landmark 0) so wrist = origin
3. **Scale** ── Divide all coordinates by the distance from wrist to middle finger MCP (landmark 9)
4. **Flatten** ── Produce a 63-dimensional feature vector
5. **Pass to KNN** ── Classify against stored examples

This normalization makes gestures invariant to hand position, distance from camera, and hand size.

#### Gesture Training UI Flow
```
┌─────────────────────────────────────────┐
┐‚          GESTURE TRAINING               ┐‚
┐‚                                         ┐‚
┐‚  ┌─────────────────────────────┐        ┐‚
┐‚  ┐‚                             ┐‚        ┐‚
┐‚  ┐‚      [Camera Feed with      ┐‚        ┐‚
┐‚  ┐‚       hand skeleton         ┐‚        ┐‚
┐‚  ┐‚       overlay drawn]        ┐‚        ┐‚
┐‚  ┐‚                             ┐‚        ┐‚
┐‚  ┐─┐˜        ┐‚
┐‚                                         ┐‚
┐‚  Currently Training: ─–² UP               ┐‚
┐‚                                         ┐‚
┐‚  Samples Recorded: ─–ˆ─–ˆ─–ˆ─–ˆ─–ˆ─–ˆ─–ˆ─–ˆ─–‘─–‘ 16/20     ┐‚
┐‚                                         ┐‚
┐‚  ┌────────┐  ┌────────────────┐         ┐‚
┐‚  ┐‚  BACK  ┐‚  ┐‚ ðŸ─´ RECORD (Hold)┐‚        ┐‚
┐‚  ┐─┐˜  ┐─┐˜         ┐‚
┐‚                                         ┐‚
┐‚  ┌─────┐ ┌─────┐ ┌──────┐ ┌─────┐      ┐‚
┐‚  ┐‚─–² UP ┐‚ ┐‚▼DOWN┐‚ ┐‚◀LEFT ┐‚ ┐‚▶RIGHT┐‚     ┐‚
┐‚  ┐‚ 16  ┐‚ ┐‚  0  ┐‚ ┐‚  0   ┐‚ ┐‚  0  ┐‚      ┐‚
┐‚  ┐‚ ─…  ┐‚ ┐‚ ─¬─  ┐‚ ┐‚  ─¬─  ┐‚ ┐‚ ─¬─  ┐‚      ┐‚
┐‚  ┐─┐˜ ┐─┐˜ ┐─┐˜ ┐─┐˜      ┐‚
┐‚                                         ┐‚
┐‚  ┌─────────────────────────────┐        ┐‚
┐‚  ┐‚     TEST MY GESTURES        ┐‚        ┐‚
┐‚  ┐─┐˜        ┐‚
┐‚  ┌─────────────────────────────┐        ┐‚
┐‚  ┐‚     RESET ALL               ┐‚        ┐‚
┐‚  ┐─┐˜        ┐‚
┐─┐˜
```

#### Training Flow (Step by Step)
1. User opens "Gesture Setup" from main menu
2. **Instruction overlay** explains: *"Show your hand to the camera and make a gesture you want to use for each direction. Hold the RECORD button while performing the gesture to capture samples."*
3. User selects a direction tab (UP/DOWN/LEFT/RIGHT)
4. User makes a hand pose ─†’ holds the **RECORD** button ─†’ system captures landmark snapshots at ~10fps
5. Progress bar fills as samples are recorded (recommended: **15-25 samples** per direction)
6. Checkmark appears when minimum samples (10) are reached
7. User repeats for all 4 directions
8. User taps **"TEST MY GESTURES"** ─†’ enters a test mode where recognized gestures highlight the corresponding direction arrow in real-time
9. Model is auto-saved to **IndexedDB** (serialized KNN classifier state)

#### Key Technical Details
- **KNN K-value:** 5 (best for small sample sizes)
- **Confidence threshold:** 0.75 (below this ─†’ IDLE, no movement registered)
- **Sampling rate during recording:** 10 samples/sec (every 100ms)
- **Minimum samples per class:** 10
- **Recommended samples per class:** 20
- **Storage:** KNN classifier dataset serialized to JSON, stored in IndexedDB (~50-200KB)
- **Idle detection:** When no hand is detected or confidence < threshold, emit IDLE gesture
- **Debounce:** Gesture must be consistent for 150ms before triggering a grid move (prevents jitter)

#### Camera Manager
```javascript
// CameraManager responsibilities:
// 1. Request camera permission (front-facing)
// 2. Handle permission denied gracefully
// 3. Provide video element to MediaPipe & to game HUD preview
// 4. Support privacy mode (black screen overlay but still processing)
// 5. Handle device rotation / camera switching
```

#### Model Persistence
- **Save:** After training, serialize KNN dataset ─†’ store in IndexedDB under key `gesture_model_v1`
- **Load:** On app start, check IndexedDB ─†’ if model exists, load into KNN classifier
- **Reset:** Clear IndexedDB key, reset classifier
- **No cloud upload:** Gesture data NEVER leaves the device (privacy/security)

---
### 5.4 Game Engine & Core Loop

**Goal:** A grid-based boss battle where the player navigates hazards using continuous gesture movement to collect power-ups and strike the boss.

#### Core Mechanics: The Fairness Rules
1. **Continuous Gesture Movement:** The player holds a hand gesture to move at a set speed and uses a "rest" gesture to brake and stop.
2. **Grid Snapping:** Upon making the rest gesture, the character must snap cleanly to the center of the nearest tile to prevent unfair clipping.
3. **Golden Tile Logic:** The damage tile must never spawn inside an active hazard, and on larger grids, it should spawn relatively close to the player to prevent physical arm fatigue.
4. **Telegraphing:** Every attack requires a highly visible, 1.5 to 2.0-second red warning flash before the damage frame lands so the player has time to react to camera latency.

#### Grid System
- **Grid Size:** Varies by Chapter (5x5, 7x7, 9x9).
- **Tile Size:** Dynamically calculated based on available screen space inside the 450x600 grid wrapper.

#### The Power-Up Ecosystem
These items randomly drop onto safe tiles. The harder the chapter, the better the chance for Rare and Legendary drops.

**Common (Green Drops) - Minor utility, drops frequently:**
- **Speed Boost:** Temporarily increases continuous walking speed by 30%, making it easier to outrun fast attacks.
- **Vitality (Shield):** Grants a temporary barrier that absorbs exactly one missed gesture, bad stop, or hazard hit.
- **Sight (Golden Compass):** Briefly illuminates a glowing safe path on the grid leading directly to the Golden Tile, helping players navigate when the board gets cluttered.

**Rare (Blue Drops) - Strong utility, drops occasionally:**
- **The Anchor:** For 5 seconds, the player is immune to all forced movement. They will not slide on Mud Pits, and Siren Currents will not pull them. When they hit "rest," they stop instantly with zero sliding.
- **Dash:** Upgrades their movement. Instead of walking, the next continuous movement input makes the player rapidly zip across 3 tiles in a flash, instantly clearing small hazards.
- **Health Potion (+1 HP):** Permanently restores a lost health point.

**Legendary (Gold Drops) - Overpowered, drops very rarely:**
- **Invincibility Aura:** The player flashes golden and can walk straight through all red tiles, physical obstacles, mud, and currents for 5 seconds without taking damage or penalty.
- **Time Stop:** Freezes the Boss, halts all hazard timers, and stops all attack animations entirely for 3 seconds, allowing the player a stress-free stroll to the golden tile.
- **Teleport (The Blink):** The moment this is picked up, the player instantly snaps directly to the Golden Tile, bypassing the grid entirely and dealing immediate damage to the boss. Perfect for clutch saves on huge boards.

#### Core Game Loop
1. **Telegraph:** Hazards and attacks glow red (1.5s - 2.0s).
2. **Attack Execution:** Hazards deal damage/effects to specific tiles.
3. **Power-up Drops:** RNG determines if a safe tile spawns a tier-based drop.
4. **Boss Vulnerability:** Every few waves, a Golden Tile spawns (guaranteed safe path). Player must reach it to deal damage.

---

### 5.5 Chapter / Level Design

#### Chapter 1: Manananggal
| Property | Value |
|----------|-------|
| **Theme** | The Brake Pedal |
| **Grid** | 5x5 (25 tiles) |
| **Objective** | The player reaches the edges quickly, so the primary goal is mastering the "rest" gesture to stop exactly on the golden tile without overshooting. |
| **Drops** | Only Common power-ups drop here. |

**Attack Patterns:**
1. **Blood Drops (Spot Dodging):** 3 to 4 random tiles flash red. This teaches the player to navigate a simple, non-linear path.
2. **The Huntress (Player Tracking):** A red square appears exactly where the player is currently standing, forcing immediate movement.
3. **The Wandering Torso (Dynamic Obstacle):** The Manananggal─™s severed lower half drops onto the board as a 1x1 physical barrier. It slowly and aimlessly walks around the grid. The player cannot stop on or walk through this tile, forcing them to steer around it.

#### Chapter 2: Bungisngis
| Property | Value |
|----------|-------|
| **Theme** | Geometry and Momentum |
| **Grid** | 7x7 (49 tiles) |
| **Objective** | The player must navigate around permanent obstacles and deal with hazards that mess with their braking distance. |
| **Drops** | Common and Rare power-ups drop here. |

**Attack Patterns:**
1. **The X-Crush (Diagonals):** A massive pixel-art "X" flashes across the grid, striking the center and all four corners.
2. **Boisterous Laugh (Concentric Rings):** A red hazard hits the center tile. A second later, the 8 surrounding tiles turn red, expanding outward like a shockwave. The player must "surf" the expanding wave.
3. **The Mud Pit (Momentum Shift):** The Bungisngis rips up the ground, creating a 3x3 patch of mud. If the player makes their "rest" gesture while on the mud, they helplessly slide two extra tiles in their current direction.
4. **Heavy Lockdown (Static Obstacle):** The boss drops a heavy visual blocker──like a padlock and chain overlay──onto a 2x2 section of the grid. This permanently blocks those tiles for a set duration, turning the open board into a maze.

#### Chapter 3: Kataw
| Property | Value |
|----------|-------|
| **Theme** | Epic Scale and Changing Currents |
| **Grid** | 9x9 (81 tiles) |
| **Objective** | The attacks here cover huge areas and physically manipulate the player's positioning. |
| **Drops** | Common, Rare, and Legendary power-ups all drop here. |

**Attack Patterns:**
1. **Tidal Wave (Half-Board):** A massive wave covers exactly half the board (left, right, top, or bottom). The player must hold their movement gesture and race the wave to the safe zone.
2. **Whirlpool (Persistent Hazard):** A 2x2 water hazard spawns and slowly drifts across the massive board. The player must continuously route around it while chasing the golden tile.
3. **Siren's Current (Forced Movement):** A fast-flowing stream of water cuts completely across a row or column. Walking into this current instantly doubles the player's movement speed and yanks them toward the edge of the board. They must quickly execute a rest gesture to escape.
4. **The Geyser Trap (Disorientation):** Four tiles flash red. If struck, a geyser launches the player to a completely random safe tile on the huge board, disorienting them and forcing them to re-evaluate their route.
5. **The Siren's Trap (Combo Attack):** The Kataw spawns a Siren's Current while simultaneously dropping Chapter 1 Spot Dangers, forcing the player to navigate fast currents while dodging precise strikes.

### 5.6 HUD & In-Game UI

**Reference:** Based on `game-ref.png` layout

#### Top-Left Panel ── Status Display
```
┌──────────────────┐
┐‚ LIFE ─™¥─™¥─™¥         ┐‚  ─† Hearts from GUISprite.png
┐‚ ─────────────    ┐‚  ─† Boss HP bar (GUISprite.png)
┐‚ [Boss Portrait]  ┐‚  ─† Current boss sprite
┐‚                  ┐‚
┐‚ ─š¡ Speed 0:05    ┐‚  ─† Active powerup + remaining time
┐‚ ðŸ›¡ï¸ Shield 0:12  ┐‚
┐─┐˜
```

#### Bottom-Left Panel ── Camera Feed
```
┌──────────────────┐
┐‚                  ┐‚
┐‚  [Camera Feed]   ┐‚  ─† Live camera feed (small, ~20% of screen width)
┐‚  [Hand skeleton  ┐‚  ─† MediaPipe skeleton overlay drawn on canvas
┐‚   overlay]       ┐‚
┐‚                  ┐‚
┐‚ Gesture: ─–² UP    ┐‚  ─† Current detected gesture label
┐─┐˜
```
- If privacy mode ON: Camera feed shows black with only the hand skeleton drawn
- Gesture label text updates in real-time showing what the system detects

#### Bottom Bar ── Score & Timer
```
┌──────────────────────────────────────┐
┐‚ Score: 12,500  ┐‚  Time: 02:34  ┐‚ Ch.1┐‚
┐─┐˜
```

#### In-Game Settings Access
- Small **─š™ï¸ gear icon** in top-right corner
- Tapping pauses the game and opens settings overlay
- Same settings as main menu settings (camera privacy, sound, sensitivity)

---

### 5.7 Settings System

**Goal:** Comprehensive settings accessible from both main menu and in-game.

#### Settings Categories

##### ðŸŽ¥ Camera & Privacy
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Camera Privacy Mode | Toggle | OFF | Black screen overlay ── camera still processes hand data but user can't see their face |
| Camera Position | Dropdown | Bottom-Left | Where camera feed appears (Bottom-Left, Bottom-Right, Hidden) |
| Show Hand Skeleton | Toggle | ON | Draw MediaPipe landmark connections over the feed |

##### ðŸ─Š Audio
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Master Volume | Slider | 80% | Overall volume |
| Music Volume | Slider | 70% | Background music |
| SFX Volume | Slider | 90% | Sound effects |
| Mute All | Toggle | OFF | Quick mute |

##### ðŸŽ® Gesture Control
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Detection Sensitivity | Slider | 75% | KNN confidence threshold (50%-95%) |
| Move Debounce | Slider | 150ms | Time gesture must hold before registering (100-300ms) |
| Preferred Hand | Dropdown | Any | Left / Right / Any |

##### ðŸŽ¨ Display
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Screen Shake | Toggle | ON | Screen shake on impacts |
| Particle Effects | Toggle | ON | Particle effects (reduce for performance) |
| Show FPS | Toggle | OFF | Debug FPS counter |

#### Storage
- All settings saved to `localStorage` under key `bata_takbo_settings`
- Loaded on app start, applied immediately
- Settings object shape:
```javascript
{
  camera: { privacyMode: false, position: 'bottom-left', showSkeleton: true },
  audio: { master: 0.8, music: 0.7, sfx: 0.9, muted: false },
  gesture: { sensitivity: 0.75, debounce: 150, preferredHand: 'any' },
  display: { screenShake: true, particles: true, showFps: false }
}
```

---

### 5.8 Account & Leaderboard System

**Goal:** Optional accounts for leaderboard competition. Game is fully playable without an account.

#### Account Types
| Type | Can Play | Leaderboard | Save Progress Cloud |
|------|----------|-------------|---------------------|
| **Guest** (no account) | ─… | ─Œ | ─Œ (local only) |
| **Registered** | ─… | ─… | ─… |

#### Auth Flow
```
┌──────────────────────────────────┐
┐‚        LEADERBOARD               ┐‚
┐‚                                  ┐‚
┐‚  ðŸ† Top Scores ── Chapter 1      ┐‚
┐‚  ──────────────────────────      ┐‚
┐‚  1. PlayerX .......... 25,400   ┐‚
┐‚  2. BossSlayer ....... 22,100   ┐‚
┐‚  3. GestureKing ...... 19,800   ┐‚
┐‚  ...                            ┐‚
┐‚                                  ┐‚
┐‚  ┌────────────────────────────┐  ┐‚
┐‚  ┐‚ Sign in to submit scores! ┐‚  ┐‚
┐‚  ┐‚                            ┐‚  ┐‚
┐‚  ┐‚  [ðŸ“§ Email/Password]      ┐‚  ┐‚
┐‚  ┐‚  [ðŸ─µ Sign in with Google] ┐‚  ┐‚
┐‚  ┐‚  [ðŸ“ Create Account]      ┐‚  ┐‚
┐‚  ┐─┐˜  ┐‚
┐‚                                  ┐‚
┐‚  ◀ BACK                         ┐‚
┐─┐˜
```

#### Firebase Auth Setup
- **Email/Password** registration with email verification
- **Google Sign-In** via Firebase Auth redirect flow
- Display name required (profanity filter applied)
- Password requirements: 8+ chars, 1 number, 1 special char

#### Leaderboard Data Model (Firestore)
```
/leaderboard/{chapterId}/scores/{scoreId}
{
  userId: string,          // Firebase UID
  displayName: string,     // Player display name
  score: number,           // Points
  clearTime: number,       // Seconds to clear (null if died)
  chapter: number,         // 1, 2, or 3
  completed: boolean,      // Did they beat the boss?
  timestamp: Timestamp,    // When the score was submitted
  verified: boolean        // Server-side verification flag
}

/users/{userId}
{
  displayName: string,
  createdAt: Timestamp,
  chaptersCompleted: [1],  // Array of completed chapter numbers
  totalPlayTime: number,   // Seconds
  bestScores: {            // Quick lookup
    chapter1: { score: 25400, clearTime: 145 },
    chapter2: null,
    chapter3: null
  }
}
```

#### Leaderboard Views
| View | Sorted By | Description |
|------|-----------|-------------|
| **High Score** | `score` DESC | Who got the most points |
| **Speed Run** | `clearTime` ASC | Fastest chapter clear (completed only) |
| **Global** | Across all chapters | Combined best scores |

#### Anti-Cheat Measures
- Score submissions include a hash of game state checkpoints
- Server-side score validation: max possible score per wave Ã— waves survived
- Rate limiting: Max 1 submission per 30 seconds per user
- Anomaly detection: Flag scores > 3 standard deviations above mean
- Client sends game replay data (compressed action log) for verification

---

### 5.9 Spellbook / Bestiary

**Goal:** A lore-rich reference unlocked through gameplay ── info about each boss and their attack patterns.

#### Structure
```
┌────────────────────────────────────┐
┐‚          ðŸ“– SPELLBOOK              ┐‚
┐‚                                    ┐‚
┐‚  ┌──────────────────────────────┐  ┐‚
┐‚  ┐‚  CHAPTER 1: The RedCap      ┐‚  ┐‚  ─† Unlocked (beaten or seen)
┐‚  ┐‚  [Boss Portrait]             ┐‚  ┐‚
┐‚  ┐‚  "A malicious fae creature   ┐‚  ┐‚
┐‚  ┐‚   that lurks in dungeons..." ┐‚  ┐‚
┐‚  ┐‚                              ┐‚  ┐‚
┐‚  ┐‚  Known Attacks:              ┐‚  ┐‚
┐‚  ┐‚  ─… Scatter Shot             ┐‚  ┐‚  ─† Unlocked after experiencing
┐‚  ┐‚  ─… Column Drop              ┐‚  ┐‚
┐‚  ┐‚  ─… Row Sweep                ┐‚  ┐‚
┐‚  ┐‚  ─“ ????????                 ┐‚  ┐‚  ─† Locked (not yet seen)
┐‚  ┐‚  ─“ ????????                 ┐‚  ┐‚
┐‚  ┐─┐˜  ┐‚
┐‚                                    ┐‚
┐‚  ┌──────────────────────────────┐  ┐‚
┐‚  ┐‚  CHAPTER 2: ðŸ─’ LOCKED       ┐‚  ┐‚
┐‚  ┐‚  "Defeat Chapter 1 to       ┐‚  ┐‚
┐‚  ┐‚   reveal this boss..."      ┐‚  ┐‚
┐‚  ┐─┐˜  ┐‚
┐‚                                    ┐‚
┐‚  ┌──────────────────────────────┐  ┐‚
┐‚  ┐‚  CHAPTER 3: ðŸ─’ LOCKED       ┐‚  ┐‚
┐‚  ┐─┐˜  ┐‚
┐‚                                    ┐‚
┐‚  ◀ BACK                           ┐‚
┐─┐˜
```

#### Unlock Logic
- Boss entry unlocked when player **fights** the boss (even if they lose)
- Individual attack patterns unlocked when the player **survives that specific pattern** in battle
- Stored in `localStorage` under key `bata_takbo_bestiary`

---

### 5.10 Webcam Capture Feature

**Goal:** After dying or clearing a chapter, capture the player's reaction ── a "webcam toy" moment.

#### Flow
```
Boss Defeated / Player Dies
        ┐‚
        ▼
┌────────────────────────────┐
┐‚   CHAPTER COMPLETE! ðŸŽ‰    ┐‚   or   "YOU DIED ðŸ’─"
┐‚                            ┐‚
┐‚   Score: 15,250            ┐‚
┐‚   Time: 3:22               ┐‚
┐‚   Stars: ─­─­─­            ┐‚
┐‚                            ┐‚
┐‚   ┌────────────────────┐   ┐‚
┐‚   ┐‚                    ┐‚   ┐‚
┐‚   ┐‚  [Live Camera Feed ┐‚   ┐‚
┐‚   ┐‚   with fun pixel   ┐‚   ┐‚
┐‚   ┐‚   art frame around ┐‚   ┐‚
┐‚   ┐‚   it + confetti    ┐‚   ┐‚
┐‚   ┐‚   particles]       ┐‚   ┐‚
┐‚   ┐‚                    ┐‚   ┐‚
┐‚   ┐─┐˜   ┐‚
┐‚                            ┐‚
┐‚   ðŸ“¸ CAPTURE MOMENT        ┐‚  ─† Takes a screenshot
┐‚   ðŸ─„ RETRY                 ┐‚
┐‚   ðŸ  MAIN MENU             ┐‚
┐‚   ðŸ† SUBMIT TO LEADERBOARD ┐‚  ─† Only if logged in
┐‚                            ┐‚
┐─┐˜
```

#### Technical Implementation
1. Camera feed continues after game ends
2. Overlay a pixel-art frame (from `GameplayUI/` assets) around the camera feed
3. Add CSS particle effects (confetti for victory, dark particles for death)
4. **"CAPTURE MOMENT"** button:
   - Uses `<canvas>.drawImage(videoElement, ...)` to capture the current camera frame
   - Composites the frame overlay + score text onto the canvas
   - Converts to PNG via `canvas.toDataURL('image/png')`
   - Triggers download or opens share dialog (`navigator.share()` on mobile)
5. Captured image NEVER uploaded to any server ── stays on device only

---

### 5.11 Tutorial System

**Goal:** A comprehensive but non-overwhelming introduction that teaches gesture setup and gameplay.

#### Tutorial Phases

##### Phase 1: First Launch Tutorial (Auto-triggered once)
```
Step 1: "Welcome to Bata, Takbo! ðŸŽ®"
        "In this game, you'll use your HANDS to control your character!"
        [Hero image of the game]
        
Step 2: "First, let's set up your gestures."
        "You'll teach the game YOUR unique hand gestures for moving."
        [Animated diagram showing hand ─†’ direction mapping]
        ─†’ Redirects to Gesture Training with guided overlay

Step 3: [In Gesture Training with extra tutorial overlays]
        "Make a gesture for UP ─–² ── like raising a finger!"
        "Now hold the RECORD button..."
        "Great! You recorded 15 samples!"
        ─†’ Repeat for DOWN, LEFT, RIGHT

Step 4: "Now let's test!"
        "Make your gestures and see if the arrows light up."
        [Test mode with big directional arrows on screen]
        
Step 5: "You're ready! Let's try the game."
        ─†’ Redirects to Chapter 1 with in-game tutorial overlay
```

##### Phase 2: In-Game Tutorial (First Chapter 1 attempt)
```
Wave 1 (scripted):
  "See the RED tiles? ðŸ─´ That's where projectiles will land!"
  "Move AWAY from red tiles using your hand gestures!"
  [Slow-mo first attack ── 2 tiles only, extra-long telegraph]

Wave 2 (scripted):
  "Nice dodge! Now watch the GOLDEN tile appear..."
  "Move to the GOLDEN tile ─­ to DAMAGE the boss!"
  [Golden tile appears near player, generous time window]

Wave 3+:
  "You've got the hang of it! The boss won't hold back now..."
  [Normal gameplay begins]
```

##### Phase 3: Contextual Help
- **"?"** button in top-right during gameplay ─†’ shows control reminder overlay
- Gesture Training screen always has help text visible
- Settings have tooltip explanations for each option

#### Tutorial State
- `localStorage.bata_takbo_tutorial = { firstLaunchComplete: bool, chapterTutorialComplete: { 1: bool, 2: bool, 3: bool } }`
- User can re-trigger tutorial from Settings

---

### 5.12 About / Credits Screen

**Goal:** Proper attribution for all assets used, game info, and developer credits.

#### Sections
1. **About the Game** ── Brief description, version number
2. **Developers** ── Names/handles of the development team
3. **Asset Credits** ── Attribution for every third-party asset:
   - Sprite artists ─†’ link to their pages
   - Font creators ─†’ license info
   - SFX/Music ─†’ license info
   - MediaPipe ─†’ Google attribution
   - Phaser.js ─†’ MIT license acknowledgment
4. **Licenses** ── Full text of applicable licenses (MIT, CC-BY, etc.)
5. **Privacy Policy** ── Explain that camera data stays on-device, no tracking, etc.
6. **Contact** ── How to reach the developers

---

## 6. Security Plan

> [!CAUTION]
> Security is the **highest priority** for this project. The game accesses the user's camera, which requires extreme care around privacy and data handling.

### 6.1 Camera & Privacy Security
| Measure | Implementation |
|---------|---------------|
| **On-device processing only** | All MediaPipe + KNN processing happens in-browser. No video frames EVER sent to servers |
| **Permission prompt** | Use standard `navigator.mediaDevices.getUserMedia()` ── browser handles permission UI |
| **Privacy mode** | Camera feed can be hidden (black overlay) while still processing landmarks |
| **No recording** | Camera feed is live only ── no frames buffered/stored except explicit user-initiated capture |
| **Capture stays local** | Webcam toy captures download as local files, never uploaded |
| **Gesture data local** | Trained KNN model stored only in IndexedDB ── never synced to cloud |
| **Camera indicator** | Show a clear ðŸ─´ recording indicator when camera is active |

### 6.2 Authentication Security
| Measure | Implementation |
|---------|---------------|
| **Firebase Auth** | Industry-standard auth, managed by Google |
| **HTTPS only** | PWA served over HTTPS ── enforced by service worker |
| **Token refresh** | Firebase handles JWT refresh automatically |
| **Password hashing** | Handled by Firebase (bcrypt + salt server-side) |
| **Email verification** | Required before leaderboard submission |
| **Session management** | `firebase.auth().setPersistence(LOCAL)` ── secure local storage |

### 6.3 Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own profile
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Leaderboard: anyone can read, only authenticated users can write their own scores
    match /leaderboard/{chapterId}/scores/{scoreId} {
      allow read: if true;
      allow create: if request.auth != null 
                    && request.resource.data.userId == request.auth.uid
                    && request.resource.data.score is number
                    && request.resource.data.score >= 0
                    && request.resource.data.score <= 100000;
      allow update, delete: if false; // Scores are immutable
    }
  }
}
```

### 6.4 Client-Side Security
| Measure | Implementation |
|---------|---------------|
| **CSP Headers** | Strict Content-Security-Policy |
| **Input sanitization** | Display names sanitized ── no HTML injection |
| **Profanity filter** | Display names checked against filter before save |
| **Rate limiting** | Leaderboard: max 1 submission per 30s (client) + Firestore rules |
| **No eval()** | Code never uses eval or innerHTML with user data |
| **Dependency audit** | Regular npm audit + Snyk |
| **CORS** | Firebase handles CORS automatically |

### 6.5 PWA Security
| Measure | Implementation |
|---------|---------------|
| **HTTPS enforced** | Service worker only registers over HTTPS |
| **Subresource Integrity** | Critical CDN resources use SRI hashes |
| **Cache poisoning prevention** | Cache-busted filenames on build |
| **Update mechanism** | Service worker checks for updates, prompts user to refresh |

---

## 7. Folder Structure

```
Bata-Takbo---A-Survival-Game/
┐─ Game Assets/                     # All art assets (existing)
┐‚   ┐─ UI/
┐‚   ┐─ Main Font/
┐‚   ┐─ Male Character/
┐‚   ┐─ Female Character/
┐‚   ┐─ Static Loots/
┐‚   ┐─ Platform Design/
┐‚   ┐─ Platform Design2/
┐‚   ┐─ Game FX/
┐‚   ┐─ GameplayUI/
┐‚   ┐─ PowerUpsUI/
┐‚   ┐─ Chest Sprite/
┐‚
┐─ GUIDES/                          # Documentation (this file)
┐‚   ┐─ implementation_plan.md
┐‚
┐─ web/                             # ─­ THE APP (new)
┐‚   ┐─ index.html                   # PWA entry point
┐‚   ┐─ manifest.json                # PWA manifest
┐‚   ┐─ sw.js                        # Service worker
┐‚   ┐─ vite.config.js               # Vite configuration
┐‚   ┐─ package.json                 # Dependencies
┐‚   ┐‚
┐‚   ┐─ public/                      # Static assets (copied to dist)
┐‚   ┐‚   ┐─ assets/                  # Game assets (copied/optimized from Game Assets/)
┐‚   ┐‚   ┐‚   ┐─ ui/
┐‚   ┐‚   ┐‚   ┐─ fonts/
┐‚   ┐‚   ┐‚   ┐─ characters/
┐‚   ┐‚   ┐‚   ┐─ projectiles/
┐‚   ┐‚   ┐‚   ┐─ platforms/
┐‚   ┐‚   ┐‚   ┐─ fx/
┐‚   ┐‚   ┐‚   ┐─ gui/
┐‚   ┐‚   ┐‚   ┐─ audio/
┐‚   ┐‚   ┐─ icons/                   # PWA icons
┐‚   ┐‚
┐‚   ┐─ src/
┐‚   ┐‚   ┐─ main.js                  # App entry point
┐‚   ┐‚   ┐─ index.css                # Global styles & design system
┐‚   ┐‚   ┐‚
┐‚   ┐‚   ┐─ screens/                 # UI Screens (HTML/CSS/JS)
┐‚   ┐‚   ┐‚   ┐─ MainMenu.js
┐‚   ┐‚   ┐‚   ┐─ ChapterSelect.js
┐‚   ┐‚   ┐‚   ┐─ GestureTraining.js
┐‚   ┐‚   ┐‚   ┐─ Spellbook.js
┐‚   ┐‚   ┐‚   ┐─ Leaderboard.js
┐‚   ┐‚   ┐‚   ┐─ Settings.js
┐‚   ┐‚   ┐‚   ┐─ About.js
┐‚   ┐‚   ┐‚   ┐─ Tutorial.js
┐‚   ┐‚   ┐‚   ┐─ ResultsScreen.js
┐‚   ┐‚   ┐‚
┐‚   ┐‚   ┐─ game/                    # Phaser Game Scenes
┐‚   ┐‚   ┐‚   ┐─ GameScene.js         # Main gameplay scene
┐‚   ┐‚   ┐‚   ┐─ HUDScene.js          # Overlay HUD scene (runs parallel)
┐‚   ┐‚   ┐‚   ┐─ PauseScene.js        # Pause menu overlay
┐‚   ┐‚   ┐‚   ┐─ Grid.js              # Grid system & tile management
┐‚   ┐‚   ┐‚   ┐─ Player.js            # Player entity
┐‚   ┐‚   ┐‚   ┐─ Boss.js              # Boss entity & AI
┐‚   ┐‚   ┐‚   ┐─ Projectile.js        # Projectile system
┐‚   ┐‚   ┐‚   ┐─ PowerUp.js           # Power-up system
┐‚   ┐‚   ┐‚   ┐─ AttackPatterns.js     # All attack pattern definitions
┐‚   ┐‚   ┐‚   ┐─ chapters/
┐‚   ┐‚   ┐‚   ┐‚   ┐─ Chapter1.js      # RedCap config & patterns
┐‚   ┐‚   ┐‚   ┐‚   ┐─ Chapter2.js      # Chapter 2 config
┐‚   ┐‚   ┐‚   ┐‚   ┐─ Chapter3.js      # Chapter 3 config
┐‚   ┐‚   ┐‚   ┐─ effects/
┐‚   ┐‚   ┐‚       ┐─ ExplosionFX.js
┐‚   ┐‚   ┐‚       ┐─ ImpactFX.js
┐‚   ┐‚   ┐‚       ┐─ SpellFX.js
┐‚   ┐‚   ┐‚
┐‚   ┐‚   ┐─ gesture/                 # ML & Gesture System
┐‚   ┐‚   ┐‚   ┐─ CameraManager.js     # Camera access, permission, privacy
┐‚   ┐‚   ┐‚   ┐─ HandDetector.js      # MediaPipe Hands wrapper
┐‚   ┐‚   ┐‚   ┐─ GestureClassifier.js # KNN classifier + normalization
┐‚   ┐‚   ┐‚   ┐─ GestureTrainer.js    # Training logic (record, save, load)
┐‚   ┐‚   ┐‚   ┐─ GestureEventBus.js   # Gesture ─†’ game event emitter
┐‚   ┐‚   ┐‚
┐‚   ┐‚   ┐─ auth/                    # Authentication & Leaderboard
┐‚   ┐‚   ┐‚   ┐─ FirebaseConfig.js    # Firebase initialization
┐‚   ┐‚   ┐‚   ┐─ AuthManager.js       # Sign-in, sign-up, sign-out
┐‚   ┐‚   ┐‚   ┐─ LeaderboardAPI.js    # Firestore CRUD for scores
┐‚   ┐‚   ┐‚
┐‚   ┐‚   ┐─ audio/                   # Audio System
┐‚   ┐‚   ┐‚   ┐─ AudioManager.js      # Howler.js wrapper
┐‚   ┐‚   ┐‚   ┐─ tracks.js            # Track definitions
┐‚   ┐‚   ┐‚
┐‚   ┐‚   ┐─ utils/                   # Utilities
┐‚   ┐‚       ┐─ StateManager.js      # Global state & event bus
┐‚   ┐‚       ┐─ StorageManager.js    # localStorage + IndexedDB helper
┐‚   ┐‚       ┐─ ScreenManager.js     # Screen navigation (SPA routing)
┐‚   ┐‚       ┐─ ProfanityFilter.js   # Display name validation
┐‚   ┐‚
┐‚   ┐─ firebase/                    # Firebase configuration
┐‚       ┐─ firestore.rules
┐‚       ┐─ firebase.json
┐‚
┐─ README.md
```

## 8. Development Phases & Timeline

Below is the current progression state of the project.
**Status Key:** `[x]` = Done | `[/]` = In Progress | `[ ]` = To Do

### Phase 1: Foundation (UI & PWA Shell) — DONE
- `[x]` Initialize Vite project with all dependencies
- `[x]` Set up PWA manifest + service worker + HTTPS
- `[x]` Create CSS design system (fonts, colors, animations) using `DungeonFont.ttf` and `VCRosdNEUE.ttf`
- `[x]` Build screen navigation system (SPA router via `StateManager`)
- `[x]` Implement Main Menu with all buttons
- `[x]` Integrate `background.gif` and Main Title pixel art

### Phase 2: Gesture System Core — DONE
- `[x]` Implement CameraManager (permissions, privacy mode)
- `[x]` Integrate MediaPipe Hands (landmark detection)
- `[x]` Build landmark normalization pipeline
- `[x]` Implement KNN classifier (TensorFlow.js)
- `[x]` Build Gesture Training UI (record, progress, test mode)
- `[x]` Implement model persistence (IndexedDB save/load)
- `[x]` Add gesture event emitter for directional output (`game:direction`)

### Phase 3: Game Engine Core (Phaser 3) — DONE
- `[x]` Setup `Phaser.Game` configuration with `GameScene` and `HUDScene`
- `[x]` Build dynamic grid rendering and layout logic (Scalable tiles)
- `[x]` Player Entity implementation (smooth Grid Movement Tweens)
- `[x]` Boss State Machine groundwork (Idle, Attack, Telegraph phases)
- `[x]` Base hazard telegraphing logic (Red warning flashes)
- `[x]` Base projectile logic and player collision detection
- `[x]` Health system, Game Over state, and basic scoring
- `[x]` Local Node.js + SQLite backend server for dev testing
- `[x]` HUD panel polish (Hearts, Animated Boss portrait, Timer)

### Phase 4: Mechanics & The Power-Up Ecosystem — DONE
This phase focuses on the newly established Master Plan Fairness Rules and the tiered loot economy.
- `[x]` **Fairness Rules UI:** Implement visual 1.5 - 2.0 second red warning flash before ANY damage frame lands.
- `[x]` **Continuous Movement Integration:** Ensure character walks continuously when gesture is held, and snaps cleanly to the *center* of the nearest tile exactly when the "rest" gesture is detected.
- `[x]` **Golden Tile Logic:** Build dynamic spawning so the golden tile never spawns inside active hazards and spawns closer to the player on 7x7 and 9x9 grids to avoid arm fatigue.
- `[x]` **Common Drop Logic (Green):**
  - Implement *Speed Boosts* (+30% move speed).
  - Implement *Vitality* (Absorbs 1 hit, bad stop, or hazard).
  - Implement *Sight* (Compass that draws a glowing path to Golden Tile).
- `[x]` **Rare Drop Logic (Blue):**
  - Implement *The Anchor* (5s immunity to movement/sliding like mud or water currents + instant braking).
  - Implement *Dash* (Zip 3 tiles instantly on next move to bypass hazards).
  - Implement *Health Potion* (+1 permanent HP).
- `[x]` **Legendary Drop Logic (Gold):**
  - Implement *Invincibility Aura* (Walk through all red tiles, obstacles, and mud for 5 seconds without penalty).
  - Implement *Time Stop* (Freeze boss animations, timers, and attacks for 3 seconds).
  - Implement *Teleport/Blink* (Instant transmission to the active Golden Tile for immediate damage and clutch escapes).

### Phase 5: Complete Chapter Implementations — TO DO

#### Chapter 1: Manananggal (Grid Size: 5x5)
Theme: The Brake Pedal. Goal: Stop exactly on targets without overshooting.
- `[x]` Card Flip UI in Chapter Select.
- `[x]` Boss integration using the newly provided 3-phase robed boss sprites (Placeholder for Manananggal during development).
- `[ ]` **Attack 1:** *Spot Dodging*. 3 to 4 random tiles flash red.
- `[ ]` **Attack 2:** *Player Tracking*. Red square appears exactly tracking the player's current tile.
- `[ ]` **Attack 3:** *Dynamic Obstacle*. A 1x1 physical barrier drops on grid and slowly wanders, preventing tile access.

#### Chapter 2: Bungisngis (Grid Size: 7x7)
Theme: Geometry and Momentum. Goal: Deal with slippery terrain and large blocks.
- `[ ]` Unlock logic upon beating Ch 1.
- `[ ]` Layout definition for dynamic 7x7 setup.
- `[ ]` **Attack 1:** *The X-Crush* (Diagonals). Massive "X" strikes center and all 4 corners.
- `[ ]` **Attack 2:** *Boisterous Laugh*. Hazard hits center tile, then 8 surrounding tiles turn red 1 second later expanding like a shockwave.
- `[ ]` **Attack 3:** *The Mud Pit* (Momentum Shift). 3x3 mud patch. Resting on mud causes the player to slide exactly two extra tiles in their current direction.
- `[ ]` **Attack 4:** *Heavy Lockdown* (Static Obstacle). Padlock and chain overlay drops on a 2x2 grid section, permanently blocking it for a set duration.

#### Chapter 3: Kataw (Grid Size: 9x9)
Theme: Epic Scale and Changing Currents. Goal: Route around active water.
- `[ ]` Layout definition for large 9x9 setup.
- `[ ]` **Attack 1:** *Tidal Wave*. Sweeps exactly half the board (Top/Bottom/Left/Right).
- `[ ]` **Attack 2:** *Whirlpool*. A 2x2 water hazard spawns and persistently drifts across the board.
- `[ ]` **Attack 3:** *Siren's Current*. Fast stream cutting across a row/col. Entering it doubles speed and pulls player to edge until a rest gesture is executed to escape.
- `[ ]` **Attack 4:** *The Geyser Trap*. 4 flashing tiles that launch the player to a random safe tile if hit.
- `[ ]` **Attack 5:** *The Siren's Trap*. Combo attack spawning a Siren's Current alongside Chapter 1 Spot Dangers.

### Phase 6: Auth & Leaderboards — TO DO
- `[ ]` Connect Firebase Auth (Email/Google).
- `[ ]` Finalize SQLite/Cloud Firestore integration for scores.
- `[ ]` UI for High Score + Speed Run leaderboards.

### Phase 7: Polish, QA, and Deployment — TO DO
- `[ ]` Extensive balance testing on gesture input latency.
- `[ ]` Add global High-Fidelity Audio / SFX via Howler.js.
- `[ ]` Create Bestiary/Spellbook logs.
- `[ ]` Production PWA Deployment.
### Phase 8: Polish & Features (Week 11-12)
- [ ] Build Tutorial system (first launch + in-game)
- [ ] Build Spellbook/Bestiary with unlock logic
- [ ] Build Settings screen (all categories)
- [ ] Build About/Credits screen
- [ ] Implement webcam capture feature (results screen)
- [ ] Add all Game FX (explosions, impacts, spells)
- [ ] Add audio system (music + SFX via Howler.js)
- [ ] Polish animations and transitions
- [ ] Performance optimization for mobile

### Phase 9: Testing & Deployment (Week 13-14)
- [ ] Cross-device testing (iOS Safari, Android Chrome)
- [ ] Gesture accuracy testing on different devices/lighting
- [ ] Security audit (camera, auth, Firestore rules)
- [ ] PWA audit (Lighthouse score > 90)
- [ ] Deploy to hosting (Firebase Hosting or Vercel)
- [ ] Final balance pass on all chapters
- [ ] Bug fix sprint
---

## 9. Testing & QA Strategy

### Automated Testing
```bash
# Unit tests for game logic
npm run test:unit        # Vitest ── Grid, Boss AI, scoring, patterns

# E2E tests
npm run test:e2e         # Playwright ── menu navigation, auth flow
```

### Key Test Areas
| Area | Method | Coverage Target |
|------|--------|----------------|
| Grid system | Unit tests | All movement edge cases, wall collisions |
| Attack patterns | Unit tests | All patterns produce valid, dodgeable layouts |
| Scoring | Unit tests | Correct point accumulation |
| Gesture pipeline | Integration | End-to-end from landmarks ─†’ game movement |
| Auth flow | E2E | Register, login, submit score, view leaderboard |
| PWA install | Manual | Install on iOS + Android, offline play |
| Camera permissions | Manual | Permission grant, deny, revoke scenarios |
| Performance | Lighthouse | 60fps gameplay, <3s load, PWA score >90 |

### Device Testing Matrix
| Device | OS | Browser | Priority |
|--------|------|---------|----------|
| iPhone 13+ | iOS 16+ | Safari | ðŸ─´ High |
| Samsung Galaxy S21+ | Android 13+ | Chrome | ðŸ─´ High |
| iPad | iPadOS | Safari | ðŸŸ¡ Medium |
| Pixel 7 | Android | Chrome | ðŸŸ¡ Medium |
| Desktop | Windows/Mac | Chrome | ðŸŸ¢ Low (dev) |

---

## 10. Deployment

### Hosting Options
| Option | Pros | Cons |
|--------|------|------|
| **Firebase Hosting** ─­ | Free tier, CDN, auto HTTPS, integrates with Auth/Firestore | Google lock-in |
| Vercel | Great DX, free tier, edge functions | Separate from Firebase |
| Netlify | Similar to Vercel | Separate from Firebase |

**Recommendation:** Firebase Hosting ── keeps everything in one ecosystem.

### Build & Deploy Pipeline
```bash
# Build for production
npm run build        # Vite builds to dist/

# Deploy to Firebase
firebase deploy      # Deploys dist/ to Firebase Hosting
                     # Also deploys Firestore rules
```

### Environment Variables
```env
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
```

### PWA Installation Flow
1. User visits the URL on their phone
2. Chrome/Safari shows "Add to Home Screen" banner
3. User installs ─†’ appears as native app icon
4. On next launch: full-screen, no browser chrome, splash screen from manifest
5. Service worker caches all assets ─†’ works offline

---

## Appendix A: Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Game engine | Phaser 3 (not raw Canvas) | Sprite animation, tilemaps, tween system built-in |
| ML approach | KNN (not neural network) | Zero training time, works with 10-20 samples, instantly swappable |
| Auth provider | Firebase (not custom) | Security handled by Google, free tier sufficient |
| State management | Custom EventBus (not Redux) | Lightweight, no framework overhead |
| Audio | Howler.js (not Web Audio API directly) | Cross-browser compat, sprite audio, mobile unlock handling |
| CSS | Vanilla (not Tailwind) | Full control over pixel-art aesthetic, fewer dependencies |
| Layout | Single-page app (not multi-page) | Faster transitions, game state preservation |

## Appendix B: Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#0a0a1a` | Dark navy backgrounds |
| `--bg-secondary` | `#151530` | Panel backgrounds |
| `--text-primary` | `#f0e6d3` | Main text (warm white) |
| `--accent-orange` | `#ff6b1a` | Buttons, highlights (matches title) |
| `--accent-red` | `#e63946` | Danger, damage, health loss |
| `--accent-gold` | `#ffd700` | Stars, damage tile, achievements |
| `--accent-green` | `#2ecc71` | Success, health, chapter clear |
| `--glow-primary` | `rgba(255, 107, 26, 0.6)` | Orange glow on hover |
| `--glow-danger` | `rgba(230, 57, 70, 0.6)` | Red glow (telegraph tiles) |

## Appendix C: Power-Up Items

Using sprites from `PowerUpsUI/01-07.png`:

| Icon | Effect | Duration | Chapter |
|------|--------|----------|---------|
| 01.png | **Speed Boost** ── move 2 tiles per gesture | 8 seconds | All |
| 02.png | **Shield** ── absorb 1 hit without damage | Until hit | All |
| 03.png | **Time Slow** ── telegraphs last 2x longer | 10 seconds | Ch.2+ |
| 04.png | **Ghost** ── pass through walls | 6 seconds | Ch.2+ |
| 05.png | **Heart** ── restore 1 HP | Instant | All |
| 06.png | **Score Multiplier** ── 2x points | 15 seconds | All |
| 07.png | **Reveal** ── show next 2 attack patterns | Instant | Ch.3 |

Power-ups spawn on random tiles between attack waves. Player walks over them to collect.

---

> **End of Implementation Plan**
> 
> This document serves as the comprehensive guide for building Bata, Takbo! from scratch.
> All development should reference this plan, and any deviations should be documented in the GUIDES/ folder.
