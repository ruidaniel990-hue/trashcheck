// ── Game Engine v4 ──
// Tetris-style LANE system: swipe moves items to lanes, items land in bins.
// No instant sorting - items fall into their lane's bin.

import { CATEGORIES } from './game-data.js';
import { CONFIG, getScoreThreshold, getCurrentFallSpeed, getCurrentSpawnInterval, getComboTier, getLevelDuration } from './game-config.js';
import { state, resetState, resetLevelState, getLevelAccuracy } from '../state/game-state.js';
import { showScreen } from '../ui/screen-manager.js';
import { resetHUD, updateScore, updateCombo, bumpCombo, updateLevel, updateHotspot } from '../ui/hud.js';
import { showPause, hidePause, showLevelUpFlash } from '../ui/overlay-manager.js';
import { floatPoints, flashBin, screenShake, showComboTier, showComboReset, flashScreen, popScore } from '../effects/animation-manager.js';
import { startTimer, stopTimer } from './game-timer.js';
import { getHighscore, setHighscore } from '../storage/storage-bridge.js';
import { earnCoins, getBalance } from '../economy/coin-manager.js';
import { getHotspotForLevel } from '../level/level-definitions.js';
import { getLevelFallTime, getLevelSpawnDelay, getItemsToComplete, hotspotChanges } from '../level/level-manager.js';
import { setCurrentHotspot, getHotspotBinPreview } from '../hotspot/hotspot-manager.js';
import { showDeliverySequence, showResultsScreen, showHub } from '../base/hub-manager.js';
import { renderLevelMap } from '../level/level-map.js';
import { recordLevelComplete, getMaxUnlockedLevel } from '../level/level-progress.js';
import { renderShop } from '../shop/shop-screen.js';
import { getActiveEffects } from '../shop/shop-manager.js';
import { renderAvatarScreen } from '../avatar/avatar-screen.js';
import { playSound, initAudio, toggleMute, isMuted, setSoundStyle, setSfxVolume, getSfxVolume } from '../effects/audio-manager.js';
import { vibrate, toggleHaptic, isHapticEnabled } from '../effects/haptic-manager.js';
import { startMusic, stopMusic, crossfadeTo, setMusicMuted, TRACK_LIST, setTrack, getCurrentTrack, setMusicVolume as _setMusicVolume, getMusicVolume, toggleMusicPause, isMusicPaused, advanceTrack, setPlayMode, getPlayMode, scratchStop } from '../effects/music-manager.js';
import { hasProfile, getDisplayName } from '../auth/auth-manager.js';
import { playAsGuest, saveName, renderProfileScreen, updateStartScreenProfile, handleLogout } from '../auth/auth-screen.js';

// ── State ──
let animFrameId = null;
let lastFrameTime = 0;
let spawnTimer = 0;
let softDropActive = false;

// Lane X positions (CSS left%)
const LANE_X = ['20%', '50%', '80%'];

// ══════════════════════════════════════════════
// ── BINS ──
// ══════════════════════════════════════════════

function renderBins() {
  const row = document.getElementById('bins-row');
  if (!row) return;
  const arrows = ['◀ LINKS', '⬇ MITTE', 'RECHTS ▶'];
  row.innerHTML = state.activeBins.map((key, i) => {
    const c = CATEGORIES[key];
    return `<div class="bin ${c.cls}" id="bin-${i}">
      <div class="bin-arrow">${arrows[i]}</div>
      <div class="bin-icon">${c.icon}</div>
      <div class="bin-label">${c.name}</div>
    </div>`;
  }).join('');
}

function applyHotspotBins() {
  const hotspot = state.currentHotspot;
  if (hotspot) state.activeBins = hotspot.categories.slice(0, CONFIG.ACTIVE_BINS_COUNT);
  renderBins();
}

// ══════════════════════════════════════════════
// ── SCREENS ──
// ══════════════════════════════════════════════

function showLevelPreview() {
  const hotspot = state.currentHotspot;
  if (!hotspot) return;
  const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  setText('preview-icon', hotspot.icon);
  setText('preview-level', 'Level ' + state.level);
  setText('preview-name', hotspot.name);
  setText('preview-desc', hotspot.description);
  const previewBins = document.getElementById('preview-bins');
  if (previewBins) {
    const binData = getHotspotBinPreview(hotspot);
    previewBins.innerHTML = binData.map(b =>
      `<div class="preview-bin ${b.cls}">
        <div class="preview-bin-arrow">${b.direction}</div>
        <div class="preview-bin-icon">${b.icon}</div>
        <div class="preview-bin-name">${b.name}</div>
      </div>`
    ).join('');
  }
  showScreen('screen-preview');
}

