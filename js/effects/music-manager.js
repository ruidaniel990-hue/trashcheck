// ── Music Manager ──
// Procedural background music loops per hotspot using Web Audio API.

import { isMuted } from './audio-manager.js';

let audioCtx = null;
let masterGain = null;
let currentLoop = null;
let currentHotspot = null;
const MASTER_VOL = 0.07;

function getCtx() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { return null; }
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  if (!masterGain) {
    masterGain = audioCtx.createGain();
    masterGain.gain.value = isMuted() ? 0 : MASTER_VOL;
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

// ── Note Scheduling Helpers ──

function scheduleNote(ctx, dest, freq, start, dur, type = 'sine', vol = 0.3) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(vol, start);
  gain.gain.setValueAtTime(vol, start + dur * 0.7);
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(start);
  osc.stop(start + dur);
}

function scheduleNoise(ctx, dest, start, dur, vol = 0.05, highpass = 3000) {
  const bufSize = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = highpass;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  src.start(start);
}

// ── Loop Definitions ──
// Each returns a function that schedules one bar of music and returns bar duration in seconds.

const LOOPS = {
  // Stadtpark: Gentle, natural, 90 BPM
  park(ctx, dest, t) {
    const bpm = 90, beat = 60 / bpm;
    const melody = [262, 330, 392, 330, 349, 294, 262, 294]; // C E G E F D C D
    melody.forEach((f, i) => {
      scheduleNote(ctx, dest, f, t + i * beat * 0.5, beat * 0.45, 'triangle', 0.25);
    });
    // Soft pad
    scheduleNote(ctx, dest, 131, t, beat * 4, 'sine', 0.15);
    // Bird chirp
    scheduleNote(ctx, dest, 2200, t + beat * 1.5, 0.05, 'sine', 0.08);
    scheduleNote(ctx, dest, 2600, t + beat * 1.6, 0.04, 'sine', 0.06);
    return beat * 4;
  },

  // Spielplatz: Playful, bouncy, 130 BPM
  spielplatz(ctx, dest, t) {
    const bpm = 130, beat = 60 / bpm;
    const melody = [523, 659, 784, 659, 523, 784, 659, 523]; // C5 E5 G5 E5 C5 G5 E5 C5
    melody.forEach((f, i) => {
      scheduleNote(ctx, dest, f, t + i * beat * 0.5, beat * 0.3, 'square', 0.12);
    });
    // Bouncy bass
    [262, 330, 262, 392].forEach((f, i) => {
      scheduleNote(ctx, dest, f, t + i * beat, beat * 0.8, 'triangle', 0.2);
    });
    // Xylophone hits
    scheduleNote(ctx, dest, 1047, t + beat * 0.5, 0.08, 'sine', 0.1);
    scheduleNote(ctx, dest, 1319, t + beat * 2.5, 0.08, 'sine', 0.1);
    return beat * 4;
  },

  // Hauptstraße: Urban, rhythmic, 110 BPM
  strasse(ctx, dest, t) {
    const bpm = 110, beat = 60 / bpm;
    // Bass line
    [110, 110, 147, 131].forEach((f, i) => {
      scheduleNote(ctx, dest, f, t + i * beat, beat * 0.7, 'sawtooth', 0.18);
    });
    // Hi-hat pattern
    for (let i = 0; i < 8; i++) {
      scheduleNoise(ctx, dest, t + i * beat * 0.5, 0.05, 0.04, 4000);
    }
    // Synth stab
    scheduleNote(ctx, dest, 330, t + beat * 1, beat * 0.3, 'square', 0.08);
    scheduleNote(ctx, dest, 392, t + beat * 3, beat * 0.3, 'square', 0.08);
    return beat * 4;
  },

  // Stadtfest: Festive, fast, energetic, 145 BPM
  festival(ctx, dest, t) {
    const bpm = 145, beat = 60 / bpm;
    // Oom-pah bass
    [196, 247, 196, 247].forEach((f, i) => {
      scheduleNote(ctx, dest, f, t + i * beat, beat * 0.5, 'triangle', 0.2);
    });
    // Melody: fast and bright
    const melody = [784, 880, 988, 880, 784, 659, 784, 880];
    melody.forEach((f, i) => {
      scheduleNote(ctx, dest, f, t + i * beat * 0.5, beat * 0.35, 'triangle', 0.15);
    });
    // Tambourine
    for (let i = 0; i < 8; i++) {
      scheduleNoise(ctx, dest, t + i * beat * 0.5, 0.04, i % 2 === 0 ? 0.05 : 0.03, 5000);
    }
    return beat * 4;
  },

  // Industriegebiet: Dark, mechanical, heavy, 95 BPM
  industrie(ctx, dest, t) {
    const bpm = 95, beat = 60 / bpm;
    // Sub bass drone
    scheduleNote(ctx, dest, 55, t, beat * 4, 'sawtooth', 0.15);
    // Mechanical rhythm
    [0, 1, 2, 3].forEach(i => {
      scheduleNote(ctx, dest, 82, t + i * beat, beat * 0.2, 'square', 0.12);
    });
    // Noise bursts (steam/machine sounds)
    scheduleNoise(ctx, dest, t + beat * 1.5, 0.15, 0.06, 1000);
    scheduleNoise(ctx, dest, t + beat * 3.5, 0.15, 0.06, 1500);
    // Dark melody
    scheduleNote(ctx, dest, 165, t + beat * 2, beat * 0.8, 'sawtooth', 0.08);
    scheduleNote(ctx, dest, 147, t + beat * 3, beat * 0.8, 'sawtooth', 0.08);
    return beat * 4;
  },
};

