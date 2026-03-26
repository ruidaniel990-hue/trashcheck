// ── Animation Manager v3 ──
// Rich visual feedback: particles, screen effects, combo visuals, score pops.

import { CONFIG } from '../core/game-config.js';

// ══════════════════════════════════════════════
// ── FLOATING POINTS ──
// ══════════════════════════════════════════════

export function floatPoints(text, correct, binEl) {
  if (!binEl) return;
  const rect = binEl.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'float-pts ' + (correct ? 'correct' : 'wrong');
  el.textContent = text;
  el.style.left = (rect.left + rect.width / 2) + 'px';
  el.style.top = (rect.top - 14) + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), CONFIG.FLOAT_POINTS_DURATION);
}

// ══════════════════════════════════════════════
// ── BIN FLASH ──
// ══════════════════════════════════════════════

export function flashBin(binEl, correct) {
  if (!binEl) return;
  if (correct) {
    binEl.classList.remove('flash-right');
    void binEl.offsetWidth;
    binEl.classList.add('flash-right');

    // Spawn particles on correct hit
    spawnParticles(binEl, 'correct');
  } else {
    binEl.classList.remove('shake', 'flash-wrong');
    void binEl.offsetWidth;
    binEl.classList.add('shake', 'flash-wrong');
  }
}

// ══════════════════════════════════════════════
// ── ANIMATE ITEM INTO BIN ──
// ══════════════════════════════════════════════

export function animateItemSort(itemEl, binIndex) {
  if (!itemEl) return;
  const positions = ['10%', '50%', '90%'];
  itemEl.style.transition = 'all 0.2s ease-in';
  itemEl.style.left = positions[binIndex];
  itemEl.style.top = '74%';
  itemEl.style.opacity = '0';
  itemEl.style.transform = 'translateX(-50%) scale(0.2)';
  setTimeout(() => { if (itemEl.parentNode) itemEl.remove(); }, CONFIG.ITEM_SORT_ANIM);
}

// ══════════════════════════════════════════════
// ── PARTICLE BURST ──
// ══════════════════════════════════════════════

function spawnParticles(targetEl, type) {
  if (!targetEl) return;
  const rect = targetEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top;

  const count = type === 'correct' ? 8 : 5;
  const color = type === 'correct' ? 'var(--green)' : 'var(--red)';

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';

    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const dist = 30 + Math.random() * 50;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - 20; // bias upward
    const duration = 0.3 + Math.random() * 0.3;
    const size = 4 + Math.random() * 4;

    p.style.left = cx + 'px';
    p.style.top = cy + 'px';
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.background = color;
    p.style.boxShadow = '0 0 6px ' + color;
    p.style.setProperty('--dx', dx + 'px');
    p.style.setProperty('--dy', dy + 'px');
    p.style.setProperty('--duration', duration + 's');

    document.body.appendChild(p);
    setTimeout(() => p.remove(), duration * 1000 + 50);
  }
}

// ══════════════════════════════════════════════
// ── SCREEN SHAKE ──
// ══════════════════════════════════════════════

export function screenShake() {
  const gameScreen = document.getElementById('screen-game');
  if (!gameScreen) return;
  gameScreen.classList.remove('shake-screen');
  void gameScreen.offsetWidth;
  gameScreen.classList.add('shake-screen');
  setTimeout(() => gameScreen.classList.remove('shake-screen'), CONFIG.SCREEN_SHAKE_DURATION);
}

// ══════════════════════════════════════════════
// ── SCREEN FLASH ──
// ══════════════════════════════════════════════

export function flashScreen(type) {
  let flashEl = document.getElementById('screen-flash');
  if (!flashEl) {
    flashEl = document.createElement('div');
    flashEl.id = 'screen-flash';
    document.body.appendChild(flashEl);
  }

  flashEl.className = 'screen-flash flash-' + type;
  void flashEl.offsetWidth;
  flashEl.classList.add('active');
  setTimeout(() => flashEl.classList.remove('active'), 250);
}

// ══════════════════════════════════════════════
// ── COMBO TIER VISUAL ──
// ══════════════════════════════════════════════

let lastTierLabel = null;

export function showComboTier(tier) {
  // Update combo HUD color
  const comboEl = document.getElementById('combo-val');
  if (comboEl) {
    comboEl.style.color = tier.color;
    comboEl.style.textShadow = '0 0 14px ' + tier.glow;
  }

  // Persistent glow on bins
  updateBinsGlow(tier);

  // Only show tier pop when tier changes
  if (tier.label === lastTierLabel) return;
  lastTierLabel = tier.label;

  // Tier label pop
  let tierEl = document.getElementById('combo-tier-label');
  if (!tierEl) {
    tierEl = document.createElement('div');
    tierEl.id = 'combo-tier-label';
    tierEl.className = 'combo-tier-label';
    document.body.appendChild(tierEl);
  }
  tierEl.textContent = tier.label;
  tierEl.style.color = tier.color;
  tierEl.style.textShadow = '0 0 25px ' + tier.glow;
  tierEl.classList.remove('show');
  void tierEl.offsetWidth;
  tierEl.classList.add('show');
  setTimeout(() => tierEl.classList.remove('show'), 700);

  // Green flash on tier up
  flashScreen('correct');
}

function updateBinsGlow(tier) {
  const row = document.getElementById('bins-row');
  if (!row) return;

  // Remove all glow classes
  row.classList.remove('combo-glow-bronze', 'combo-glow-silver', 'combo-glow-fire', 'combo-glow-gold');

  // Add matching glow
  const glowMap = { 'BRONZE': 'combo-glow-bronze', 'SILBER': 'combo-glow-silver', 'FIRE': 'combo-glow-fire', 'GOLD': 'combo-glow-gold' };
  const cls = glowMap[tier.label];
  if (cls) row.classList.add(cls);
}

// ══════════════════════════════════════════════
// ── COMBO RESET VISUAL ──
// ══════════════════════════════════════════════

export function showComboReset(wasCombo) {
  lastTierLabel = null;

  // Reset combo HUD color
  const comboEl = document.getElementById('combo-val');
  if (comboEl) {
    comboEl.style.color = '';
    comboEl.style.textShadow = '';
    comboEl.classList.remove('combo-reset');
    void comboEl.offsetWidth;
    comboEl.classList.add('combo-reset');
    setTimeout(() => comboEl.classList.remove('combo-reset'), 500);
  }

  // Remove bin glow
  const row = document.getElementById('bins-row');
  if (row) row.classList.remove('combo-glow-bronze', 'combo-glow-silver', 'combo-glow-fire', 'combo-glow-gold');

  // Show "COMBO LOST" if combo was meaningful
  if (wasCombo >= 3) {
    let lostEl = document.getElementById('combo-lost-label');
    if (!lostEl) {
      lostEl = document.createElement('div');
      lostEl.id = 'combo-lost-label';
      lostEl.className = 'combo-lost-label';
      document.body.appendChild(lostEl);
    }
    lostEl.textContent = 'COMBO ×' + wasCombo + ' LOST';
    lostEl.classList.remove('show');
    void lostEl.offsetWidth;
    lostEl.classList.add('show');
    setTimeout(() => lostEl.classList.remove('show'), 600);
  }
}

// ══════════════════════════════════════════════
// ── SCORE POP ──
// ══════════════════════════════════════════════

export function popScore() {
  const scoreEl = document.getElementById('hud-score');
  if (!scoreEl) return;
  scoreEl.classList.remove('score-pop');
  void scoreEl.offsetWidth;
  scoreEl.classList.add('score-pop');
  setTimeout(() => scoreEl.classList.remove('score-pop'), 300);
}
