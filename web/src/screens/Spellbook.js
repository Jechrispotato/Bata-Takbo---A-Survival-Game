/**
 * Spellbook — Boss bestiary / encyclopedia (unlocks through gameplay)
 */
import { state } from '../utils/StateManager.js';

export const Spellbook = {
  render() {
    const bestiary = state.get('bestiary') || {};

    const bosses = [
      {
        id: 'redcap',
        chapter: 1,
        name: "The RedCap",
        desc: "A malicious fae creature that dwells in the darkest dungeons. Known for hurling cursed objects at trespassers, the RedCap's lair is littered with the remains of those who couldn't dodge its wrath.",
        attacks: [
          { name: 'Scatter Shot', desc: 'Throws items at random tiles' },
          { name: 'Column Drop', desc: 'Drops items on entire column' },
          { name: 'Row Sweep', desc: 'Sweeps items across a row' },
          { name: 'Diagonal Rain', desc: 'Items rain along diagonals' },
          { name: 'Center Blast', desc: 'Explosive blast in center area' },
        ],
        img: '/assets/ui/chapter-1.png',
      },
      {
        id: 'boss2',
        chapter: 2,
        name: "???",
        desc: "Defeat Chapter 1 to uncover this fearsome adversary...",
        attacks: [],
        img: '/assets/ui/chapter-2.png',
      },
      {
        id: 'boss3',
        chapter: 3,
        name: "???",
        desc: "A terror that awaits only the most skilled survivors...",
        attacks: [],
        img: '/assets/ui/chapter-3.png',
      },
    ];

    const entriesHtml = bosses.map((boss, i) => {
      const isUnlocked = bestiary[boss.id]?.encountered;
      const unlockedAttacks = bestiary[boss.id]?.attacksSeen || [];

      return `
        <div class="spellbook-entry ${isUnlocked ? '' : 'locked'}" 
             style="animation: fadeInUp 0.4s ease forwards; animation-delay: ${i * 0.15}s; opacity: 0;">
          <div style="display: flex; gap: var(--space-md); align-items: flex-start;">
            <img src="${boss.img}" alt="${boss.name}" 
                 style="width: 80px; height: auto; border-radius: var(--radius-md); border: 1px solid rgba(255,107,26,0.2); flex-shrink: 0;" />
            <div>
              <div class="spellbook-entry__boss-name">
                ${isUnlocked ? boss.name : '🔒 ' + boss.name}
              </div>
              <div class="spellbook-entry__desc">"${boss.desc}"</div>
              ${boss.attacks.length > 0 ? `
                <div style="margin-top: var(--space-sm);">
                  <div style="font-size: var(--text-xs); color: var(--accent-orange); letter-spacing: 1px; margin-bottom: var(--space-xs);">
                    KNOWN ATTACKS
                  </div>
                  ${boss.attacks.map(atk => {
                    const seen = unlockedAttacks.includes(atk.name);
                    return `
                      <div style="font-size: var(--text-xs); color: ${seen ? 'var(--text-secondary)' : 'var(--text-dim)'}; margin-bottom: 2px;">
                        ${seen ? '✅' : '❓'} ${seen ? atk.name : '????????'}
                      </div>
                    `;
                  }).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="spellbook-screen screen">
        <button class="back-btn" id="btn-spellbook-back">Back</button>
        
        <h1 class="screen-title" style="animation: fadeInUp 0.4s ease forwards;">
          📖 Spellbook
        </h1>
        
        <div class="spellbook-entries scrollable" style="margin-top: var(--space-lg);">
          ${entriesHtml}
        </div>
      </div>
    `;
  },

  onEnter(el) {
    el.querySelector('#btn-spellbook-back').addEventListener('click', () => {
      window.__screenManager.back();
    });
  },
};
