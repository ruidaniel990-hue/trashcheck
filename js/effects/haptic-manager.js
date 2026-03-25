// ── Haptic Manager ──
// Vibration API for mobile feedback.

let enabled = true;

export function vibrate(pattern = 'light') {
  if (!enabled || !navigator.vibrate) return;

  const patterns = {
    light: [15],
    medium: [30],
    heavy: [50],
    double: [15, 50, 15],
    triple: [15, 40, 15, 40, 15],
    long: [80],
    error: [40, 30, 40],
  };

  navigator.vibrate(patterns[pattern] || patterns.light);
}

export function toggleHaptic() {
  enabled = !enabled;
  return enabled;
}

export function isHapticEnabled() {
  return enabled;
}
