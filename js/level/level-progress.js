// ── Level Progress ──
// Persists which levels are completed, stars earned, and best scores.

const PROGRESS_KEY = 'trashcheck_level_progress';

// Returns { [level]: { completed, stars, bestScore, bestAccuracy } }
export function getProgress() {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}'); }
  catch { return {}; }
}

function saveProgress(progress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

// Calculate stars: 1 star = passed, 2 = 70%+, 3 = 90%+
function calcStars(accuracy) {
  if (accuracy >= 90) return 3;
  if (accuracy >= 70) return 2;
  return 1;
}

// Record a level completion
export function recordLevelComplete(level, score, accuracy) {
  const progress = getProgress();
  const existing = progress[level] || { completed: false, stars: 0, bestScore: 0, bestAccuracy: 0 };
  const stars = calcStars(accuracy);

  progress[level] = {
    completed: true,
    stars: Math.max(existing.stars, stars),
    bestScore: Math.max(existing.bestScore, score),
    bestAccuracy: Math.max(existing.bestAccuracy, accuracy),
  };

  saveProgress(progress);
  return progress[level];
}

// Get the highest unlocked level (= highest completed + 1)
export function getMaxUnlockedLevel() {
  const progress = getProgress();
  let max = 1;
  for (const lvl of Object.keys(progress)) {
    const n = parseInt(lvl);
    if (progress[lvl].completed && n >= max) max = n + 1;
  }
  return max;
}

// Check if a specific level is unlocked
export function isLevelUnlocked(level) {
  return level <= getMaxUnlockedLevel();
}

// Get star count for a level (0 if not completed)
export function getLevelStars(level) {
  const progress = getProgress();
  return progress[level]?.stars || 0;
}
