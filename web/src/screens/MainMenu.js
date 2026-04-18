/**
 * MainMenu — The main menu screen
 * Features animated background, floating title, and glowing menu buttons
 * Background music fades out when the player clicks Play, but keeps playing
 * for all other menu screens (Spellbook, Gesture Setup, Settings, Leaderboard, About).
 */
import { state } from '../utils/StateManager.js';

// Module-level audio instance so music persists while browsing sub-menus
let _bgMusic = null;
let _fadeInterval = null;


export const MainMenu = {
  render() {
    return `
      <div class="main-menu screen">
        <video class="main-menu__video" src="/assets/ui/animated_main_menu.mp4" autoplay loop muted playsinline style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0;"></video>
        <div class="main-menu__bg" style="background-image: none;"></div>
        <div class="main-menu__content">
          <div class="main-menu__title-wrapper">
            <img 
              src="/assets/ui/Main_title.png" 
              alt="Bata, Takbo!" 
              class="main-menu__title"
              id="main-title-img"
            />
          </div>

          <nav class="main-menu__nav stagger-children" id="main-menu-nav">
            <button class="menu-btn" id="btn-play" data-screen="chapter-select">
              Play
            </button>
            <button class="menu-btn" id="btn-gesture" data-screen="gesture-training">
              Gesture Setup
            </button>

            <button class="menu-btn" id="btn-spellbook" data-screen="spellbook">
              Spellbook
            </button>
            <button class="menu-btn" id="btn-leaderboard" data-screen="leaderboard">
              Leaderboard
            </button>
            <button class="menu-btn" id="btn-settings" data-screen="settings">
              Settings
            </button>
            <button class="menu-btn" id="btn-about" data-screen="about">
              About
            </button>
          </nav>
        </div>

        <div class="main-menu__version">v0.1.0</div>
      </div>
    `;
  },

  onEnter(el) {
    // ── Background Music ──────────────────────────────────────────────────
    this._startMusic();

    const nav = el.querySelector('#main-menu-nav');
    const buttons = nav.querySelectorAll('.menu-btn');

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetScreen = btn.dataset.screen;
        if (!targetScreen) return;

        const isPlay = btn.id === 'btn-play';

        // Flash animation (always)
        btn.style.animation = 'flashWhite 0.3s ease';

        if (isPlay) {
          // Fade music out, THEN navigate
          this._fadeOutMusic(800, () => {
            btn.style.animation = '';
            window.__screenManager.navigate(targetScreen);
          });
        } else {
          // Music keeps playing; navigate after flash
          setTimeout(() => {
            btn.style.animation = '';
            window.__screenManager.navigate(targetScreen);
          }, 150);
        }
      });

      // Add subtle sound-like feedback on hover via animation
      btn.addEventListener('mouseenter', () => {
        btn.style.transition = 'all 0.15s ease';
      });
    });

    // Particles background effect
    this._createParticles(el);
  },

  onLeave() {
    // Music lifecycle is intentionally managed by the button click handlers:
    //   • Play button  → _fadeOutMusic() already paused & nulled _bgMusic
    //   • Other buttons → music keeps playing in the background while the
    //     player browses sub-menus (Spellbook, Settings, etc.)
    // Nothing to do here.
  },

  // ── Helpers ────────────────────────────────────────────────────────────

  _startMusic() {
    if (_bgMusic) {
      // Already playing (e.g. returned from a sub-menu that kept music alive).
      // Only do a fade-in if it was paused or at a very low volume.
      if (!_bgMusic.paused && _bgMusic.volume >= 0.4) return; // already at full vol
      _bgMusic.play().catch(() => {});
      this._fadeInMusic(1200);
      return;
    }

    _bgMusic = new Audio('/assets/audios/menu_bg_music.mp3');
    _bgMusic.loop = true;
    _bgMusic.volume = 0;
    _bgMusic.play().catch(() => {
      // Auto-play may be blocked; attach a one-shot user interaction listener
      const resume = () => {
        _bgMusic.play().catch(() => {});
        document.removeEventListener('pointerdown', resume);
      };
      document.addEventListener('pointerdown', resume, { once: true });
    });
    this._fadeInMusic(1200);
  },

  _stopMusic() {
    if (_fadeInterval) {
      clearInterval(_fadeInterval);
      _fadeInterval = null;
    }
    if (_bgMusic) {
      _bgMusic.pause();
      _bgMusic.currentTime = 0;
      _bgMusic = null;
    }
  },

  _fadeInMusic(durationMs) {
    if (!_bgMusic) return;
    if (_fadeInterval) clearInterval(_fadeInterval);

    const targetVolume = 0.5;
    const steps = 40;
    const stepTime = durationMs / steps;
    const increment = targetVolume / steps;

    _fadeInterval = setInterval(() => {
      if (!_bgMusic) { clearInterval(_fadeInterval); _fadeInterval = null; return; }
      _bgMusic.volume = Math.min(_bgMusic.volume + increment, targetVolume);
      if (_bgMusic.volume >= targetVolume) {
        clearInterval(_fadeInterval);
        _fadeInterval = null;
      }
    }, stepTime);
  },

  _fadeOutMusic(durationMs, onComplete) {
    if (!_bgMusic) { if (onComplete) onComplete(); return; }
    if (_fadeInterval) clearInterval(_fadeInterval);

    const startVolume = _bgMusic.volume;
    const steps = 40;
    const stepTime = durationMs / steps;
    const decrement = startVolume / steps;

    _fadeInterval = setInterval(() => {
      if (!_bgMusic) { clearInterval(_fadeInterval); _fadeInterval = null; if (onComplete) onComplete(); return; }
      _bgMusic.volume = Math.max(_bgMusic.volume - decrement, 0);
      if (_bgMusic.volume <= 0) {
        clearInterval(_fadeInterval);
        _fadeInterval = null;
        _bgMusic.pause();
        _bgMusic.currentTime = 0;
        _bgMusic = null;
        if (onComplete) onComplete();
      }
    }, stepTime);
  },

  _createParticles(container) {
    const bg = container.querySelector('.main-menu__bg');
    const particleCount = 15;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: absolute;
        width: ${Math.random() * 4 + 2}px;
        height: ${Math.random() * 4 + 2}px;
        background: rgba(255, 107, 26, ${Math.random() * 0.3 + 0.1});
        border-radius: 50%;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: particleFade ${Math.random() * 4 + 3}s ease-in-out infinite;
        animation-delay: ${Math.random() * 3}s;
        pointer-events: none;
        z-index: 1;
      `;
      bg.appendChild(particle);
    }
  },
};