function showTransition(fromHotspot, toHotspot, callback) {
  const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  setText('transition-from-icon', fromHotspot.icon);
  setText('transition-from-name', fromHotspot.name);
  setText('transition-to-icon', toHotspot.icon);
  setText('transition-to-name', toHotspot.name);
  showScreen('screen-transition');
  setTimeout(callback, 1800);
}

// ══════════════════════════════════════════════
// ── BOOT & START ──
// ══════════════════════════════════════════════

export function initStart() {
  initAudio();
  if (!hasProfile()) { showScreen('screen-auth'); return; }
  const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  setText('hs-display', getHighscore());
  setText('start-coins', getBalance());
  updateStartScreenProfile();
  showScreen('screen-start');
}

export function startGame() {
  resetState();
  resetHUD();
  setupLevel(state.level);
  showLevelPreview();
}

function setupLevel(level) {
  const hotspot = getHotspotForLevel(level);
  state.currentHotspot = hotspot;
  state.itemsForNextLevel = getItemsToComplete(level);
  setCurrentHotspot(hotspot);
}

export function startLevel() {
  const zone = document.getElementById('fall-zone');
  if (zone) zone.querySelectorAll('.swipe-item').forEach(e => e.remove());
  hidePause();
  hideLevelOverlays();
  applyHotspotBins();
  updateLevel(state.level);
  updateHotspot(state.currentHotspot);
  resetLevelState(state.level);
  state.gameActive = true;
  softDropActive = false;
  spawnTimer = 0;
  // Load combo shield charges from equipment
  state.comboShieldCharges = getActiveEffects().comboShield;
  showScreen('screen-game');
  // Advance to next track each round (sequential or shuffle)
  if (state.level === 1) advanceTrack();
  startMusic(state.currentHotspot?.id || 'park');
  // Update HUD music button state
  const musicBtn = document.getElementById('btn-music');
  if (musicBtn) musicBtn.textContent = '🎵';
  startTimer(() => onLevelTimeUp());
  lastFrameTime = performance.now();
  startGameLoop();
  setTimeout(() => spawnItem(), CONFIG.INITIAL_SPAWN_DELAY);
}

// ══════════════════════════════════════════════
// ── GAME LOOP ──
// ══════════════════════════════════════════════

function startGameLoop() {
  cancelAnimationFrame(animFrameId);
  animFrameId = requestAnimationFrame(gameLoop);
}

function stopGameLoop() {
  cancelAnimationFrame(animFrameId);
  animFrameId = null;
}

function gameLoop(timestamp) {
  if (!state.gameActive) return;
  const dt = (timestamp - lastFrameTime) / 1000;
  lastFrameTime = timestamp;
  if (!state.paused) {
    updateFallingItems(dt);
    updateSpawnTimer(dt);
  }
  animFrameId = requestAnimationFrame(gameLoop);
}

function updateFallingItems(dt) {
  let fallSpeed = getCurrentFallSpeed(state.levelTotal, state.level);
  if (softDropActive) fallSpeed *= CONFIG.SOFT_DROP_MULTIPLIER;

  for (let i = state.fallingItems.length - 1; i >= 0; i--) {
    const fi = state.fallingItems[i];
    fi.y += fallSpeed * dt;
    if (fi.el) fi.el.style.transform = `translateX(-50%) translateY(${fi.y}vh)`;
    if (fi.y >= CONFIG.FALL_MISS_Y) handleLanding(fi, i);
  }
}

export function setSoftDrop(active) {
  softDropActive = active;
}

function updateSpawnTimer(dt) {
  spawnTimer += dt * 1000;
  const interval = getCurrentSpawnInterval(state.levelTotal, state.level);
  if (spawnTimer >= interval && state.fallingItems.length < 3) {
    spawnTimer = 0;
    spawnItem();
  }
}

// ══════════════════════════════════════════════
// ── SPAWN ──
// ══════════════════════════════════════════════

