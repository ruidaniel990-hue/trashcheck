// ── Game Input v6 ──
// Tetris-style lanes: swipe left/right = move item to lane.
// Touch SPECIFIC item to move it (not just the lowest one).
// Hold down = soft drop.

import { state } from '../state/game-state.js';
import { CONFIG } from './game-config.js';

let onMoveCallback = null;    // (item, laneIndex)
let onSoftDropCallback = null; // (active)
let touchedItem = null;        // the specific item being dragged
let movedDuringTouch = false;  // prevent double-move on touchend

export function setupInput(zone, onMove, onSoftDrop) {
  onMoveCallback = onMove;
  onSoftDropCallback = onSoftDrop;

  zone.addEventListener('touchstart', handleStart, { passive: true });
  zone.addEventListener('touchmove', handleMove, { passive: true });
  zone.addEventListener('touchend', handleEnd, { passive: true });

  zone.addEventListener('mousedown', handleStart);
  zone.addEventListener('mousemove', handleMove);
  zone.addEventListener('mouseup', handleEnd);
}

function getXY(e) {
  if (e.touches) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  if (e.changedTouches) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
  return { x: e.clientX, y: e.clientY };
}

// Find which falling item is closest to the touch point
function findTouchedItem(x, y) {
  let closest = null;
  let closestDist = Infinity;

  for (const fi of state.fallingItems) {
    if (!fi.el) continue;
    const rect = fi.el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    // Must be within reasonable touch range (120px)
    if (dist < closestDist && dist < 120) {
      closest = fi;
      closestDist = dist;
    }
  }

  return closest;
}

function handleStart(e) {
  if (!state.gameActive) return;
  const { x, y } = getXY(e);
  state.swipeStartX = x;
  state.swipeStartY = y;
  state.swiping = true;

  // Find which item the player is touching
  touchedItem = findTouchedItem(x, y);
  movedDuringTouch = false;
}

function handleMove(e) {
  if (!state.swiping || !state.gameActive) return;
  const { x, y } = getXY(e);
  const dx = x - state.swipeStartX;
  const dy = y - state.swipeStartY;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  // Visual: move the touched item horizontally
  if (touchedItem && touchedItem.el) {
    const pct = 50 + (dx / window.innerWidth) * CONFIG.SWIPE_VISUAL_MULTIPLIER;
    touchedItem.el.style.transition = 'none';
    touchedItem.el.style.left = pct + '%';
  }

  // Highlight target bin
  highlightBin(dx, absDx, absDy);

  // INSTANT LANE MOVE: swipe passes threshold = move to lane
  if (touchedItem && onMoveCallback) {
    if (absDx > CONFIG.SWIPE_THRESHOLD && absDx > absDy) {
const currentLane = touchedItem?.lane ?? 1;
                      const lane = dx < 0 ? Math.max(0, currentLane - 1) : Math.min(2, currentLane + 1);touchedItem.el.style.transition = 'left 0.15s ease-out';
      onMoveCallback(touchedItem, lane);
      movedDuringTouch = true;
      clearHighlights();
      // Reset for next swipe and find new nearest item
      state.swipeStartX = x;
      state.swipeStartY = y;
      touchedItem = findTouchedItem(x, y);
    }
  }

  // Soft drop: hold down
  if (dy > CONFIG.SWIPE_THRESHOLD && absDy > absDx) {
    if (onSoftDropCallback) onSoftDropCallback(true);
  } else {
    if (onSoftDropCallback) onSoftDropCallback(false);
  }
}

function handleEnd(e) {
  if (!state.swiping) return;
  state.swiping = false;
  clearHighlights();

  // Stop soft drop
  if (onSoftDropCallback) onSoftDropCallback(false);

  // Snap touched item back to its lane if not moved
  if (touchedItem && touchedItem.el) {
    const LANE_X = ['20%', '50%', '80%'];
    touchedItem.el.style.transition = 'left 0.15s ease-out';
    touchedItem.el.style.left = LANE_X[touchedItem.lane];
  }

  // Fallback: check final swipe on release (only if not already moved during drag)
  if (touchedItem && onMoveCallback && !movedDuringTouch) {
    const { x, y } = getXY(e);
    const dx = x - state.swipeStartX;
    const dy = y - state.swipeStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx > absDy && absDx > CONFIG.SWIPE_THRESHOLD) {
const currentLane = touchedItem?.lane ?? 1;
                  const lane = dx < 0 ? Math.max(0, currentLane - 1) : Math.min(2, currentLane + 1);onMoveCallback(touchedItem, lane);
    }
  }

  touchedItem = null;
}

function highlightBin(dx, absDx, absDy) {
  document.querySelectorAll('.bin').forEach(b => b.classList.remove('highlight'));
  if (absDx > absDy && absDx > CONFIG.SWIPE_THRESHOLD) {
    document.getElementById(dx < 0 ? 'bin-0' : 'bin-2')?.classList.add('highlight');
  }
}

function clearHighlights() {
  document.querySelectorAll('.bin').forEach(b => b.classList.remove('highlight'));
}
