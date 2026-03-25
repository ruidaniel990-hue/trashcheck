// ── Level Map ──
// Candy-Crush-style level selection with a winding path.

import { LEVELS } from './level-definitions.js';
import { getProgress, getMaxUnlockedLevel, getLevelStars, isLevelUnlocked } from './level-progress.js';
import { HOTSPOTS } from '../hotspot/hotspot-data.js';
import { getBalance } from '../economy/coin-manager.js';

// Map hotspot ID → data
const hotspotMap = {};
HOTSPOTS.forEach(h => { hotspotMap[h.id] = h; });

// Render the level map
export function renderLevelMap(onSelectLevel) {
  const container = document.getElementById('levelmap-path');
  const coinsEl = document.getElementById('map-coins');
  if (!container) return;
  if (coinsEl) coinsEl.textContent = getBalance();

  const maxUnlocked = getMaxUnlockedLevel();
  const totalLevels = Math.max(LEVELS.length, maxUnlocked);

  // Build path nodes (bottom to top, like Candy Crush)
  let html = '';

  for (let i = 0; i < totalLevels; i++) {
    const level = i + 1;
    const def = LEVELS[i] || LEVELS[LEVELS.length - 1];
    const hotspot = hotspotMap[def.hotspotId] || HOTSPOTS[0];
    const unlocked = isLevelUnlocked(level);
    const stars = getLevelStars(level);
    const isCurrent = level === maxUnlocked;
    const isCompleted = stars > 0;

    // Zigzag position: alternate left/center/right
    const positions = ['left', 'center', 'right', 'center'];
    const pos = positions[i % 4];

    // Connector line (except first node)
    if (i > 0) {
      html += `<div class="levelmap-connector ${pos}"></div>`;
    }

    // Node
    const stateClass = isCurrent ? 'current' : isCompleted ? 'completed' : unlocked ? 'unlocked' : 'locked';
    const starsHtml = isCompleted
      ? '<div class="levelmap-stars">' + '⭐'.repeat(stars) + '☆'.repeat(3 - stars) + '</div>'
      : '';

    html += `
      <div class="levelmap-node ${stateClass} ${pos}" ${unlocked ? `onclick="window._selectLevel(${level})"` : ''}>
        <div class="levelmap-node-bg" style="--hotspot-color: ${hotspot.background}">
          <div class="levelmap-node-icon">${hotspot.icon}</div>
          <div class="levelmap-node-level">${level}</div>
        </div>
        ${starsHtml}
        <div class="levelmap-node-name">${hotspot.name}</div>
        ${isCurrent ? '<div class="levelmap-current-badge">DU BIST HIER</div>' : ''}
        ${!unlocked ? '<div class="levelmap-lock">🔒</div>' : ''}
      </div>
    `;
  }

  container.innerHTML = html;

  // Set up callback
  window._selectLevel = (level) => {
    if (onSelectLevel) onSelectLevel(level);
  };

  // Scroll to current level
  requestAnimationFrame(() => {
    const currentNode = container.querySelector('.levelmap-node.current');
    if (currentNode) {
      currentNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
}
