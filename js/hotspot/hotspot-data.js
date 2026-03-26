// ── Hotspot Definitions ──
// Each hotspot = a location with its own trash mix, theme, and difficulty.
// categories: exactly 3 category keys that are active at this hotspot.

export const HOTSPOTS = [
  {
    id: 'park',
    name: 'Stadtpark',
    icon: '🌳',
    description: 'Grüne Wiesen, voller Picknick-Reste',
    categories: ['bio', 'papier', 'rest'],
    difficulty: 1,
    background: '#0a1a0e',  // dark green tint
    bgGradient: 'linear-gradient(180deg, #0a2010 0%, #0d3018 20%, #0a1a0e 50%, #061208 80%, #040e06 100%)',
  },
  {
    id: 'spielplatz',
    name: 'Spielplatz',
    icon: '🎢',
    description: 'Zwischen Rutschen und Sandkästen',
    categories: ['gelb', 'rest', 'bio'],
    difficulty: 1,
    background: '#1a150a',  // warm dark
    bgGradient: 'linear-gradient(180deg, #1a180e 0%, #2a2010 20%, #1a150a 50%, #12100a 80%, #0a0806 100%)',
  },
  {
    id: 'strasse',
    name: 'Hauptstraße',
    icon: '🏙️',
    description: 'Hektik, Verpackungen und Glasflaschen',
    categories: ['gelb', 'glas', 'papier'],
    difficulty: 2,
    background: '#0a0e1a',  // default dark blue
    bgGradient: 'linear-gradient(180deg, #0c1225 0%, #101830 20%, #0a0e1a 50%, #060a14 80%, #040810 100%)',
  },
  {
    id: 'festival',
    name: 'Stadtfest',
    icon: '🎪',
    description: 'Party-Chaos und jede Menge Müll',
    categories: ['gelb', 'glas', 'rest'],
    difficulty: 3,
    background: '#1a0a1a',  // purple tint
    bgGradient: 'linear-gradient(180deg, #1e0c22 0%, #2a1030 20%, #1a0a1a 50%, #140818 80%, #0e060e 100%)',
  },
  {
    id: 'industrie',
    name: 'Industriegebiet',
    icon: '🏭',
    description: 'Vorsicht – hier liegt auch Sondermüll!',
    categories: ['sonder', 'rest', 'gelb'],
    difficulty: 4,
    background: '#1a0e0a',  // dark orange tint
    bgGradient: 'linear-gradient(180deg, #201008 0%, #2a1608 20%, #1a0e0a 50%, #140a06 80%, #0e0804 100%)',
  },
];

export function getHotspotById(id) {
  return HOTSPOTS.find(h => h.id === id) || null;
}
