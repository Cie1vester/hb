/* ══════════════════════════════════════════════════════════════
   audio.js — every sound is synthesised live with WebAudio.
   No audio files, nothing to download, nothing to 404.
   ══════════════════════════════════════════════════════════════ */

const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
function hz(name) {
  if (!name) return 0;
  const m = /^([A-G]#?)(-?\d)$/.exec(name);
  if (!m) return 0;
  const semis = NOTE[m[1]] + (parseInt(m[2], 10) + 1) * 12 - 69;
  return 440 * Math.pow(2, semis / 12);
}

const AudioKit = {
  ctx: null, master: null, musicGain: null, sfxGain: null,
  muted: false, loopTimer: null, ready: false,

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.16;
    this.musicGain.connect(this.master);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.28;
    this.sfxGain.connect(this.master);
    this.ready = true;
  },

  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },

  /* one chiptune voice */
  tone(freq, dur, opt = {}) {
    if (!this.ready || this.muted || !freq) return;
    const t0 = opt.when || this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = opt.type || 'square';
    o.frequency.setValueAtTime(freq, t0);
    if (opt.slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, opt.slideTo), t0 + dur);

    const peak = opt.gain == null ? 0.5 : opt.gain;
    const atk = opt.attack == null ? 0.008 : opt.attack;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    o.connect(g);
    g.connect(opt.bus === 'music' ? this.musicGain : this.sfxGain);
    o.start(t0);
    o.stop(t0 + dur + 0.03);
  },

  noise(dur, opt = {}) {
    if (!this.ready || this.muted) return;
    const t0 = opt.when || this.ctx.currentTime;
    const n = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = opt.filter || 'lowpass';
    f.frequency.setValueAtTime(opt.freq || 1400, t0);
    if (opt.sweepTo) f.frequency.exponentialRampToValueAtTime(opt.sweepTo, t0 + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(opt.gain == null ? 0.35 : opt.gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(this.sfxGain);
    src.start(t0); src.stop(t0 + dur);
  },

  /* ── sfx ── */
  blip() { this.tone(620 + Math.random() * 90, 0.045, { type: 'square', gain: 0.09 }); },
  hover() { this.tone(880, 0.05, { type: 'triangle', gain: 0.1 }); },
  select() {
    const t = this.ctx ? this.ctx.currentTime : 0;
    this.tone(660, 0.07, { gain: 0.22, when: t });
    this.tone(990, 0.12, { gain: 0.2, when: t + 0.06 });
  },
  pop() { this.tone(320, 0.12, { type: 'triangle', gain: 0.25, slideTo: 900 }); },
  creak() {
    const t = this.ctx ? this.ctx.currentTime : 0;
    this.tone(180, 0.5, { type: 'sawtooth', gain: 0.07, slideTo: 240, when: t });
    this.noise(0.35, { freq: 900, sweepTo: 300, gain: 0.09, when: t + 0.05 });
  },
  step() { this.noise(0.05, { freq: 500, gain: 0.06 }); },
  spark() {
    const t = this.ctx ? this.ctx.currentTime : 0;
    this.noise(0.12, { filter: 'highpass', freq: 2600, gain: 0.14, when: t });
    this.tone(1400, 0.1, { type: 'triangle', gain: 0.12, slideTo: 2400, when: t + 0.02 });
  },
  whoosh(g) { this.noise(0.18, { filter: 'bandpass', freq: 700, sweepTo: 2200, gain: 0.04 + g * 0.16 }); },
  poof() {
    const t = this.ctx ? this.ctx.currentTime : 0;
    this.noise(0.45, { freq: 2200, sweepTo: 200, gain: 0.3, when: t });
    this.tone(160, 0.3, { type: 'sine', gain: 0.18, slideTo: 60, when: t });
  },
  confettiPop() {
    const t = this.ctx ? this.ctx.currentTime : 0;
    for (let i = 0; i < 5; i++) {
      this.noise(0.2, { filter: 'highpass', freq: 1800, gain: 0.16, when: t + i * 0.05 });
      this.tone(500 + i * 180, 0.14, { type: 'square', gain: 0.14, when: t + i * 0.05, slideTo: 1600 });
    }
  },

  /* ── "Happy Birthday" (public domain) as the finale fanfare ── */
  fanfare() {
    if (!this.ready) return;
    const B = 0.34, t0 = this.ctx.currentTime + 0.1;
    const mel = [
      ['G4', 0.5], ['G4', 0.5], ['A4', 1], ['G4', 1], ['C5', 1], ['B4', 2],
      ['G4', 0.5], ['G4', 0.5], ['A4', 1], ['G4', 1], ['D5', 1], ['C5', 2],
      ['G4', 0.5], ['G4', 0.5], ['G5', 1], ['E5', 1], ['C5', 1], ['B4', 1], ['A4', 1],
      ['F5', 0.5], ['F5', 0.5], ['E5', 1], ['C5', 1], ['D5', 1], ['C5', 3]
    ];
    let t = t0;
    for (const [n, b] of mel) {
      const d = b * B;
      this.tone(hz(n), d * 0.92, { type: 'square', gain: 0.30, when: t, bus: 'music' });
      this.tone(hz(n) / 2, d * 0.9, { type: 'triangle', gain: 0.18, when: t, bus: 'music' });
      t += d;
    }
    /* sparkly tail */
    for (let i = 0; i < 8; i++) {
      this.tone(hz('C6') * Math.pow(2, i / 12), 0.1, { type: 'triangle', gain: 0.12, when: t + i * 0.06, bus: 'music' });
    }
    return (t - t0) * 1000;
  },

  /* ── the cosy background waltz (original, loops forever) ── */
  MEL: [
    'G4', 'A4', 'B4', 'C5', null, 'B4', 'A4', 'G4', 'A4', 'G4', null, null,
    'E4', 'G4', 'C5', 'B4', null, 'A4', 'G4', 'F4', 'E4', 'D4', null, null,
    'G4', 'A4', 'B4', 'C5', null, 'D5', 'E5', 'D5', 'C5', 'B4', null, null,
    'A4', 'B4', 'C5', 'B4', null, 'A4', 'G4', null, 'E4', 'C4', null, null
  ],
  BASS: ['C3', 'A2', 'F2', 'G2', 'C3', 'E3', 'F2', 'G2', 'C3', 'A2', 'F2', 'G2', 'A2', 'G2', 'F2', 'C3'],

  startMusic() {
    if (!this.ready) return;
    this.stopMusic();
    const schedule = () => {
      const B = 0.42;                       // seconds per beat (3/4 waltz)
      const t0 = this.ctx.currentTime + 0.08;
      this.MEL.forEach((n, i) => {
        if (!n) return;
        this.tone(hz(n), B * 0.85, { type: 'square', gain: 0.24, when: t0 + i * B, bus: 'music' });
      });
      this.BASS.forEach((n, bar) => {
        const bt = t0 + bar * 3 * B;
        this.tone(hz(n), B * 0.8, { type: 'triangle', gain: 0.34, when: bt, bus: 'music' });
        this.tone(hz(n) * 1.5, B * 0.5, { type: 'triangle', gain: 0.16, when: bt + B, bus: 'music' });
        this.tone(hz(n) * 1.5, B * 0.5, { type: 'triangle', gain: 0.14, when: bt + 2 * B, bus: 'music' });
      });
      this.loopTimer = setTimeout(schedule, this.MEL.length * B * 1000 - 60);
    };
    schedule();
  },

  stopMusic() { if (this.loopTimer) { clearTimeout(this.loopTimer); this.loopTimer = null; } },

  duckMusic(to = 0.05, secs = 0.4) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(t);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, t);
    this.musicGain.gain.linearRampToValueAtTime(to, t + secs);
  },
  unduckMusic(to = 0.16, secs = 0.8) { this.duckMusic(to, secs); },

  setMuted(m) {
    this.muted = m;
    if (this.ready) this.master.gain.value = m ? 0 : 0.9;
  }
};
