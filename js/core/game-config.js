// ── Trashcheck Game Configuration ──
// Single source of truth for all tuning parameters

export const CONFIG = {
  // Timing
  GAME_DURATION: 60,          // base seconds per level (legacy, used as fallback)
  TICK_INTERVAL: 100,         // ms between timer ticks
  INITIAL_SPAWN_DELAY: 600,   // ms before first item spawns

  // ── Level Progression ──
  LEVEL_BASE_DURATION: 30,    // seconds for level 1
  LEVEL_DURATION_INCREASE: 2, // extra seconds per level (harder = more time)
  LEVEL_MAX_DURATION: 45,     // cap
  LEVEL_MIN_ACCURACY: 50,     // % accuracy needed to pass a level
  LEVEL_COMPLETE_DELAY: 2000, // ms to show level result before next

  // Scoring
  BASE_POINTS: 10,            // points per correct sort (before combo)
  MAX_COMBO: 10,              // combo multiplier cap
  MISS_PENALTY_POINTS: 0,

  // Time adjustments
  TIME_BONUS_CORRECT: 0.5,    // seconds gained on correct sort
  TIME_PENALTY_WRONG: 2,      // seconds lost on wrong sort
  TIME_PENALTY_MISS: 1.5,     // seconds lost when item falls off screen
  TIME_BONUS_LEVEL_UP: 0,     // no bonus anymore (levels have own timer)

  // ── Streak Time Bonus ──
  STREAK_BONUS_THRESHOLD: 5,  // every N correct in a row = bonus time
  STREAK_BONUS_TIME: 3,       // seconds added per streak

  // Economy
  COINS_PER_SCORE_UNIT: 5,
  MAX_COINS_PER_GAME: 200,

  // Input
  SWIPE_THRESHOLD: 40,        // lowered from 50 for snappier feel
  SWIPE_VISUAL_MULTIPLIER: 80,
  SOFT_DROP_MULTIPLIER: 4,    // 4x fall speed when holding down (Tetris-style)

  // ── Fall Physics ──
  FALL_START_Y: -10,          // % from top where items spawn (off-screen)
  FALL_END_Y: 68,             // % where items reach the bin zone
  FALL_MISS_Y: 72,            // % where item counts as missed (top edge of bins)

  // Fall speed (% per second) - items now fall continuously
  BASE_FALL_SPEED: 22,        // %/s at start - relaxed opening
  MAX_FALL_SPEED: 55,         // %/s cap - challenging but fair
  FALL_SPEED_RAMP: 0.25,      // %/s increase per item sorted - gentle curve

  // ── Spawn Timing ──
  BASE_SPAWN_INTERVAL: 2000,  // ms between spawns at start - breathing room
  MIN_SPAWN_INTERVAL: 700,    // ms minimum between spawns
  SPAWN_INTERVAL_RAMP: 15,    // ms faster per item sorted - slow ramp

  // Difficulty scaling (per level, stacks with ramp)
  BASE_FALL_TIME: 2200,
  FALL_TIME_DECREASE: 300,
  MIN_FALL_TIME: 800,
  BASE_SPAWN_DELAY: 350,
  SPAWN_DELAY_DECREASE: 40,
  MIN_SPAWN_DELAY: 150,

  // Level progression
  BASE_ITEMS_PER_LEVEL: 8,
  ITEMS_PER_LEVEL_INCREASE: 2,
  MAX_ITEMS_PER_LEVEL: 20,

  // Bins
  ACTIVE_BINS_COUNT: 3,

  // ── Combo Tiers ──
  COMBO_TIERS: [
    { min: 10, label: 'GOLD',   color: '#ffcc00', glow: 'rgba(255,204,0,0.5)' },
    { min: 7,  label: 'FIRE',   color: '#ff6600', glow: 'rgba(255,102,0,0.4)' },
    { min: 5,  label: 'SILBER', color: '#00d4ff', glow: 'rgba(0,212,255,0.4)' },
    { min: 3,  label: 'BRONZE', color: '#cc8844', glow: 'rgba(204,136,68,0.3)' },
  ],

  // ── Special Items ──
  SPECIAL_SPAWN_CHANCE: 0.08,  // 8% chance per spawn
  SPECIAL_TYPES: {
    BONUS_TIME: { emoji: '⏰', name: 'Zeitbonus', effect: 'time', value: 5 },
    DOUBLE_POINTS: { emoji: '⭐', name: 'Doppelpunkte', effect: 'doubleNext', value: 2 },
    HAZARD: { emoji: '☠️', name: 'Giftmüll', effect: 'hazard', value: -5 },
  },

  // Animation durations (ms)
  ITEM_SORT_ANIM: 250,
  FLOAT_POINTS_DURATION: 800,
  LEVEL_UP_FLASH_DURATION: 1000,
  SCREEN_SHAKE_DURATION: 300,
  SCREEN_SHAKE_INTENSITY: 6,

  // End screen thresholds
  SCORE_THRESHOLDS: [
    { min: 200, icon: '🏆', title: 'Meister!',       sub: 'Unglaubliche Leistung!' },
    { min: 120, icon: '🥇', title: 'Klasse!',        sub: 'Du kennst deinen Müll!' },
    { min: 60,  icon: '👍', title: 'Gut gemacht!',   sub: 'Weiter so!' },
    { min: 0,   icon: '😅', title: 'Nicht schlecht!', sub: 'Versuch es nochmal!' },
  ],
};

