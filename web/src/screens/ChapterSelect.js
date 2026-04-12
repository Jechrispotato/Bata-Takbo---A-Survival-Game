/**
 * ChapterSelect — Chapter selection screen with 3 boss cards
 */
import { state } from '../utils/StateManager.js';

export const ChapterSelect = {
  render() {
    const progress = state.get('chapterProgress');
    const unlocked = progress.chaptersUnlocked || [1];

    const chapters = [
      { id: 1, img: '/assets/ui/chapter-1.png', name: 'The RedCap\'s Lair' },
      { id: 2, img: '/assets/ui/chapter-2.png', name: 'Chapter 2' },
      { id: 3, img: '/assets/ui/chapter-3.png', name: 'Chapter 3' },
    ];

    const cardsHtml = chapters.map((ch, i) => {
      const isUnlocked = unlocked.includes(ch.id);
      return `
        <div class="chapter-card ${isUnlocked ? '' : 'locked'}" 
             data-chapter="${ch.id}" 
             id="chapter-card-${ch.id}"
             style="animation: scaleIn 0.5s ease forwards; animation-delay: ${i * 0.15}s; opacity: 0;">
          <img src="${ch.img}" alt="${ch.name}" class="chapter-card__img" />
        </div>
      `;
    }).join('');

    return `
      <div class="chapter-select screen">
        <button class="back-btn" id="btn-ch-back">Back</button>
        
        <h1 class="screen-title" style="animation: fadeInUp 0.5s ease forwards;">
          Select Chapter
        </h1>
        
        <div class="chapter-select__cards">
          ${cardsHtml}
        </div>
      </div>
    `;
  },

  onEnter(el) {
    const progress = state.get('chapterProgress');
    const unlocked = progress.chaptersUnlocked || [1];

    // Back button
    el.querySelector('#btn-ch-back').addEventListener('click', () => {
      window.__screenManager.back();
    });

    // Chapter cards
    el.querySelectorAll('.chapter-card').forEach(card => {
      const chapterId = parseInt(card.dataset.chapter);
      
      if (unlocked.includes(chapterId)) {
        card.addEventListener('click', () => {
          // Flash and navigate to game
          card.style.animation = 'flashWhite 0.3s ease';
          setTimeout(() => {
            // TODO: Navigate to game scene with chapter param
            console.log(`Starting Chapter ${chapterId}`);
            // window.__screenManager.navigate('game', { chapter: chapterId });
            alert(`Chapter ${chapterId} gameplay coming in Phase 3!`);
          }, 200);
        });
      }
    });
  },
};
