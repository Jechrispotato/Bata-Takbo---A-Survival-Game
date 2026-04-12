import { state } from '../utils/StateManager.js';

export const ResultsScreen = {
  render() {
    const result = state.get('lastGameResult') || { isVictory: false, score: 0, timeSurvived: 0 };
    
    // Format mm:ss
    const m = Math.floor(result.timeSurvived / 60).toString().padStart(2, '0');
    const s = (result.timeSurvived % 60).toString().padStart(2, '0');
    
    return `
      <div class="results-screen screen" style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <h1 class="screen-title" style="color: ${result.isVictory ? '#ffd700' : '#ff3333'}; animation: scaleIn 0.5s ease;">
          ${result.isVictory ? 'CHAPTER CLEARED' : 'GAME OVER'}
        </h1>
        
        <div class="results-card" style="
          background: rgba(10, 10, 26, 0.9);
          border: 2px solid var(--accent-gold);
          border-radius: var(--radius-lg);
          padding: var(--space-xl);
          min-width: 300px;
          text-align: center;
          margin: var(--space-xl) 0;
          animation: fadeInUp 0.5s 0.2s both;
        ">
          <div style="font-family: var(--font-ui); color: var(--text-dim); margin-bottom: var(--space-sm);">SURVIVAL TIME</div>
          <div style="font-family: var(--font-display); font-size: var(--text-2xl); color: #fff;">${m}:${s}</div>
          
          <div style="font-family: var(--font-ui); color: var(--text-dim); margin-top: var(--space-md); margin-bottom: var(--space-sm);">TOTAL SCORE</div>
          <div style="font-family: var(--font-display); font-size: var(--text-3xl); color: var(--accent-gold);">${result.score.toLocaleString()}</div>
        </div>

        <div style="display: flex; gap: var(--space-md); animation: fadeInUp 0.5s 0.4s both;">
          <button class="menu-btn" id="btn-results-retry">RETRY</button>
          <button class="menu-btn" id="btn-results-menu" style="background: rgba(255,255,255,0.1);">MAIN MENU</button>
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