function spawnItem() {
  if (!state.gameActive || state.paused) return;
  const binKey = state.activeBins[Math.floor(Math.random() * state.activeBins.length)];
  const cat = CATEGORIES[binKey];
  const item = cat.items[Math.floor(Math.random() * cat.items.length)];
  const zone = document.getElementById('fall-zone');
  if (!zone) return;

  const el = document.createElement('div');
  el.className = 'swipe-item spawn';
  // Level 1-14: always center lane. Level 15+: gradually introduce side lanes.
  let spawnLane = 1; // center
  if (state.level > 14) {
    const sideChance = Math.min(0.5, (state.level - 14) * 0.009);
    if (Math.random() < sideChance) {
      spawnLane = Math.random() < 0.5 ? 0 : 2;
    }
  }
  el.style.left = LANE_X[spawnLane];
  el.style.top = '0';
  el.style.transform = `translateX(-50%) translateY(${CONFIG.FALL_START_Y}vh)`;
  el.style.transition = 'left 0.15s ease-out';
  el.innerHTML = `<div class="item-emoji">${item.emoji}</div><div class="item-name">${item.name}</div>`;
  zone.appendChild(el);

  const fi = { el, emoji: item.emoji, name: item.name, bin: binKey, y: CONFIG.FALL_START_Y, lane: spawnLane };
  state.fallingItems.push(fi);
  state.totalItems++;
  state.levelTotal++;
  updateCurrentItem();
  playSound('spawn');
}

function updateCurrentItem() {
  const active = state.fallingItems;
  if (active.length > 0) {
    const lowest = active.reduce((a, b) => a.y > b.y ? a : b);
    state.currentItem = lowest;
    state.itemEl = lowest.el;
  } else {
    state.currentItem = null;
    state.itemEl = null;
  }
}

// ══════════════════════════════════════════════
// ── MOVE ITEM TO LANE (called by input) ──
// ══════════════════════════════════════════════

export function moveItemToLane(laneIndex, specificItem) {
  if (!state.gameActive) return;
  const fi = specificItem || state.currentItem;
  if (!fi) return;
  fi.lane = laneIndex;
  if (fi.el) fi.el.style.left = LANE_X[laneIndex];
}

// ══════════════════════════════════════════════
// ── LANDING (item reaches bottom) ──
// ══════════════════════════════════════════════

function handleLanding(fi, index) {
  state.fallingItems.splice(index, 1);

  const targetBin = state.activeBins[fi.lane];
  const isCorrect = targetBin === fi.bin;
  const binEl = document.getElementById('bin-' + fi.lane);

  // Animate item shrinking into bin
  if (fi.el) {
    fi.el.style.transition = 'all 0.2s ease-in';
    fi.el.style.opacity = '0';
    fi.el.style.transform = `translateX(-50%) translateY(76vh) scale(0.2)`;
    setTimeout(() => { if (fi.el?.parentNode) fi.el.remove(); }, 200);
  }

  if (isCorrect) {
    handleCorrectSort(binEl);
  } else {
    handleWrongSort(binEl);
  }

  updateCurrentItem();
}

// ══════════════════════════════════════════════
// ── SCORING ──
// ══════════════════════════════════════════════

function handleCorrectSort(binEl) {
  state.correctCount++;
  state.levelCorrect++;
  state.levelStreak++;

  const pts = CONFIG.BASE_POINTS * state.combo;
  state.score += pts;
  state.combo = Math.min(state.combo + 1, CONFIG.MAX_COMBO);
  state.maxCombo = Math.max(state.maxCombo, state.combo);
  const effects = getActiveEffects();
  const timeBonus = CONFIG.TIME_BONUS_CORRECT + effects.timeBonusCorrect;
  state.timeLeft = Math.min(state.timeLeft + timeBonus, getLevelDuration(state.level));

  updateScore(state.score);
  popScore();
  updateCombo(state.combo);
  bumpCombo();
  flashBin(binEl, true);
  floatPoints('+' + pts, true, binEl);
  flashScreen('correct');
  playSound('correct');
  vibrate('light');

  const tier = getComboTier(state.combo);
  if (tier) {
    showComboTier(tier);
    playSound('comboTier');
    vibrate('double');
  }

  if (state.levelStreak > 0 && state.levelStreak % CONFIG.STREAK_BONUS_THRESHOLD === 0) {
    state.timeLeft = Math.min(state.timeLeft + CONFIG.STREAK_BONUS_TIME, getLevelDuration(state.level) + 10);
    showStreakBonus();
    playSound('streak');
    vibrate('triple');
  }
}

