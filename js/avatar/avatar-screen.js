// ── Avatar Screen ──
// Displays player avatar with equipment slots and owned items.

import { SLOTS } from '../shop/shop-data.js';
import { getOwnedItems, getEquipped, equipItem, unequipSlot, getEquippedInSlot } from '../shop/shop-manager.js';
import { getItemById, getItemsBySlot } from '../shop/shop-data.js';

const SLOT_CONFIG = [
  { slot: SLOTS.HEAD,   label: 'Kopf',   icon: '🎩', emoji: '❓' },
  { slot: SLOTS.HANDS,  label: 'Hände',  icon: '🧤', emoji: '❓' },
  { slot: SLOTS.BACK,   label: 'Rücken', icon: '🎒', emoji: '❓' },
  { slot: SLOTS.OUTFIT, label: 'Outfit', icon: '👔', emoji: '❓' },
];

export function renderAvatarScreen() {
  const owned = getOwnedItems();
  const equipped = getEquipped();

  // Avatar figure
  const figureEl = document.getElementById('avatar-figure');
  if (figureEl) {
    const outfitId = equipped[SLOTS.OUTFIT];
    const outfitItem = outfitId ? getItemById(outfitId) : null;
    figureEl.innerHTML = `
      <div class="avatar-body">${outfitItem ? outfitItem.icon : '🧑'}</div>
      <div class="avatar-name-label" id="avatar-name-display"></div>
    `;
  }

  // Equipment slots
  const slotsEl = document.getElementById('avatar-slots');
  if (slotsEl) {
    slotsEl.innerHTML = SLOT_CONFIG.map(sc => {
      const equippedId = equipped[sc.slot];
      const equippedItem = equippedId ? getItemById(equippedId) : null;

      const effectText = equippedItem && equippedItem.soloEffect
        ? Object.entries(equippedItem.soloEffect).map(([k, v]) => {
            if (k === 'timeBonusCorrect') return '+' + v + 's';
            if (k === 'comboShield') return v + '× Schutz';
            if (k === 'coinMultiplier') return '+' + Math.round((v - 1) * 100) + '%';
            return '';
          }).filter(Boolean).join(', ')
        : '';

      return `
        <div class="avatar-slot ${equippedItem ? 'avatar-slot-filled' : 'avatar-slot-empty'}">
          <div class="avatar-slot-icon">${equippedItem ? equippedItem.icon : sc.emoji}</div>
          <div class="avatar-slot-info">
            <div class="avatar-slot-label">${sc.label}</div>
            <div class="avatar-slot-item">${equippedItem ? equippedItem.name : 'Leer'}</div>
            ${effectText ? `<div class="avatar-slot-effect">${effectText}</div>` : ''}
          </div>
          ${equippedItem
            ? `<button class="avatar-slot-btn avatar-slot-btn-remove" data-action="unequip" data-slot="${sc.slot}">✕</button>`
            : ''}
        </div>`;
    }).join('');

    // Event listeners
    slotsEl.querySelectorAll('[data-action="unequip"]').forEach(btn => {
      btn.addEventListener('click', () => {
        unequipSlot(btn.dataset.slot);
        renderAvatarScreen();
      });
    });
  }

  // Owned items list (items available to equip)
  const itemsEl = document.getElementById('avatar-items');
  if (itemsEl) {
    const equippedIds = Object.values(equipped);
    const availableItems = owned
      .map(id => getItemById(id))
      .filter(item => item && !equippedIds.includes(item.id));

    if (availableItems.length === 0) {
      itemsEl.innerHTML = '<div class="avatar-no-items">Keine weiteren Items. Besuche den Shop!</div>';
    } else {
      itemsEl.innerHTML = availableItems.map(item => `
        <div class="avatar-item-card">
          <div class="avatar-item-icon">${item.icon}</div>
          <div class="avatar-item-info">
            <div class="avatar-item-name">${item.name}</div>
            <div class="avatar-item-slot">${SLOT_CONFIG.find(s => s.slot === item.slot)?.label || ''}</div>
          </div>
          <button class="avatar-item-equip" data-action="equip" data-id="${item.id}">Anlegen</button>
        </div>
      `).join('');

      itemsEl.querySelectorAll('[data-action="equip"]').forEach(btn => {
        btn.addEventListener('click', () => {
          equipItem(btn.dataset.id);
          renderAvatarScreen();
        });
      });
    }
  }
}
