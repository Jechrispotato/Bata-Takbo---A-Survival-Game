/**
 * Leaderboard — Global leaderboard display (shell for Phase 1)
 * Firebase integration comes in Phase 5
 */
export const Leaderboard = {
  render() {
    // Mock data for now
    const mockEntries = [
      { rank: 1, name: 'JechrisPogi143', score: 25400 },
      { rank: 2, name: 'BossSlayer', score: 22100 },
      { rank: 3, name: 'DodgeMaster', score: 19800 },
      { rank: 4, name: 'PixelHero', score: 15200 },
      { rank: 5, name: 'SpeedRunner', score: 12600 },
      { rank: 6, name: 'NoHitWonder', score: 10400 },
      { rank: 7, name: 'CasualPro', score: 8900 },
      { rank: 8, name: 'FirstTimer', score: 5100 },
    ];

    const entriesHtml = mockEntries.map((entry, i) => `
      <div class="leaderboard-entry" 
           style="animation: slideInLeft 0.3s ease forwards; animation-delay: ${i * 0.06}s; opacity: 0;">
        <span class="leaderboard-entry__rank ${entry.rank <= 3 ? 'top-3' : ''}">
          ${entry.rank <= 3 
            ? ['<img src="/assets/ui/gold.png" alt="1st" style="height: 1.2em; vertical-align: middle;" />', 
               '<img src="/assets/ui/silver.png" alt="2nd" style="height: 1.2em; vertical-align: middle;" />', 
               '<img src="/assets/ui/bronze.png" alt="3rd" style="height: 1.2em; vertical-align: middle;" />'][entry.rank - 1] 
            : '#' + entry.rank}
        </span>
        <span class="leaderboard-entry__name">${entry.name}</span>
        <span class="leaderboard-entry__score">${entry.score.toLocaleString()}</span>
      </div>
    `).join('');

    return `
      <div class="leaderboard-screen screen">
        <button class="back-btn" id="btn-lb-back">Back</button>
        
        <h1 class="screen-title" style="animation: fadeInUp 0.4s ease forwards;">
          Leaderboard
        </h1>
        
        <div class="leaderboard-tabs" style="animation: fadeInUp 0.4s ease 0.1s forwards; opacity: 0;">
          <button class="leaderboard-tab active" data-tab="score" id="tab-score">High Score</button>
          <button class="leaderboard-tab" data-tab="speed" id="tab-speed">Speed Run</button>
          <button class="leaderboard-tab" data-tab="ch1" id="tab-ch1">Ch.1</button>
          <button class="leaderboard-tab" data-tab="ch2" id="tab-ch2">Ch.2</button>
          <button class="leaderboard-tab" data-tab="ch3" id="tab-ch3">Ch.3</button>
        </div>
        
        <div class="leaderboard-list scrollable" id="leaderboard-list">
          ${entriesHtml}
        </div>

        <div style="margin-top: var(--space-lg); text-align: center; animation: fadeInUp 0.4s ease 0.4s forwards; opacity: 0;">
          <p class="text-dim" style="font-size: var(--text-xs); margin-bottom: var(--space-sm);">
            Sign in to submit your scores!
          </p>
          <button class="menu-btn" id="btn-lb-signin" style="font-size: var(--text-sm);">
            Sign In / Register
          </button>
        </div>
      </div>
    `;
  },

  onEnter(el) {
    // Back button
    el.querySelector('#btn-lb-back').addEventListener('click', () => {
      window.__screenManager.back();
    });

    // Tab switching
    const tabs = el.querySelectorAll('.leaderboard-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        // TODO: Load leaderboard data for selected tab
      });
    });

    // Sign in (placeholder)
    el.querySelector('#btn-lb-signin').addEventListener('click', () => {
      alert('Account system coming in Phase 5!');
    });
  },
};