function handleWrongSort(binEl) {
  const wasCombo = state.combo;

  // Combo Shield: absorb the hit instead of resetting combo
  if (state.comboShieldCharges > 0 && wasCombo > 1) {
    state.comboShieldCharges--;
    state.levelStreak = 0;
    // Reduced time penalty when shielded
    state.timeLeft = Math.max(state.timeLeft - CONFIG.TIME_PENALTY_WRONG * 0.5, 0);
    flashBin(binEl, false);
    floatPoints('🛡️ SHIELD!', false, binEl);
    flashScreen('wrong');
    playSound('shield');
    vibrate('medium');
    return;
  }

  state.combo = 1;
  state.levelStreak = 0;
  state.timeLeft = Math.max(state.timeLeft - CONFIG.TIME_PENALTY_WRONG, 0);
  updateCombo(1);
  flashBin(binEl, false);
  floatPoints('-' + CONFIG.TIME_PENALTY_WRONG + 's', false, binEl);
  screenShake();
  flashScreen('wrong');
  showComboReset(wasCombo);
  playSound('wrong');
  vibrate('error');
}

// ══════════════════════════════════════════════
// ── STREAK BONUS ──
// ══════════════════════════════════════════════

function showStreakBonus() {
  let el = document.getElementById('streak-bonus-label');
  if (!el) {
    el = document.createElement('div');
    el.id = 'streak-bonus-label';
    el.className = 'streak-bonus-label';
    document.body.appendChild(el);
  }
  el.textContent = '⏰ +' + CONFIG.STREAK_BONUS_TIME + 's STREAK!';
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 800);
}

// ══════════════════════════════════════════════
// ── LEVEL TIME UP ──
// ══════════════════════════════════════════════

function onLevelTimeUp() {
  state.gameActive = false;
  stopGameLoop();
  clearFallingItems();
  scratchStop(); // DJ scratch effect on time up

  // Show "Zeit abgelaufen!" flash first
  const flash = document.getElementById('time-up-flash');
  if (flash) {
    flash.classList.remove('hidden', 'show');
    void flash.offsetWidth;
    flash.classList.add('show');
  }

  // After flash, show level result
  setTimeout(() => {
    if (flash) flash.classList.add('hidden');
    const accuracy = getLevelAccuracy();
    if (accuracy >= CONFIG.LEVEL_MIN_ACCURACY) {
      showLevelComplete(accuracy);
    } else {
      showLevelFailed(accuracy);
    }
  }, 1200);
}

function showLevelComplete(accuracy) {
  const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  setText('level-complete-title', 'Level ' + state.level + ' geschafft!');
  setText('lc-score', state.score);
  setText('lc-accuracy', accuracy + '%');
  setText('lc-combo', '×' + state.maxCombo);
  const streakEl = document.getElementById('level-complete-streak');
  if (streakEl) {
    streakEl.textContent = state.levelCorrect + ' richtig, ' + (state.levelTotal - state.levelCorrect) + ' Fehler';
  }
  // Show retry button if not perfect
  const retryBtn = document.getElementById('lc-retry-btn');
  if (retryBtn) {
    if (accuracy < 100) retryBtn.classList.remove('hidden');
    else retryBtn.classList.add('hidden');
  }
  document.getElementById('level-complete-overlay')?.classList.remove('hidden');
  recordLevelComplete(state.level, state.score, accuracy);
  playSound('levelup');
  vibrate('long');
  // Player clicks "Nächstes Level" manually - no auto-advance
}

// Called by "Nächstes Level" button
export function continueToNextLevel() {
  hideLevelOverlays();
  const prevLevel = state.level;
  const prevHotspot = state.currentHotspot;
  state.level++;
  setupLevel(state.level);
  const nextHotspot = state.currentHotspot;
  showLevelUpFlash(state.level);

  // Always show preview for next level (even same hotspot)
  if (hotspotChanges(prevLevel, state.level)) {
    crossfadeTo(nextHotspot?.id || 'park');
    setTimeout(() => showTransition(prevHotspot, nextHotspot, () => showLevelPreview()), CONFIG.LEVEL_UP_FLASH_DURATION);
  } else {
    setTimeout(() => showLevelPreview(), CONFIG.LEVEL_UP_FLASH_DURATION);
  }
}

