// ── Trashcheck Entry Point ──
// Boots the game, wires up input, and exposes functions for HTML onclick handlers.

import {
  initStart, startGame, startLevel, togglePause, quitGame, moveItemToLane, setSoftDrop,
  goToHub, openShop, openAvatar, replayLastRun, quitToHub,
  continueToNextLevel, retryLevel, endRunFromFail,
  openProfile, saveProfileName,
  playAsGuest, saveName, handleLogout,
  openLevelMap,
  toggleMuteBtn, toggleHapticBtn,
  openSettings, toggleMusicBtn, setSoundPreset,
} from './core/game-engine.js';
import { setupInput } from './core/game-input.js';

// Expose to window for onclick handlers in HTML
window.initStart = initStart;
window.startGame = startGame;
window.startLevel = startLevel;
window.togglePause = togglePause;
window.quitGame = quitGame;
window.goToHub = goToHub;
window.openShop = openShop;
window.openAvatar = openAvatar;
window.replayLastRun = replayLastRun;
window.quitToHub = quitToHub;
window.continueToNextLevel = continueToNextLevel;
window.retryLevel = retryLevel;
window.endRunFromFail = endRunFromFail;
window.openProfile = openProfile;
window.saveProfileName = saveProfileName;
window.playAsGuest = playAsGuest;
window.saveName = saveName;
window.handleLogout = handleLogout;
window.openLevelMap = openLevelMap;
window.toggleMuteBtn = toggleMuteBtn;
window.toggleHapticBtn = toggleHapticBtn;
window.openSettings = openSettings;
window.toggleMusicBtn = toggleMusicBtn;
window.setSoundPreset = setSoundPreset;

// Boot
window.addEventListener('load', () => {
  initStart();

  const zone = document.getElementById('fall-zone');
  if (zone) {
    setupInput(zone, (item, lane) => moveItemToLane(lane, item), setSoftDrop);
  }

});
