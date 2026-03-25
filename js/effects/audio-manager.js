// ── Audio Manager ──
// Synthesized sound effects using Web Audio API. No external files needed.

let muted = false;
let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { return null; }
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// ── Sound Definitions ──

function playTone(freq, duration, type = 'sine', volume = 0.15, ramp = true) {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  if (ramp) gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration, volume = 0.08) {
  const ctx = getCtx();
  if (!ctx) return;
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 2000;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start();
}

const SOUNDS = {
  correct() {
    // Quick bright "ding" - rising two-tone
    playTone(880, 0.1, 'sine', 0.12);
    setTimeout(() => playTone(1320, 0.15, 'sine', 0.1), 50);
  },
  wrong() {
    // Low buzz - descending
    playTone(220, 0.15, 'square', 0.08);
    setTimeout(() => playTone(160, 0.2, 'square', 0.06), 80);
  },
  combo() {
    // Quick ascending arpeggio
    playTone(660, 0.1, 'sine', 0.1);
    setTimeout(() => playTone(880, 0.1, 'sine', 0.1), 60);
    setTimeout(() => playTone(1100, 0.15, 'sine', 0.12), 120);
  },
  comboTier() {
    // Fanfare-like chord burst
    playTone(523, 0.2, 'sine', 0.1);
    playTone(659, 0.2, 'sine', 0.08);
    playTone(784, 0.2, 'sine', 0.08);
    setTimeout(() => playTone(1047, 0.3, 'triangle', 0.12), 150);
  },
  shield() {
    // Metallic "clank" shield block
    playTone(400, 0.08, 'square', 0.1);
    setTimeout(() => playTone(800, 0.12, 'triangle', 0.08), 30);
    playNoise(0.06, 0.05);
  },
  streak() {
    // Quick sparkle
    [880, 1100, 1320, 1760].forEach((f, i) => {
      setTimeout(() => playTone(f, 0.1, 'sine', 0.08), i * 40);
    });
  },
  levelup() {
    // Victory jingle - ascending major
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => playTone(f, 0.2, 'triangle', 0.12), i * 100);
    });
  },
  levelfail() {
    // Descending sad tones
    [440, 370, 311, 261].forEach((f, i) => {
      setTimeout(() => playTone(f, 0.25, 'sine', 0.1), i * 120);
    });
  },
  gameover() {
    // Low dramatic end
    playTone(220, 0.3, 'sawtooth', 0.06);
    setTimeout(() => playTone(165, 0.4, 'sawtooth', 0.05), 200);
    setTimeout(() => playTone(110, 0.6, 'sine', 0.08), 400);
  },
  button() {
    // Soft click
    playTone(600, 0.05, 'sine', 0.06);
  },
  spawn() {
    // Subtle whoosh
    playNoise(0.08, 0.03);
  },
};

// ── Public API ──

export function playSound(name) {
  if (muted) return;
  const fn = SOUNDS[name];
  if (fn) {
    try { fn(); } catch { /* silent fail on audio issues */ }
  }
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

// Initialize audio context on first user interaction
export function initAudio() {
  const handler = () => {
    getCtx();
    document.removeEventListener('touchstart', handler);
    document.removeEventListener('click', handler);
  };
  document.addEventListener('touchstart', handler, { once: true });
  document.addEventListener('click', handler, { once: true });
}