// ── Derived Calculations ──

export function getFallTime(level) {
  return Math.max(CONFIG.MIN_FALL_TIME, CONFIG.BASE_FALL_TIME - (level - 1) * CONFIG.FALL_TIME_DECREASE);
}

export function getSpawnDelay(level) {
  return Math.max(CONFIG.MIN_SPAWN_DELAY, CONFIG.BASE_SPAWN_DELAY - (level - 1) * CONFIG.SPAWN_DELAY_DECREASE);
}

export function calculateCoins(score) {
  return Math.min(Math.floor(score / CONFIG.COINS_PER_SCORE_UNIT), CONFIG.MAX_COINS_PER_GAME);
}

export function getScoreThreshold(score) {
  return CONFIG.SCORE_THRESHOLDS.find(t => score >= t.min);
}

// Get current fall speed based on items sorted so far
// Every 5 levels: +3 bump. Between: +0.5 per level.
export function getCurrentFallSpeed(itemsSorted, level) {
  const milestones = Math.floor((level - 1) / 5); // 0 for L1-5, 1 for L6-10, etc.
  const withinLevel = (level - 1) % 5;             // 0-4 position within the 5-level block
  const base = CONFIG.BASE_FALL_SPEED + milestones * 3 + withinLevel * 0.5;
  const ramped = base + itemsSorted * CONFIG.FALL_SPEED_RAMP;
  return Math.min(ramped, CONFIG.MAX_FALL_SPEED);
}

// Get current spawn interval based on items sorted
export function getCurrentSpawnInterval(itemsSorted, level) {
  const base = CONFIG.BASE_SPAWN_INTERVAL - (level - 1) * 200;
  const ramped = base - itemsSorted * CONFIG.SPAWN_INTERVAL_RAMP;
  return Math.max(ramped, CONFIG.MIN_SPAWN_INTERVAL);
}

// Get combo tier for current combo value
export function getComboTier(combo) {
  return CONFIG.COMBO_TIERS.find(t => combo >= t.min) || null;
}

// Get duration for a specific level
export function getLevelDuration(level) {
  return Math.min(
    CONFIG.LEVEL_BASE_DURATION + (level - 1) * CONFIG.LEVEL_DURATION_INCREASE,
    CONFIG.LEVEL_MAX_DURATION
  );
}