// Map hotspot IDs to loop keys
const HOTSPOT_MAP = {
  park: 'park',
  spielplatz: 'spielplatz',
  strasse: 'strasse',
  festival: 'festival',
  industrie: 'industrie',
};

// ── Loop Runner ──

function startLoop(hotspotId) {
  const ctx = getCtx();
  if (!ctx) return;

  const loopKey = HOTSPOT_MAP[hotspotId] || 'park';
  const loopFn = LOOPS[loopKey];
  if (!loopFn) return;

  let nextTime = ctx.currentTime + 0.1;
  let running = true;

  function scheduleNext() {
    if (!running) return;
    const barDur = loopFn(ctx, masterGain, nextTime);
    nextTime += barDur;
    // Schedule next bar 200ms before current one ends
    const delay = (nextTime - ctx.currentTime - 0.2) * 1000;
    if (delay > 0) {
      setTimeout(scheduleNext, Math.max(delay, 50));
    }
  }

  // Schedule first two bars for seamless start
  const dur1 = loopFn(ctx, masterGain, nextTime);
  nextTime += dur1;
  loopFn(ctx, masterGain, nextTime);
  nextTime += dur1;

  setTimeout(scheduleNext, (dur1 * 1.5) * 1000);

  return { stop() { running = false; } };
}

// ── MP3 Music Player ──
const TRACKS = {
  trash: { src: '/audio/trash.mp3', name: 'Trash Bash' },
  banana: { src: '/audio/shake-it-banana.mp3', name: 'Shake It Banana' },
  anthem: { src: '/audio/trash-check-anthem.mp3', name: 'Trash Check Anthem' },
  trash2: { src: '/audio/trash-2.mp3', name: 'Trash 2' },
  trash3: { src: '/audio/trash-3.mp3', name: 'Trash 3' },
};

export const TRACK_LIST = Object.entries(TRACKS).map(([key, t]) => ({ key, name: t.name }));

let mp3Audio = null;
let useMp3 = true;
let currentTrackKey = localStorage.getItem('tc_music_track') || 'trash';
let playMode = localStorage.getItem('tc_play_mode') || 'sequential'; // 'sequential' or 'shuffle'
let trackIndex = 0; // for sequential mode

const trackKeys = Object.keys(TRACKS);

export function setPlayMode(mode) {
  playMode = mode;
  localStorage.setItem('tc_play_mode', mode);
}

export function getPlayMode() { return playMode; }

// Pick next track based on play mode
export function advanceTrack() {
  if (trackKeys.length <= 1) return;
  if (playMode === 'shuffle') {
    let next;
    do { next = trackKeys[Math.floor(Math.random() * trackKeys.length)]; } while (next === currentTrackKey && trackKeys.length > 1);
    currentTrackKey = next;
  } else {
    trackIndex = (trackKeys.indexOf(currentTrackKey) + 1) % trackKeys.length;
    currentTrackKey = trackKeys[trackIndex];
  }
  localStorage.setItem('tc_music_track', currentTrackKey);
}

export function setTrack(key) {
  currentTrackKey = key;
  localStorage.setItem('tc_music_track', key);
  if (mp3Audio && !mp3Audio.paused) {
    startMp3(key);
  }
}

export function getCurrentTrack() { return currentTrackKey; }

function startMp3(trackKey) {
  stopMp3();
  const track = TRACKS[trackKey || currentTrackKey];
  if (!track) return;
  const src = track.src;
  mp3Audio = new Audio(src);
  mp3Audio.loop = true;
  mp3Audio.volume = isMuted() || localStorage.getItem('tc_music_off') === '1' ? 0 : musicVolume;
  mp3Audio.play().catch(() => {}); // may fail without user gesture
}

