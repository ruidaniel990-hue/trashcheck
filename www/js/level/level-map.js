// ── Level Map ──
// Candy-Crush-style level selection with sub-levels grouped by hotspot.

import { LEVELS, getLevelStageInfo } from './level-definitions.js';
import { getMaxUnlockedLevel, getLevelStars, isLevelUnlocked } from './level-progress.js';
import { HOTSPOTS } from '../hotspot/hotspot-data.js';
import { getBalance } from '../economy/coin-manager.js';

const hotspotMap = {};
HOTSPOTS.forEach(h => { hotspotMap[h.id] = h; });

export function renderLevelMap(onSelectLevel) {
  const container = document.getElementById('levelmap-path');
  const coinsEl = document.getElementById('map-coins');
  if (!container) return;
  if (coinsEl) coinsEl.textContent = getBalance();

  const maxUnlocked = getMaxUnlockedLevel();
  let html = '';
  let currentHotspotId = null;

  for (let i = 0; i < LEVELS.length; i++) {
    const def = LEVELS[i];
    const level = def.level;
    const hotspot = hotspotMap[def.hotspotId] || HOTSPOTS[0];
    const unlocked = isLevelUnlocked(level);
    const stars = getLevelStars(level);
    const isCurrent = level === maxUnlocked;
    const isCompleted = stars > 0;

    // Hotspot header when stage changes
    if (def.hotspotId !== currentHotspotId) {
      currentHotspotId = def.hotspotId;
      const stageUnlocked = isLevelUnlocked(level);
      html += `
        <div class="levelmap-stage-header ${stageUnlocked ? '' : 'locked'}">
          <div class="levelmap-stage-icon">${hotspot.icon}</div>
          <div class="levelmap-stage-name">${hotspot.name}</div>
          <div class="levelmap-stage-desc">${hotspot.description}</div>
        </div>
      `;
    }

    // Sub-level node (smaller, inline)
    const positions = ['left', 'center', 'right', 'center'];
    const pos = positions[(def.subLevel - 1) % 4];
    const stateClass = isCurrent ? 'current' : isCompleted ? 'completed' : unlocked ? 'unlocked' : 'locked';

    const starsHtml = isCompleted
      ? '<div class="levelmap-stars">' + '⭐'.repeat(stars) + '☆'.repeat(3 - stars) + '</div>'
      : '';

    html += `
      <div class="levelmap-node levelmap-sub ${stateClass} ${pos}" ${unlocked ? `onclick="window._selectLevel(${level})"` : ''}>
        <div class="levelmap-node-bg" style="--hotspot-color: ${hotspot.background}">
          <div class="levelmap-node-level">${def.subLevel}</div>
        </div>
        ${starsHtml}
        ${isCurrent ? '<div class="levelmap-current-badge">DU BIST HIER</div>' : ''}
        ${!unlocked ? '<div class="levelmap-lock">🔒</div>' : ''}
      </div>
    `;
  }

  container.innerHTML = html;

  window._selectLevel = (level) => {
    if (onSelectLevel) onSelectLevel(level);
  };

  requestAnimationFrame(() => {
    const currentNode = container.querySelector('.levelmap-node.current');
    if (currentNode) {
      currentNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
}