function showLevelFailed(accuracy) {
  const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  setText('level-failed-title', 'Level ' + state.level + ' nicht bestanden');
  setText('lf-accuracy', accuracy + '%');
  setText('lf-correct', state.levelCorrect);
  setText('lf-errors', state.levelTotal - state.levelCorrect);
  document.getElementById('level-failed-overlay')?.classList.remove('hidden');
  playSound('levelfail');
  vibrate('heavy');
  // Player chooses: Retry or End Run - no auto-advance
}

// Called by "Nochmal versuchen" button
export function retryLevel() {
  hideLevelOverlays();
  // Reset per-level stats but keep run score
  showLevelPreview();
}

// Called by "Run beenden" button
export function endRunFromFail() {
  hideLevelOverlays();
  endRun();
}

function hideLevelOverlays() {
  document.getElementById('level-complete-overlay')?.classList.add('hidden');
  document.getElementById('level-failed-overlay')?.classList.add('hidden');
  document.getElementById('time-up-flash')?.classList.add('hidden');
}

// ══════════════════════════════════════════════
// ── END RUN ──
// ══════════════════════════════════════════════

function endRun() {
  state.gameActive = false;
  state.gameOver = true;
  stopTimer();
  stopGameLoop();
  clearFallingItems();
  stopMusic();
  const coinsEarned = earnCoins(state.score);
  const prevHs = getHighscore();
  const isNewHs = state.score > prevHs;
  if (isNewHs) setHighscore(state.score);
  showDeliverySequence({
    score: state.score, correctCount: state.correctCount, totalItems: state.totalItems,
    maxCombo: state.maxCombo, level: state.level, coinsEarned, isNewHighscore: isNewHs,
    hotspot: state.currentHotspot,
  }, (results) => showResultsScreen(results));
}

function clearFallingItems() {
  state.fallingItems.forEach(fi => { if (fi.el?.parentNode) fi.el.remove(); });
  state.fallingItems = [];
  state.currentItem = null;
  state.itemEl = null;
}

// ══════════════════════════════════════════════
// ── PAUSE ──
// ══════════════════════════════════════════════

export function togglePause() {
  if (!state.gameActive) return;
  state.paused = !state.paused;
  if (state.paused) { showPause(state.level, state.score); setMusicMuted(true); }
  else { hidePause(); setMusicMuted(false); lastFrameTime = performance.now(); }
}

export function quitGame() { state.paused = false; hidePause(); stopMusic(); endRun(); }

export function quitToHub() {
  state.gameActive = false; state.paused = false; hidePause();
  stopTimer(); stopGameLoop(); clearFallingItems(); stopMusic(); showHub();
}

// ══════════════════════════════════════════════
// ── HUB NAVIGATION ──
// ══════════════════════════════════════════════

export function goToHub() { showHub(); }

export function openLevelMap() {
  renderLevelMap((level) => {
    // Start a specific level from the map
    resetState();
    resetHUD();
    state.level = level;
    setupLevel(level);
    showLevelPreview();
  });
  showScreen('screen-levelmap');
}

export function startGameFromMap(level) {
  resetState();
  resetHUD();
  state.level = level;
  setupLevel(level);
  showLevelPreview();
}
export function replayLastRun() { startGame(); }
export function openShop() { renderShop(); showScreen('screen-shop'); }
export function openAvatar() {
  renderAvatarScreen();
  const el = document.getElementById('avatar-coins');
  if (el) el.textContent = getBalance();
  showScreen('screen-avatar');
}
export function openProfile() { renderProfileScreen(); showScreen('screen-profile'); }
export function saveProfileName() {
  const input = document.getElementById('profile-edit-name');
  if (input && input.value.trim()) { saveName(); renderProfileScreen(); }
}
export { playAsGuest, saveName, handleLogout } from '../auth/auth-screen.js';

export function toggleMuteBtn() {
  const muted = toggleMute();
  // Only mutes sound effects, NOT music (music has its own button)
  const label = muted ? '🔇 Sound aus' : '🔊 Sound an';
  const labelShort = muted ? '🔇 Sound' : '🔊 Sound';
  document.querySelectorAll('#btn-mute, #btn-mute-start').forEach(el => {
    el.textContent = el.id.includes('start') ? labelShort : label;
    el.classList.toggle('toggle-off', muted);
  });
  const hud = document.getElementById('btn-sound');
  if (hud) hud.textContent = muted ? '🔇' : '🔊';
}

