/**
 * MainMenu — The main menu screen
 * Features animated background, floating title, and glowing menu buttons
 */
import { state } from '../utils/StateManager.js';

export const MainMenu = {
  render() {
    return `
      <div class="main-menu screen">
        <div class="main-menu__bg"></div>
        <div class="main-menu__content">
          <div class="main-menu__title-wrapper">
            <img 
              src="/assets/ui/Main_title.png" 
              alt="Bata, Takbo!" 
              class="main-menu__title"
              id="main-title-img"
            />
            <span class="main-menu__subtitle">A Survival Game</span>
          </div>

          <nav class="main-menu__nav stagger-children" id="main-menu-nav">
            <button class="menu-btn" id="btn-play" data-screen="chapter-select">
              Play
            </button>
            <button class="menu-btn" id="btn-gesture" data-screen="gesture-training">
              Gesture Setup
            </button>

            <div class="main-menu__separator"></div>

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
    const nav = el.querySelector('#main-menu-nav');
    const buttons = nav.querySelectorAll('.menu-btn');

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetScreen = btn.dataset.screen;
        if (targetScreen) {
          // Flash animation
          btn.style.animation = 'flashWhite 0.3s ease';
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
    // Cleanup if needed
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
