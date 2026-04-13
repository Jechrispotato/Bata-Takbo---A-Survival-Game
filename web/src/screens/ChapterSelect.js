/**
 * ChapterSelect — Chapter selection screen with 3 boss cards
 */
import { state } from '../utils/StateManager.js';

export const ChapterSelect = {
  render() {
    const progress = state.get('chapterProgress') || {};
    // If not set, default to [1]
    const unlocked = progress.chaptersUnlocked || [1];

    const chapters = [
      { id: 1, img: '/assets/ui/chapters/chapter1.png', name: 'Duende', chapterText: 'CHAPTER 1', accent: '#ff4c4c' },
      { id: 2, img: '/assets/ui/chapters/chapter1.png', name: 'Unknown', chapterText: 'CHAPTER 2', accent: '#4cff4c' },
      { id: 3, img: '/assets/ui/chapters/chapter1.png', name: 'Unknown', chapterText: 'CHAPTER 3', accent: '#4c4cff' },
    ];

    const cardsHtml = chapters.map((ch, i) => {
      const isUnlocked = unlocked.includes(ch.id);
      
      const content = isUnlocked 
        ? `\n      <button class="chapter-card__play text-btn" style="--accent: ${ch.accent};" data-chapter="${ch.id}">PLAY</button>`
        : `\n      <span class="chapter-card__lock-text">LOCKED</span>`;

      return `
        <div class="chapter-card ${isUnlocked ? '' : 'locked'}" 
             data-chapter="${ch.id}" 
             id="chapter-card-${ch.id}"
             style="animation: scaleIn 0.5s ease forwards; animation-delay: ${i * 0.15}s; opacity: 0; --card-accent: ${ch.accent};">
          <img src="${isUnlocked ? ch.img : '/assets/ui/chapters/locked-chapter.png'}" alt="${ch.name}" class="chapter-card__img" />
          <div class="chapter-card__info">
            <span class="chapter-card__number">${ch.chapterText}</span>
            <span class="chapter-card__title">${ch.name}</span>
          </div>
          <div class="chapter-card__action">
            ${content}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="chapter-select screen">
        <button class="back-btn" id="btn-ch-back">Back</button>
        <button class="menu-btn" id="btn-test-lock" style="position: absolute; top: var(--space-lg); right: var(--space-lg); font-size: 14px; padding: 10px;">TEST ANIMATION UNLOCK</button>
        
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
    // Test Unlock Button
    el.querySelector('#btn-test-lock').addEventListener('click', () => {
      let progress = state.get('chapterProgress') || { chaptersUnlocked: [1] };
      // Toggle Chapter 2 unlock state for demonstration
      if (progress.chaptersUnlocked.includes(2)) {
         progress.chaptersUnlocked = [1]; 
      } else {
         progress.chaptersUnlocked = [1, 2, 3];
      }
      state.set('chapterProgress', progress);
      // Force immediate re-render of this screen
      window.__screenManager.navigate('chapter-select', {}, true);
    });

    // Back button
    el.querySelector('#btn-ch-back').addEventListener('click', () => {
      window.__screenManager.back();
    });

    // Hook up play buttons
    const playBtns = el.querySelectorAll('.chapter-card__play');
    playBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Don't trigger the card flip if we have one
        const chapterId = parseInt(btn.dataset.chapter);
        
        // 1. Check if model is trained
        const isTrained = state.get('gestureModelTrained');
        
        if (!isTrained) {
          alert("WARNING: You haven't trained your hand gestures yet!\nPlease complete Gesture Setup first before playing.");
          return;
        }

        // Navigate to the WebGL Phaser Engine
        window.__screenManager.navigate('game-screen', { chapterId });
      });
    });
  },
};
