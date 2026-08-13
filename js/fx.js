/* ══════════════════════════════════════════════════════════════
   fx.js — particles and screen shake.
   One flat array, updated and drawn each frame.
   ══════════════════════════════════════════════════════════════ */

const FX = {
  parts: [],
  shake: 0,

  spawn(p) { if (this.parts.length < 260) this.parts.push(p); },

  /* ambient dust drifting through the lamplight */
  dust(n = 22) {
    for (let i = 0; i < n; i++) this.spawn({
      kind: 'dust', x: Math.random() * 320, y: Math.random() * 170,
      vx: 0.06 + Math.random() * 0.12, vy: -0.04 - Math.random() * 0.08,
      life: 999, max: 999, s: 1, col: '#FFF0C8', a: 0.25 + Math.random() * 0.3,
      w: Math.random() * 6.28
    });
  },

  heart(x, y, opt = {}) {
    this.spawn({
      kind: 'heart', x, y,
      vx: (Math.random() - 0.5) * (opt.spread || 0.7),
      vy: -(0.35 + Math.random() * 0.5) * (opt.speed || 1),
      life: opt.life || 1.6, max: opt.life || 1.6,
      s: opt.s || (Math.random() < 0.5 ? 2 : 3),
      col: opt.col || ['#FF7FA8', '#FF9EC4', '#FFB3D4', '#FF6E8A'][(Math.random() * 4) | 0],
      w: Math.random() * 6.28
    });
  },

  heartBurst(x, y, n = 12) { for (let i = 0; i < n; i++) this.heart(x, y, { spread: 3.2, speed: 1.8, life: 1.9 }); },

  sparkle(x, y, col) {
    this.spawn({
      kind: 'spark', x, y,
      vx: (Math.random() - 0.5) * 1.2, vy: (Math.random() - 0.5) * 1.2 - 0.3,
      life: 0.7 + Math.random() * 0.5, max: 1.2, s: 1 + ((Math.random() * 2) | 0),
      col: col || ['#FFF3B0', '#FFFFFF', '#FFD98A'][(Math.random() * 3) | 0], w: 0
    });
  },

  confetti(n = 90, life = 7) {
    const cols = ['#FF9EC4', '#FFD98A', '#A8E0F0', '#C7B0F0', '#A8E6A0', '#FFFFFF', '#FF7FA8'];
    for (let i = 0; i < n; i++) this.spawn({
      kind: 'conf', x: Math.random() * 320, y: -Math.random() * 140,
      vx: (Math.random() - 0.5) * 1.1, vy: 0.4 + Math.random() * 1.1,
      life, max: life, s: 1 + ((Math.random() * 2) | 0),
      col: cols[(Math.random() * cols.length) | 0], w: Math.random() * 6.28,
      spin: 0.1 + Math.random() * 0.25
    });
  },

  /* puff of smoke when the candles go out */
  puff(x, y) {
    for (let i = 0; i < 16; i++) this.spawn({
      kind: 'smoke', x: x + (Math.random() - 0.5) * 18, y: y + (Math.random() - 0.5) * 4,
      vx: (Math.random() - 0.2) * 0.9, vy: -0.3 - Math.random() * 0.5,
      life: 1.2 + Math.random(), max: 2.2, s: 1 + ((Math.random() * 2) | 0),
      col: '#D8CCE4', w: 0
    });
  },

  update(dt) {
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 5);
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.w += (p.spin || 0.06);
      if (p.kind === 'dust') {
        p.x += p.vx + Math.sin(p.w) * 0.08; p.y += p.vy;
        if (p.y < -4) { p.y = 176; p.x = Math.random() * 320; }
        if (p.x > 324) p.x = -4;
        continue;
      }
      p.x += p.vx + (p.kind === 'heart' ? Math.sin(p.w) * 0.35 : 0);
      p.y += p.vy;
      if (p.kind === 'conf') { p.vy = Math.min(1.9, p.vy + dt * 0.7); p.vx *= 0.995; }
      if (p.kind === 'heart') p.vy *= 0.995;
      if (p.kind === 'smoke') { p.vy *= 0.98; p.vx *= 0.98; }
      p.life -= dt;
      if (p.life <= 0 || p.y > 190) this.parts.splice(i, 1);
    }
  },

  draw(g) {
    for (const p of this.parts) {
      const fade = p.kind === 'dust' ? p.a : Math.min(1, p.life / (p.max * 0.45));
      g.globalAlpha = Math.max(0, fade);
      switch (p.kind) {
        case 'heart': drawHeart(g, p.x, p.y, p.s, p.col); break;
        case 'spark': drawSparkle(g, p.x, p.y, p.s, p.col); break;
        case 'conf': {
          const h = Math.max(1, Math.round(Math.abs(Math.cos(p.w)) * p.s * 2));
          PX.rect(g, p.x, p.y, p.s + 1, h, p.col); break;
        }
        default: PX.rect(g, p.x, p.y, p.s, p.s, p.col);
      }
    }
    g.globalAlpha = 1;
  },

  clearBursts() { this.parts = this.parts.filter(p => p.kind === 'dust'); }
};
