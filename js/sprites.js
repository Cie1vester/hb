/* ══════════════════════════════════════════════════════════════
   sprites.js — original pixel art, drawn procedurally.
   Everything lands on whole pixels so it reads as real pixel art.
   Character origin is the point between their feet on the floor.
   ══════════════════════════════════════════════════════════════ */

const PX = {
  rect(g, x, y, w, h, c) {
    g.fillStyle = c;
    g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  },

  /* pixel-perfect filled ellipse, scanline by scanline */
  ell(g, cx, cy, rx, ry, c) {
    cx = Math.round(cx); cy = Math.round(cy);
    rx = Math.max(0.5, rx); ry = Math.max(0.5, ry);
    g.fillStyle = c;
    const iry = Math.round(ry);
    for (let y = -iry; y <= iry; y++) {
      const t = 1 - (y * y) / (ry * ry);
      if (t <= 0) continue;
      const w = Math.floor(rx * Math.sqrt(t));
      if (w > 0) g.fillRect(cx - w, cy + y, w * 2 + 1, 1);
    }
  },

  /* scanline polygon fill — used for hood spikes, fangs, flames */
  poly(g, pts, c) {
    let minY = Infinity, maxY = -Infinity;
    for (const p of pts) { if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1]; }
    g.fillStyle = c;
    for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
      const xs = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
          xs.push(a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
        }
      }
      xs.sort((p, q) => p - q);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        const x0 = Math.round(xs[i]), x1 = Math.round(xs[i + 1]);
        if (x1 > x0) g.fillRect(x0, y, x1 - x0, 1);
      }
    }
  },

  /* soft contact shadow on the floor */
  shadow(g, x, y, w) {
    g.globalAlpha = 0.16;
    PX.ell(g, x, y, w, Math.max(2, w * 0.3), '#3a2038');
    g.globalAlpha = 1;
  }
};

/* ─────────────── palettes ─────────────── */

const PAL = {
  purin: {
    lite: '#FFF0BE', base: '#FBDB86', mid: '#F3C963', dark: '#E0AE49',
    beret: '#8E5C33', beretDark: '#6E4526', beretLite: '#A9743F',
    ink: '#4A3320', blush: '#FF9FB8', mouth: '#7A5230'
  },
  kuromi: {
    lite: '#FFFFFF', base: '#F7F2FA', mid: '#E4DAEE', dark: '#CBBEDC',
    hood: '#332A42', hoodDark: '#241D30', hoodLite: '#463A59',
    skull: '#FFB3D4', skullDark: '#E888B4',
    ink: '#2A2135', blush: '#FF9FC8', mouth: '#3A2E48'
  },
  cake: {
    plate: '#EFE6F2', plateDark: '#CDBFD6',
    sponge: '#F6D9A6', spongeDark: '#E0BC82',
    frost: '#FFC2DC', frostLite: '#FFE0EE', frostDark: '#F09CC0',
    cream: '#FFFFFF',
    candle: '#FF9EC4', candle2: '#FFFFFF',
    flame: '#FFD34E', flameHot: '#FFF3B0', flameEdge: '#FF8C36'
  }
};

/* ═══════════════ eyes & mouths ═══════════════
   Shared expression kit. `p` is the palette, (ex,ey) the eye line centre. */

