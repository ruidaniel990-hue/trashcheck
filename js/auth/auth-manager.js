// ── Auth Manager ──
// Handles player identity: guest mode, profile, and future login.
// localStorage-based for now, ready for backend integration later.

const PROFILE_KEY = 'trashcheck_profile';

const DEFAULT_PROFILE = {
  id: null,
  name: 'Gast',
  isGuest: true,
  createdAt: null,
  avatarEmoji: '🧑',
};

// ── Get or create profile ──
export function getProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROFILE_KEY));
    if (saved && saved.id) return saved;
  } catch {}
  return null;
}

export function hasProfile() {
  return getProfile() !== null;
}

// ── Create guest profile ──
export function createGuestProfile() {
  const profile = {
    ...DEFAULT_PROFILE,
    id: 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    isGuest: true,
    createdAt: new Date().toISOString(),
  };
  saveProfile(profile);
  return profile;
}

// ── Register with name ──
export function registerProfile(name) {
  const existing = getProfile();
  const profile = {
    id: existing?.id || 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    name: name.trim().substring(0, 20),
    isGuest: false,
    createdAt: existing?.createdAt || new Date().toISOString(),
    avatarEmoji: existing?.avatarEmoji || '🧑',
  };
  saveProfile(profile);
  return profile;
}

// ── Update profile ──
export function updateProfile(updates) {
  const profile = getProfile();
  if (!profile) return null;
  const updated = { ...profile, ...updates };
  saveProfile(updated);
  return updated;
}

// ── Set avatar emoji ──
export function setAvatarEmoji(emoji) {
  return updateProfile({ avatarEmoji: emoji });
}

// ── Get display name ──
export function getDisplayName() {
  const profile = getProfile();
  return profile ? profile.name : 'Gast';
}

// ── Get player ID (for battles etc.) ──
export function getPlayerId() {
  const profile = getProfile();
  return profile ? profile.id : null;
}

// ── Logout / reset ──
export function logout() {
  localStorage.removeItem(PROFILE_KEY);
}

// ── Internal ──
function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}