function stopMp3() {
  if (mp3Audio) { mp3Audio.pause(); mp3Audio.src = ''; mp3Audio = null; }
}

// DJ scratch stop: dramatic vinyl scratch with back-spin effect (~3s)
export function scratchStop() {
  if (!mp3Audio) return;
  const audio = mp3Audio;
  const startRate = audio.playbackRate || 1;
  const startVol = audio.volume;
  const duration = 3000; // ms — really long, dramatic scratch
  const startTime = performance.now();

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);

    if (progress < 0.15) {
      // Phase 1: quick stutter — rapid pitch jumps (record hand brake)
      const stutter = Math.sin(elapsed * 0.05) * 0.3;
      audio.playbackRate = startRate * (1 - progress * 2) + stutter;
      audio.volume = startVol;
    } else if (progress < 0.5) {
      // Phase 2: slow drag down with heavy wobble
      const p = (progress - 0.15) / 0.35;
      const wobble = Math.sin(p * 20) * 0.08 * (1 - p);
      audio.playbackRate = Math.max(0.7 * (1 - p * 0.85) + wobble, 0.05);
      audio.volume = startVol * (1 - p * 0.3);
    } else {
      // Phase 3: deep rumble fade-out — almost stopped
      const p = (progress - 0.5) / 0.5;
      const ease = p * p; // accelerating fade
      const wobble = Math.sin(p * 8) * 0.02 * (1 - p);
      audio.playbackRate = Math.max(0.1 * (1 - ease * 0.9) + wobble, 0.02);
      audio.volume = startVol * 0.7 * Math.max(1 - ease * 1.5, 0);
    }

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      audio.pause();
      audio.playbackRate = 1;
      mp3Audio = null;
    }
  }
  requestAnimationFrame(animate);
}

// ── Public API ──

export function startMusic(hotspotId) {
  if (useMp3) {
    startMp3(currentTrackKey);
  } else {
    if (currentLoop) currentLoop.stop();
    currentHotspot = hotspotId;
    currentLoop = startLoop(hotspotId);
  }
}

export function stopMusic() {
  stopMp3();
  if (currentLoop) { currentLoop.stop(); currentLoop = null; }
  currentHotspot = null;
}

export function crossfadeTo(hotspotId) {
  // MP3 mode: keep playing the same track
  if (useMp3) return;

  if (hotspotId === currentHotspot) return;
  if (masterGain && audioCtx) {
    const now = audioCtx.currentTime;
    masterGain.gain.setValueAtTime(masterGain.gain.value, now);
    masterGain.gain.linearRampToValueAtTime(0, now + 0.4);

    setTimeout(() => {
      if (currentLoop) currentLoop.stop();
      currentLoop = startLoop(hotspotId);
      currentHotspot = hotspotId;
      if (masterGain && audioCtx) {
        const t = audioCtx.currentTime;
        masterGain.gain.setValueAtTime(0, t);
        masterGain.gain.linearRampToValueAtTime(isMuted() ? 0 : MASTER_VOL, t + 0.4);
      }
    }, 450);
  } else {
    stopMusic();
    startMusic(hotspotId);
  }
}

let musicVolume = parseFloat(localStorage.getItem('tc_music_volume') || '0.15');
let musicPaused = false;

export function setMusicMuted(muted) {
  if (mp3Audio) {
    mp3Audio.volume = muted ? 0 : musicVolume;
  }
  if (masterGain && audioCtx) {
    const now = audioCtx.currentTime;
    masterGain.gain.setValueAtTime(masterGain.gain.value, now);
    masterGain.gain.linearRampToValueAtTime(muted ? 0 : MASTER_VOL, now + 0.15);
  }
}

export function setMusicVolume(val01) {
  musicVolume = val01;
  localStorage.setItem('tc_music_volume', val01);
  if (mp3Audio && !musicPaused && localStorage.getItem('tc_music_off') !== '1') {
    mp3Audio.volume = val01;
  }
}

export function getMusicVolume() { return musicVolume; }

export function toggleMusicPause() {
  if (!mp3Audio) return false;
  if (musicPaused) {
    mp3Audio.play().catch(() => {});
    mp3Audio.volume = musicVolume;
    musicPaused = false;
  } else {
    mp3Audio.pause();
    musicPaused = true;
  }
  return musicPaused;
}

export function isMusicPaused() { return musicPaused; }
