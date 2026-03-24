// ── Auth Screen ──
// Login/Register/Guest UI for player profile management.

import { getProfile, hasProfile, createGuestProfile, registerProfile, getDisplayName, logout } from './auth-manager.js';
import { showScreen } from '../ui/screen-manager.js';

// ── Render profile screen ──
export function renderProfileScreen() {
  const profile = getProfile();

  const nameEl = document.getElementById('profile-name');
  const statusEl = document.getElementById('profile-status');
  const inputEl = document.getElementById('profile-name-input');
  const guestBadge = document.getElementById('profile-guest-badge');

  if (profile) {
    if (nameEl) nameEl.textContent = profile.name;
    if (statusEl) statusEl.textContent = profile.isGuest ? 'Gastprofil' : 'Registriert';
    if (inputEl) inputEl.value = profile.name === 'Gast' ? '' : profile.name;
    if (guestBadge) guestBadge.style.display = profile.isGuest ? 'block' : 'none';
  }
}

// ── Handle "Als Gast spielen" ──
export function playAsGuest(callback) {
  if (!hasProfile()) {
    createGuestProfile();
  }
  if (callback) callback();
}

// ── Handle "Name speichern" ──
export function saveName() {
  const inputEl = document.getElementById('profile-name-input');
  if (!inputEl) return;

  const name = inputEl.value.trim();
  if (name.length < 1) return;

  registerProfile(name);
  renderProfileScreen();

  // Update profile badge on start screen
  updateStartScreenProfile();
}

// ── Update profile display on start screen ──
export function updateStartScreenProfile() {
  const badge = document.getElementById('start-profile-name');
  if (badge) badge.textContent = getDisplayName();
}

// ── Handle logout ──
export function handleLogout() {
  logout();
  showScreen('screen-auth');
  renderProfileScreen();
}
