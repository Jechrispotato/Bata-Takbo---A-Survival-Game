/**
 * ChapterSelect — Chapter selection screen with flip-card mechanic
 */
import { state } from '../utils/StateManager.js';

export const ChapterSelect = {
  render() {
    const progress = state.get('chapterProgress') || {};
    const unlocked = progress.chaptersUnlocked || [1];

    const chapters = [
      { id: 1, img: '/assets/ui/chapters/chapter1.png', name: 'Duende' },
      { id: 2, img: '/assets/ui/chapters/chapter2.png', name: 'Unknown' },
      { id: 3, img: '/assets/ui/chapters/chapter3.png', name: 'Unknown' },
    ];

    const cardsHtml = chapters.map((ch, i) => {
      const isUnlocked = unlocked.includes(ch.id);
      // Unlocked → chapter#.png on front, Locked → chapterFront.png (lock art)
      const frontImg = isUnlocked ? ch.img : '/assets/ui/chapters/chapterFront.png';

      return `
        <div class="ch-flip-wrapper ${isUnlocked ? 'unlocked' : 'locked'}"
             data-chapter="${ch.id}"
             style="animation-delay: ${i * 0.12}s">
          <div class="ch-flip-inner">
            <!-- BACK face (default visible) -->
            <div class="ch-face ch-face--back">
              <img src="/assets/ui/chapters/chapterBack.png" alt="Chapter Back" />
            </div>
            <!-- FRONT face (revealed on hover) -->
            <div class="ch-face ch-face--front">
              <img src="${frontImg}" alt="${ch.name}" />
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="chapter-select screen">
        <div class="ambient-stars"></div>
        <div class="ambient-glow"></div>
        <button class="back-btn" id="btn-ch-back">Back</button>
        <button class="menu-btn" id="btn-test-lock" style="position: absolute; top: var(--space-lg); right: var(--space-lg); font-size: 14px; padding: 10px;">TEST UNLOCK</button>

        <h1 class="screen-title" style="animation: fadeInUp 0.5s ease forwards;">
          SELECT CHAPTER
        </h1>

        <div class="chapter-select__cards">
          ${cardsHtml}
        </div>
      </div>
    `;
  },

  onEnter(el) {
    // Test unlock toggle button (KEEP FOR TESTING)
    const testBtn = el.querySelector('#btn-test-lock');
    if (testBtn) {
      testBtn.addEventListener('click', () => {
        let progress = state.get('chapterProgress') || { chaptersUnlocked: [1] };
        if (progress.chaptersUnlocked.includes(2)) {
          progress.chaptersUnlocked = [1];
        } else {
          progress.chaptersUnlocked = [1, 2, 3];
        }
        state.set('chapterProgress', progress);
        window.__screenManager.navigate('chapter-select', {}, true);
      });
    }

    // Back button
    el.querySelector('#btn-ch-back').addEventListener('click', () => {
      window.__screenManager.back();
    });

    // Click on any UNLOCKED card → navigate to game
    el.querySelectorAll('.ch-flip-wrapper.unlocked').forEach(card => {
      card.addEventListener('click', () => {
        const chapterId = parseInt(card.dataset.chapter);

        const isTrained = state.get('gestureModelTrained');
        if (!isTrained) {
          alert("WARNING: You haven't trained your hand gestures yet!\nPlease complete Gesture Setup first before playing.");
          return;
        }

        window.__screenManager.navigate('game-screen', { chapterId });
      });
    });
  },
};