export function toggleHapticBtn() {
  const enabled = toggleHaptic();
  const label = enabled ? '📳 Vibration an' : '📴 Vibration aus';
  const labelShort = enabled ? '📳 Vibration' : '📴 Vibration';
  document.querySelectorAll('#btn-haptic, #btn-haptic-start').forEach(el => {
    el.textContent = el.id.includes('start') ? labelShort : label;
    el.classList.toggle('toggle-off', !enabled);
  });
  // Update settings screen toggle
  const settingsBtn = document.getElementById('settings-haptic-toggle');
  if (settingsBtn) {
    settingsBtn.textContent = enabled ? 'AN' : 'AUS';
    settingsBtn.classList.toggle('off', !enabled);
  }
}

// ── Settings Screen ──

export function openSettings() {
  const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  setText('settings-coins', getBalance());

  // Update toggle states
  const sfxBtn = document.getElementById('settings-sfx-toggle');
  if (sfxBtn) {
    const muted = isMuted();
    sfxBtn.textContent = muted ? 'AUS' : 'AN';
    sfxBtn.classList.toggle('off', muted);
  }

  const sfxSlider = document.getElementById('settings-sfx-volume');
  if (sfxSlider) sfxSlider.value = Math.round(getSfxVolume() * 100);

  const musicBtn = document.getElementById('settings-music-toggle');
  if (musicBtn) {
    const musicOff = localStorage.getItem('tc_music_off') === '1';
    musicBtn.textContent = musicOff ? 'AUS' : 'AN';
    musicBtn.classList.toggle('off', musicOff);
  }

  const volSlider = document.getElementById('settings-music-volume');
  if (volSlider) volSlider.value = Math.round(getMusicVolume() * 100);

  const hapticBtn = document.getElementById('settings-haptic-toggle');
  if (hapticBtn) {
    const hapticOff = localStorage.getItem('tc_haptic_off') === '1';
    hapticBtn.textContent = hapticOff ? 'AUS' : 'AN';
    hapticBtn.classList.toggle('off', hapticOff);
  }

  // Highlight active preset
  const currentPreset = localStorage.getItem('tc_sound_preset') || 'standard';
  document.querySelectorAll('.settings-preset').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.preset === currentPreset);
  });

  // Highlight active play mode
  const curMode = getPlayMode();
  document.querySelectorAll('[data-mode]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === curMode);
  });

  // Render track list
  const trackContainer = document.getElementById('settings-tracks');
  if (trackContainer) {
    const cur = getCurrentTrack();
    trackContainer.innerHTML = TRACK_LIST.map(t =>
      `<button class="settings-preset ${t.key === cur ? 'active' : ''}" data-track="${t.key}" onclick="setMusicTrack('${t.key}')">
        <span class="settings-preset-icon">🎵</span>
        <span class="settings-preset-label">${t.name}</span>
      </button>`
    ).join('');
  }

  showScreen('screen-settings');
}

export function setMusicTrack(key) {
  setTrack(key);
  document.querySelectorAll('[data-track]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.track === key);
  });
}

// In-game music pause/resume button
export function toggleMusicInGame() {
  const paused = toggleMusicPause();
  const icon = paused ? '⏸' : '🎵';
  // Update both HUD and start screen buttons
  document.querySelectorAll('#btn-music, #btn-music-start').forEach(el => el.textContent = icon);
}

// Settings: music volume slider
export function setMusicVolumeFromSlider(val) {
  _setMusicVolume(val / 100);
}

export function setSfxVolumeFromSlider(val) {
  setSfxVolume(val / 100);
  playSound('button'); // preview
}

export function setPlayModeBtn(mode) {
  setPlayMode(mode);
  document.querySelectorAll('[data-mode]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
}

export function toggleMusicBtn() {
  const musicOff = localStorage.getItem('tc_music_off') !== '1';
  localStorage.setItem('tc_music_off', musicOff ? '1' : '0');
  setMusicMuted(musicOff);
  const btn = document.getElementById('settings-music-toggle');
  if (btn) {
    btn.textContent = musicOff ? 'AUS' : 'AN';
    btn.classList.toggle('off', musicOff);
  }
}

export function setSoundPreset(preset) {
  localStorage.setItem('tc_sound_preset', preset);
  setSoundStyle(preset);
  document.querySelectorAll('.settings-preset').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.preset === preset);
  });
  // Play a preview sound
  playSound('correct');
}
