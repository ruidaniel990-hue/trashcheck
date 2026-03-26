// ── Level Definitions ──
// 5 sub-levels per hotspot. Difficulty increases gently within a hotspot,
// then steps up noticeably at each new hotspot.
// Total: 25 core levels + endless mode beyond.

import { HOTSPOTS } from '../hotspot/hotspot-data.js';

// Hotspot stages in order, each with 5 sub-levels
const STAGES = [
  { hotspotId: 'park',       baseFall: 0,    baseSpawn: 0,   baseItems: 8  },
  { hotspotId: 'spielplatz', baseFall: -300,  baseSpawn: -40, baseItems: 10 },
  { hotspotId: 'strasse',    baseFall: -600,  baseSpawn: -80, baseItems: 12 },
  { hotspotId: 'festival',   baseFall: -900,  baseSpawn: -120, baseItems: 14 },
  { hotspotId: 'industrie',  baseFall: -1200, baseSpawn: -160, baseItems: 16 },
];

const LEVELS_PER_STAGE = 5;

// Gentle per-sub-level increment (within a hotspot)
const SUB_FALL_STEP = -40;    // very small speed increase per sub-level
const SUB_SPAWN_STEP = -6;    // very small spawn rate increase
const SUB_ITEMS_STEP = 1;     // +1 item per sub-level

// Generate all levels
export const LEVELS = [];

for (let s = 0; s < STAGES.length; s++) {
  const stage = STAGES[s];
  for (let sub = 0; sub < LEVELS_PER_STAGE; sub++) {
    const level = s * LEVELS_PER_STAGE + sub + 1;
    LEVELS.push({
      level,
      hotspotId: stage.hotspotId,
      stage: s + 1,             // which hotspot stage (1-5)
      subLevel: sub + 1,        // which sub-level within stage (1-5)
      itemsToComplete: stage.baseItems + sub * SUB_ITEMS_STEP,
      fallTimeBonus: stage.baseFall + sub * SUB_FALL_STEP,
      spawnDelayBonus: stage.baseSpawn + sub * SUB_SPAWN_STEP,
    });
  }
}

// For levels beyond the defined list, repeat last with max difficulty
export function getLevelDef(level) {
  if (level <= LEVELS.length) {
    return LEVELS[level - 1];
  }
  const last = LEVELS[LEVELS.length - 1];
  return { ...last, level, itemsToComplete: 20 };
}

export function getHotspotForLevel(level) {
  const def = getLevelDef(level);
  return HOTSPOTS.find(h => h.id === def.hotspotId) || HOTSPOTS[0];
}

// Get stage info for display
export function getLevelStageInfo(level) {
  const def = getLevelDef(level);
  return {
    stage: def.stage || Math.ceil(level / LEVELS_PER_STAGE),
    subLevel: def.subLevel || ((level - 1) % LEVELS_PER_STAGE) + 1,
    totalStages: STAGES.length,
    levelsPerStage: LEVELS_PER_STAGE,
  };
}