function drawEyes(g, ex, ey, face, p, opt = {}) {
  const gap = opt.gap || 5.5, w = opt.w || 3, h = opt.h || 4;
  const L = ex - gap, R = ex + gap;

  const open = (x, sw, sh) => {
    PX.ell(g, x, ey, sw, sh, p.ink);
    PX.rect(g, x - sw + 1, ey - sh, 1, 1, '#ffffff'); // glint
  };
  const arc = (x, dir) => { // happy closed ^ ^  (dir 1 = ^, -1 = u)
    for (let i = -w; i <= w; i++) {
      const dy = dir * (Math.abs(i) * 0.55 - w * 0.35);
      PX.rect(g, x + i, ey + dy, 1, 1, p.ink);
    }
  };
  const flat = (x) => PX.rect(g, x - w, ey, w * 2 + 1, 1, p.ink);

  switch (face) {
    case 'happy': case 'proud': arc(L, 1); arc(R, 1); break;
    case 'blush': case 'soft': arc(L, 1); arc(R, 1); break;
    case 'closed': arc(L, -1); arc(R, -1); break;
    case 'blink': flat(L); flat(R); break;
    case 'surprised': open(L, w + 1, h + 1); open(R, w + 1, h + 1); break;
    case 'sneaky': flat(L); flat(R); break;
    case 'annoyed':
      PX.rect(g, L - w, ey - 2, w * 2 + 1, 1, p.ink); flat(L);
      PX.rect(g, R - w, ey - 2, w * 2 + 1, 1, p.ink); flat(R); break;
    case 'smug':
      open(L, w, h - 1); open(R, w, h - 1);
      PX.rect(g, L - w, ey - 4, w * 2 + 1, 1, p.ink);   // lowered brow
      PX.rect(g, R - w, ey - 5, w * 2 + 1, 1, p.ink); break;
    case 'sparkle':
      for (const x of [L, R]) {
        PX.rect(g, x - 1, ey - 3, 3, 7, p.ink); PX.rect(g, x - 3, ey - 1, 7, 3, p.ink);
        PX.rect(g, x - 1, ey - 1, 2, 2, '#ffffff');
      } break;
    case 'wink': arc(L, 1); open(R, w, h); break;
    default: open(L, w, h); open(R, w, h);
  }
}

function purinMouth(g, x, y, face, p) {
  switch (face) {
    case 'surprised': case 'panic': PX.ell(g, x, y + 1, 2, 2.5, p.mouth); break;
    case 'sparkle': case 'proud':
      PX.poly(g, [[x - 4, y - 1], [x + 4, y - 1], [x, y + 4]], p.mouth); break;
    case 'sneaky':
      PX.rect(g, x - 3, y, 5, 1, p.mouth); PX.rect(g, x + 2, y - 1, 1, 1, p.mouth); break;
    default: // gentle 3-shaped puppy smile
      PX.rect(g, x - 3, y, 3, 1, p.mouth); PX.rect(g, x + 1, y, 3, 1, p.mouth);
      PX.rect(g, x - 4, y - 1, 1, 1, p.mouth); PX.rect(g, x + 4, y - 1, 1, 1, p.mouth);
      PX.rect(g, x, y + 1, 1, 1, p.mouth);
  }
}

function kuromiMouth(g, x, y, face, p) {
  switch (face) {
    case 'surprised': PX.ell(g, x, y + 1, 2, 2.5, p.mouth); break;
    case 'annoyed': PX.rect(g, x - 3, y, 7, 1, p.mouth); break;
    case 'happy': case 'soft':
      PX.rect(g, x - 2, y, 5, 1, p.mouth);
      PX.rect(g, x - 3, y - 1, 1, 1, p.mouth); PX.rect(g, x + 3, y - 1, 1, 1, p.mouth); break;
    case 'blush':
      PX.rect(g, x - 2, y, 5, 1, p.mouth); PX.rect(g, x - 1, y + 1, 3, 1, p.mouth); break;
    default: // smirk + fang
      PX.rect(g, x - 3, y, 5, 1, p.mouth); PX.rect(g, x + 2, y - 1, 2, 1, p.mouth);
      PX.poly(g, [[x - 3, y + 1], [x - 1, y + 1], [x - 2, y + 3]], '#ffffff');
  }
}

/* ═══════════════ POMPOMPURIN ═══════════════ */

