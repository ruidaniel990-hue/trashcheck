// ── Storage Bridge (Standalone) ──
// localStorage-only version, no external dependencies.

const HS_KEY = 'trashcheck_hs';
const COINS_KEY = 'trashcheck_coins';

export function getHighscore() {
  return parseInt(localStorage.getItem(HS_KEY) || '0');
}

export function setHighscore(score) {
  localStorage.setItem(HS_KEY, String(score));
}

export function getCoins() {
  return parseInt(localStorage.getItem(COINS_KEY) || '0');
}

export function setCoins(amount) {
  localStorage.setItem(COINS_KEY, String(amount));
}

export function addCoins(amount) {
  const current = getCoins();
  setCoins(current + amount);
}
