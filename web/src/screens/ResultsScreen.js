import { state } from '../utils/StateManager.js';

export const ResultsScreen = {
  render() {
    const result = state.get('lastGameResult') || { isVictory: false, score: 0, timeSurvived: 0 };
    
    // Format mm:ss
    const m = Math.floor(result.timeSurvived / 60).toString().padStart(2, '0');
    const s = (result.timeSurvived % 60).toString().padStart(2, '0');
    
    return `
      <div class="results-screen screen" style="display: flex; flex-direction: column; align-items: center; justify-content: center; background-image: url('/assets/gui/with%20chair.png'); background-size: cover; background-position: center;">
        <h1 class="screen-title" style="color: ${result.isVictory ? 'var(--accent-gold)' : 'var(--accent-gold)'}; animation: scaleIn 0.5s ease;">
          ${result.isVictory ? 'CHAPTER CLEARED' : 'GAME OVER'}
        </h1>
        
        <div class="results-card" style="
          background: transparent;
          border: none;
          padding: var(--space-xl);
          min-width: 300px;
          text-align: center;
          margin: var(--space-xl) 0;
          animation: fadeInUp 0.5s 0.2s both;
        ">
          <div style="font-family: var(--font-ui); color: var(--text-dim); margin-bottom: var(--space-sm);">SURVIVAL TIME</div>
          <div style="font-family: 'DirtyHarold', sans-serif; font-size: 48px; color: #fff;">${m}:${s}</div>
          
          <div style="font-family: var(--font-ui); color: var(--text-dim); margin-top: var(--space-md); margin-bottom: var(--space-sm);">TOTAL SCORE</div>
          <div style="font-family: 'DirtyHarold', sans-serif; font-size: 56px; color: var(--accent-gold);">${result.score.toLocaleString()}</div>
        </div>

        <div style="display: flex; gap: var(--space-md); animation: fadeInUp 0.5s 0.4s both;">
          <button class="menu-btn" id="btn-results-retry" style="background: transparent; border: none;">RETRY</button>
          <button class="menu-btn" id="btn-results-menu" style="background: transparent; border: none;">MAIN MENU</button>
        </div>
      </div>
    `;
  },

  onEnter(el) {
    const result = state.get('lastGameResult') || { chapterId: 1 };

    el.querySelector('#btn-results-retry').addEventListener('click', () => {
      window.__screenManager.navigate('game-screen', { chapterId: result.chapterId });
    });

    el.querySelector('#btn-results-menu').addEventListener('click', () => {
      window.__screenManager.navigate('main-menu');
    });
  }
};