function drawPurin(g, x, y, o = {}) {
  const p = PAL.purin;
  const face = o.face || 'normal';
  const bob = Math.round(o.bob || 0);
  const step = o.walk ? Math.round(Math.sin(o.walk * Math.PI * 2) * 2) : 0;
  const lift = o.walk ? Math.abs(Math.round(Math.sin(o.walk * Math.PI * 2) * 1.5)) : 0;

  x = Math.round(x); y = Math.round(y);
  PX.shadow(g, x, y - 1, 14 - lift);
  const b = -bob - lift;

  /* legs */
  PX.ell(g, x - 5 + step, y - 3 + b, 4, 3.5, p.mid);
  PX.ell(g, x + 5 - step, y - 3 + b, 4, 3.5, p.mid);

  /* tail */
  PX.ell(g, x + 12, y - 15 + b, 3, 3, p.mid);

  /* body */
  PX.ell(g, x, y - 12 + b, 12, 9, p.base);
  PX.ell(g, x, y - 14 + b, 10, 6, p.lite);          // belly highlight
  PX.ell(g, x, y - 6 + b, 10, 3, p.mid);            // underside shade

  /* ears — long and floppy, drawn behind the head */
  const flop = Math.round((o.walk ? Math.sin(o.walk * Math.PI * 2 + 1) : Math.sin((o.t || 0) * 2)) * 1);
  PX.ell(g, x - 15, y - 27 + b + flop, 4.5, 8.5, p.mid);
  PX.ell(g, x + 15, y - 27 + b - flop, 4.5, 8.5, p.mid);
  PX.ell(g, x - 15, y - 29 + b + flop, 3, 5, p.base);
  PX.ell(g, x + 15, y - 29 + b - flop, 3, 5, p.base);

  /* head */
  PX.ell(g, x, y - 28 + b, 14, 12, p.base);
  PX.ell(g, x, y - 31 + b, 11, 7, p.lite);          // forehead highlight
  PX.ell(g, x, y - 22 + b, 11, 3, p.mid);           // chin shade

  /* beret */
  const by = y - 38 + b;
  PX.ell(g, x, by + 1, 13, 5, p.beret);
  PX.ell(g, x, by - 1, 11, 4, p.beretLite);
  PX.rect(g, x - 13, by + 3, 27, 2, p.beretDark);   // brim
  PX.ell(g, x + 4, by - 4, 2, 2, p.beretDark);      // little nub

  /* arms — drawn after the head so they actually show.
     When he's carrying the cake the right one reaches out to hold it. */
  if (o.armsUp) {
    PX.ell(g, x - 13, y - 17 + b, 4, 4, p.mid);
    PX.ell(g, x + 14, y - 15 + b, 4, 4, p.mid);
    PX.ell(g, x + 18, y - 13 + b, 3, 3, p.base);
  } else {
    PX.ell(g, x - 14, y - 11 + b, 4, 4, p.mid);
    PX.ell(g, x + 14, y - 11 + b, 4, 4, p.mid);
  }

  /* face */
  drawEyes(g, x, y - 28 + b, o.eyeFace || face, p, { gap: 6, w: 3, h: 4 });
  purinMouth(g, x, y - 22 + b, o.talking ? 'surprised' : face, p);

  const blushOn = face === 'blush' || face === 'sparkle' || o.blush;
  if (blushOn) {
    PX.ell(g, x - 10, y - 25 + b, 3, 2, p.blush);
    PX.ell(g, x + 10, y - 25 + b, 3, 2, p.blush);
  }
  if (face === 'panic') { // sweat drop
    PX.ell(g, x + 15, y - 36 + b, 2, 2.5, '#9ED8F0');
  }
}

/* ═══════════════ KUROMI ═══════════════ */

