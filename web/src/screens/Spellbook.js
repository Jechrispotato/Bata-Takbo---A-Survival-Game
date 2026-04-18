/**
 * Spellbook — Boss bestiary / encyclopedia (unlocks through gameplay)
 */
import { state } from '../utils/StateManager.js';

export const Spellbook = {
  render() {
    const bestiary = state.get('bestiary') || {};

    const bosses = [
      {
        id: 'boss1',
        chapter: 1,
        name: "The Manananggal",
        desc: "A fearsome vampiric creature from Philippine folklore. By night, she detaches her upper torso and sprouts bat-like wings to hunt her prey from above.",
        attacks: [
          { name: 'Scatter Shot', desc: 'Throws items at random tiles' },
          { name: 'Column Drop', desc: 'Drops items on entire column' },
          { name: 'Row Sweep', desc: 'Sweeps items across a row' },
          { name: 'Diagonal Rain', desc: 'Items rain along diagonals' },
          { name: 'Center Blast', desc: 'Explosive blast in center area' },
        ],
        imgUnlocked: '/assets/ui/chapters/chapter1a.png',
        imgLocked: '/assets/ui/chapters/chapterBack.png',
      },
      {
        id: 'boss2',
        chapter: 2,
        name: "The Bungisngis",
        desc: "A fearsome folklore giant with a single eye and enormous tusks. His laugh paralyzes prey before his jungle magic unleashes deadly flora.",
        attacks: [
          { name: 'Beeswarm', desc: 'Insect swarm sweeping across 3 diagonal tiles' },
          { name: 'Pollen Burst', desc: 'Explosive chain reaction rings' },
          { name: 'Strangling Vines', desc: 'Traps player, requires rapid gesture QTE' },
          { name: 'Carrot Rain', desc: 'Heavy carrots falling on highlighted tiles' },
          { name: 'Exploding Seeds', desc: 'Seed pods that detonate after a delay' },
          { name: 'Snapping Flora', desc: 'Melee trap clamping on adjacent tiles' },
          { name: 'Acid Spitter', desc: 'Plants shooting horizontal lines of acid' },
        ],
        imgUnlocked: '/assets/ui/chapters/chapter2a.png',
        imgLocked: '/assets/ui/chapters/chapterBack.png',
      },
      {
        id: 'boss3',
        chapter: 3,
        name: "???",
        desc: "A terror that awaits only the most skilled survivors...",
        attacks: [],
        imgUnlocked: '/assets/ui/chapters/chapterBack.png',
        imgLocked: '/assets/ui/chapters/chapterBack.png',
      },
    ];

    const entriesHtml = bosses.map((boss, i) => {
      const isUnlocked = bestiary[boss.id]?.encountered;
      const unlockedAttacks = bestiary[boss.id]?.attacksSeen || [];
      
      const displayName = isUnlocked ? boss.name : '???';
      const displayDesc = isUnlocked ? boss.desc : '???';
      const displayImg = isUnlocked ? boss.imgUnlocked : boss.imgLocked;

      return `
        <div class="spellbook-entry ${isUnlocked ? '' : 'locked'}" 
             style="animation: fadeInUp 0.4s ease forwards; animation-delay: ${i * 0.15}s; opacity: 0;">
          <div style="display: flex; gap: var(--space-md); align-items: flex-start;">
            <img src="${displayImg}" alt="${displayName}" 
                 style="width: 120px; height: auto; flex-shrink: 0;" />
            <div>
              <div class="spellbook-entry__boss-name">
                ${isUnlocked ? displayName : '🔒 ' + displayName}
              </div>
              <div class="spellbook-entry__desc">"${displayDesc}"</div>
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
          Spellbook
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
