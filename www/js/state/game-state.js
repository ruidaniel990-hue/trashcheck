// ── Game State ──
// Mutable state for the current run. Reset via resetState() on each new game.
// Per-level tracking via resetLevelState().

import { CONFIG } from '../core/game-config.js';
import { getLevelDuration } from '../core/game-config.js';

export const state = {
  // ── Run totals (persist across levels) ──
  score: 0,
  combo: 1,
  maxCombo: 1,
  correctCount: 0,
  totalItems: 0,

  // ── Per-level tracking ──
  levelCorrect: 0,
  levelTotal: 0,
  levelStreak: 0,          // consecutive correct (for streak bonus)

  // Time
  timeLeft: 30,
  timerInterval: null,

  // Game flow
  gameActive: false,
  paused: false,
  gameOver: false,         // true = run ended (failed or quit)

  // Level & Hotspot
  level: 1,
  itemsSinceLevel: 0,
  itemsForNextLevel: CONFIG.BASE_ITEMS_PER_LEVEL,
  currentHotspot: null,

  // Current round
  activeBins: [],
  currentItem: null,

  // Falling items (rAF-based)
  fallingItems: [],

  // DOM references
  itemEl: null,
  fallTimer: null,

  // Equipment
  comboShieldCharges: 0,     // shields remaining this level (from Scanner)

  // Input tracking
  swipeStartX: 0,
  swipeStartY: 0,
  swiping: false,
};

// Reset everything for a brand new run
export function resetState() {
  state.score = 0;
  state.combo = 1;
  state.maxCombo = 1;
  state.correctCount = 0;
  state.totalItems = 0;
  state.levelCorrect = 0;
  state.levelTotal = 0;
  state.levelStreak = 0;
  state.timeLeft = getLevelDuration(1);
  state.timerInterval = null;
  state.gameActive = true;
  state.paused = false;
  state.gameOver = false;
  state.level = 1;
  state.itemsSinceLevel = 0;
  state.itemsForNextLevel = CONFIG.BASE_ITEMS_PER_LEVEL;
  state.currentHotspot = null;
  state.activeBins = [];
  state.fallingItems = [];
  state.currentItem = null;
  state.itemEl = null;
  state.fallTimer = null;
  state.comboShieldCharges = 0;
  state.swipeStartX = 0;
  state.swipeStartY = 0;
  state.swiping = false;
}

// Reset per-level counters (called when advancing to next level)
export function resetLevelState(level) {
  state.levelCorrect = 0;
  state.levelTotal = 0;
  state.levelStreak = 0;
  state.timeLeft = getLevelDuration(level);
  state.fallingItems = [];
  state.currentItem = null;
  state.itemEl = null;
  state.combo = 1; // reset combo between levels
}

// Get current level accuracy
export function getLevelAccuracy() {
  if (state.levelTotal === 0) return 100;
  return Math.round((state.levelCorrect / state.levelTotal) * 100);
}