function drawKuromi(g, x, y, o = {}) {
  const p = PAL.kuromi;
  const face = o.face || 'smug';
  const bob = Math.round(o.bob || 0);
  x = Math.round(x); y = Math.round(y);
  PX.shadow(g, x, y - 1, 13);
  const b = -bob;

  /* legs */
  PX.ell(g, x - 5, y - 3 + b, 4, 3.5, p.mid);
  PX.ell(g, x + 5, y - 3 + b, 4, 3.5, p.mid);

  /* devil tail, behind */
  const tw = Math.round(Math.sin((o.t || 0) * 3) * 2);
  PX.ell(g, x + 12, y - 13 + b, 2, 2, p.hood);
  PX.ell(g, x + 15, y - 16 + b + tw, 2, 2, p.hood);
  PX.poly(g, [[x + 14, y - 18 + b + tw], [x + 19, y - 20 + b + tw], [x + 15, y - 13 + b + tw]], p.hood);

  /* body */
  PX.ell(g, x, y - 12 + b, 11, 9, p.base);
  PX.ell(g, x, y - 14 + b, 9, 6, p.lite);
  PX.ell(g, x, y - 6 + b, 9, 3, p.mid);
  /* little pink bow at the collar */
  PX.poly(g, [[x - 5, y - 19 + b], [x - 1, y - 17 + b], [x - 5, y - 15 + b]], p.skull);
  PX.poly(g, [[x + 5, y - 19 + b], [x + 1, y - 17 + b], [x + 5, y - 15 + b]], p.skull);
  PX.rect(g, x - 1, y - 18 + b, 2, 2, p.skullDark);

  /* arms */
  PX.ell(g, x - 11, y - 12 + b, 4, 4, p.mid);
  PX.ell(g, x + 11, y - 12 + b, 4, 4, p.mid);

  /* ── hood: black shell, then the white face carved back out ── */
  const hy = y - 31 + b;
  /* two pointed hood ears */
  PX.poly(g, [[x - 13, hy - 4], [x - 4, hy - 8], [x - 17, hy - 19]], p.hood);
  PX.poly(g, [[x + 13, hy - 4], [x + 4, hy - 8], [x + 17, hy - 19]], p.hood);
  PX.poly(g, [[x - 13, hy - 6], [x - 7, hy - 8], [x - 15, hy - 16]], p.hoodLite);
  PX.poly(g, [[x + 13, hy - 6], [x + 7, hy - 8], [x + 15, hy - 16]], p.hoodLite);

  PX.ell(g, x, hy, 14, 12, p.hood);                 // hood shell
  PX.ell(g, x, hy - 3, 11, 7, p.hoodLite);          // top sheen
  PX.ell(g, x, y - 26 + b, 11, 10, p.base);         // face opening
  PX.ell(g, x, y - 28 + b, 9, 6, p.lite);
  PX.ell(g, x, y - 20 + b, 8, 3, p.mid);

  /* pink skull badge on the brow */
  const sy = hy - 6;
  PX.ell(g, x, sy, 4, 3.5, p.skull);
  PX.rect(g, x - 3, sy + 3, 6, 2, p.skull);
  PX.rect(g, x - 2, sy, 1, 2, p.hoodDark);
  PX.rect(g, x + 2, sy, 1, 2, p.hoodDark);
  PX.rect(g, x - 1, sy + 4, 1, 1, p.hoodDark);
  PX.rect(g, x + 1, sy + 4, 1, 1, p.hoodDark);

  /* face */
  drawEyes(g, x, y - 26 + b, o.eyeFace || face, p, { gap: 5, w: 3, h: 4 });
  kuromiMouth(g, x, y - 20 + b, o.talking ? 'surprised' : face, p);

  const blushOn = face === 'blush' || face === 'soft' || o.blush;
  if (blushOn) {
    PX.ell(g, x - 8, y - 23 + b, 3, 2, p.blush);
    PX.ell(g, x + 8, y - 23 + b, 3, 2, p.blush);
  }
  if (face === 'annoyed') { // anger mark
    PX.rect(g, x + 10, y - 36 + b, 4, 1, '#FF6E8A');
    PX.rect(g, x + 11, y - 38 + b, 1, 4, '#FF6E8A');
  }
}

/* ═══════════════ THE CAKE ═══════════════
   o.lit 0..1 candle glow, o.blow 0..1 how hard the flames are bending,
   o.smoke true after they're out. */

