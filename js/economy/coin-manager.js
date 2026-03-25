// ── Coin Manager ──
// Manages coin transactions. Delegates persistence to storage-bridge.

import { getCoins, addCoins as storageAddCoins } from '../storage/storage-bridge.js';
import { calculateCoins } from '../core/game-config.js';
import { getActiveEffects } from '../shop/shop-manager.js';

export function getBalance() {
  return getCoins();
}

export function earnCoins(score) {
  const base = calculateCoins(score);
  const effects = getActiveEffects();
  const amount = Math.floor(base * effects.coinMultiplier);
  storageAddCoins(amount);
  return amount;
}

export function spendCoins(amount) {
  const balance = getCoins();
  if (balance < amount) return false;
  storageAddCoins(-amount);
  return true;
}