function drawCake(g, x, y, o = {}) {
  const c = PAL.cake;
  x = Math.round(x); y = Math.round(y);
  const lit = o.lit || 0, blow = o.blow || 0, t = o.t || 0;

  /* plate */
  PX.ell(g, x, y, 15, 3, c.plateDark);
  PX.ell(g, x, y - 1, 14, 2.5, c.plate);

  /* sponge */
  PX.rect(g, x - 12, y - 9, 25, 8, c.sponge);
  PX.ell(g, x, y - 1, 12.5, 2.5, c.spongeDark);
  PX.rect(g, x - 12, y - 5, 25, 1, c.spongeDark);

  /* frosting cap with drips */
  PX.rect(g, x - 12, y - 13, 25, 5, c.frost);
  PX.ell(g, x, y - 13, 12.5, 2.5, c.frostLite);
  for (const dx of [-9, -4, 2, 8]) PX.rect(g, x + dx, y - 8, 2, 2, c.frostDark);

  /* piped cream dots + sprinkles */
  for (const dx of [-10, -5, 0, 5, 10]) PX.rect(g, x + dx, y - 15, 2, 2, c.cream);
  PX.rect(g, x - 7, y - 11, 1, 1, '#8FD8E8');
  PX.rect(g, x + 3, y - 11, 1, 1, '#FFE071');
  PX.rect(g, x + 9, y - 10, 1, 1, '#A8E6A0');
  PX.rect(g, x - 2, y - 10, 1, 1, '#C7A8F0');

  /* candles */
  const cand = [-8, -4, 0, 4, 8];
  cand.forEach((dx, i) => {
    PX.rect(g, x + dx, y - 21, 2, 7, i % 2 ? c.candle2 : c.candle);
    PX.rect(g, x + dx, y - 21, 1, 7, i % 2 ? c.candle : c.candle2);

    if (lit > 0 && !o.smoke) {
      const fl = Math.sin(t * 9 + i * 1.7) * 0.5 + 0.5;
      const bend = Math.round(blow * 5);
      const h = Math.max(1, Math.round((3 + fl) * (1 - blow * 0.55)));
      const fx = x + dx + 1 + bend;
      const fy = y - 22;
      g.globalAlpha = Math.min(1, lit);
      PX.poly(g, [[fx - 2, fy], [fx + 2, fy], [fx - bend, fy - h - 2]], c.flameEdge);
      PX.poly(g, [[fx - 1, fy], [fx + 1, fy], [fx - bend * 0.6, fy - h]], c.flame);
      PX.rect(g, fx, fy - 1, 1, 1, c.flameHot);
      g.globalAlpha = 1;
    } else if (o.smoke) {
      g.globalAlpha = Math.max(0, 0.5 - (o.smokeT || 0) * 0.5);
      const s = Math.sin(t * 3 + i) * 2;
      PX.rect(g, x + dx + 1 + s, y - 24 - (o.smokeT || 0) * 10, 1, 1, '#C9BCD6');
      PX.rect(g, x + dx + 1 - s, y - 27 - (o.smokeT || 0) * 12, 1, 1, '#C9BCD6');
      g.globalAlpha = 1;
    }
  });
}

/* a small heart, used everywhere */
function drawHeart(g, x, y, s, col) {
  x = Math.round(x); y = Math.round(y);
  if (s <= 1) { PX.rect(g, x, y, 1, 1, col); return; }
  if (s <= 2) { PX.rect(g, x - 1, y - 1, 3, 2, col); PX.rect(g, x, y + 1, 1, 1, col); return; }
  PX.rect(g, x - 2, y - 2, 2, 2, col); PX.rect(g, x + 1, y - 2, 2, 2, col);
  PX.rect(g, x - 3, y - 1, 7, 2, col);
  PX.rect(g, x - 2, y + 1, 5, 1, col);
  PX.rect(g, x - 1, y + 2, 3, 1, col);
  PX.rect(g, x, y + 3, 1, 1, col);
}

/* a 4-point sparkle */
function drawSparkle(g, x, y, s, col) {
  x = Math.round(x); y = Math.round(y); s = Math.round(s);
  if (s < 1) return;
  PX.rect(g, x - s, y, s * 2 + 1, 1, col);
  PX.rect(g, x, y - s, 1, s * 2 + 1, col);
  if (s > 1) { PX.rect(g, x - 1, y - 1, 1, 1, col); PX.rect(g, x + 1, y + 1, 1, 1, col); }
}
