/* ══════════════════════════════════════════════════════════════
   sprites.js — original pixel art, drawn procedurally.
   Everything lands on whole pixels so it reads as real pixel art.
   Character origin is the point between their feet on the floor.

   Both characters are drawn into an offscreen buffer first, then
   stamped four times in silhouette to give them a clean 1px outline
   the way hand-made perler/pixel sprites have.
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

  /* filled rounded rectangle — the blobby body shape both characters use */
  rrect(g, x, y, w, h, r, c) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    r = Math.min(r, w / 2, h / 2);
    g.fillStyle = c;
    for (let yy = 0; yy < h; yy++) {
      let inset = 0;
      if (yy < r) { const d = r - yy - 0.5; inset = Math.round(r - Math.sqrt(Math.max(0, r * r - d * d))); }
      else if (yy >= h - r) { const d = yy - (h - r) + 0.5; inset = Math.round(r - Math.sqrt(Math.max(0, r * r - d * d))); }
      const ww = w - inset * 2;
      if (ww > 0) g.fillRect(x + inset, y + yy, ww, 1);
    }
  },

  /* scanline polygon fill — hood ears, fangs, flames */
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

  shadow(g, x, y, w) {
    g.globalAlpha = 0.16;
    PX.ell(g, x, y, w, Math.max(2, w * 0.3), '#3a2038');
    g.globalAlpha = 1;
  },

  /* ── inked variants: stamp the shape 4× in the line colour, then fill.
     These give the *internal* outlines — ear against head, head against
     body — that the silhouette-only outline can't produce. Draw order is
     what separates things: a later inked shape cuts into an earlier one. ── */
  rrectInk(g, x, y, w, h, r, fill, ink) {
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) PX.rrect(g, x + dx, y + dy, w, h, r, ink);
    PX.rrect(g, x, y, w, h, r, fill);
  },
  ellInk(g, cx, cy, rx, ry, fill, ink) {
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) PX.ell(g, cx + dx, cy + dy, rx, ry, ink);
    PX.ell(g, cx, cy, rx, ry, fill);
  },
  polyInk(g, pts, fill, ink) {
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) PX.poly(g, pts.map(p => [p[0] + dx, p[1] + dy]), ink);
    PX.poly(g, pts, fill);
  }
};

/* ─────────── the outline rig ─────────── */

const SPR = { W: 84, H: 84, OX: 42, OY: 74 };

function _mk() {
  const c = document.createElement('canvas');
  c.width = SPR.W; c.height = SPR.H;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  return { c, x };
}
const _art = _mk(), _sil = _mk();

/* draw `fn` into the buffer, then stamp it outlined onto g at (px,py) */
function outlined(g, px, py, fn, col) {
  _art.x.clearRect(0, 0, SPR.W, SPR.H);
  fn(_art.x, SPR.OX, SPR.OY);

  _sil.x.clearRect(0, 0, SPR.W, SPR.H);
  _sil.x.globalCompositeOperation = 'source-over';
  _sil.x.drawImage(_art.c, 0, 0);
  _sil.x.globalCompositeOperation = 'source-in';
  _sil.x.fillStyle = col;
  _sil.x.fillRect(0, 0, SPR.W, SPR.H);
  _sil.x.globalCompositeOperation = 'source-over';

  px = Math.round(px); py = Math.round(py);
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) g.drawImage(_sil.c, px + dx, py + dy);
  g.drawImage(_art.c, px, py);
}

/* ─────────────── palettes ─────────────── */

const PAL = {
  purin: {
    lite: '#FFF4C8', base: '#FBE08C', mid: '#F4CE6A', dark: '#E0B44C',
    beret: '#8A4634', beretDark: '#6B3427', beretLite: '#A45C46',
    ink: '#2A2018', nose: '#6B4430', mouth: '#6B4430', blush: '#FFA6BE',
    line: '#B5792F'          // soft golden-brown, like the reference
  },
  kuromi: {
    lite: '#FFFFFF', base: '#F8F5FB', mid: '#E3DAEC', dark: '#CBBEDC',
    hood: '#585463', hoodDark: '#3A3644', hoodLite: '#6E6A7C',
    skull: '#FFAFD2', skullDark: '#1D1926',
    ink: '#1B1622', mouth: '#2E2738', blush: '#FF9EC8',
    line: '#171320'
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

/* ═══════════════ POMPOMPURIN (Syl) ═══════════════
   One rounded blob for head+body, brown beret on top, long floppy
   ears hanging at the sides, dot eyes, little nose, wide smile. */

/* His eyes are small dots set close together — in the reference they're
   about 3px across and 10px apart on a 32px-wide face. */
function purinEyes(g, x, y, face, p) {
  const L = x - 5, R = x + 5;
  const dot = (cx, w, h) => PX.rect(g, cx - (w >> 1), y - (h >> 1), w, h, p.ink);
  const arc = (cx) => {
    for (let i = -2; i <= 2; i++) PX.rect(g, cx + i, y + Math.abs(i) - 1, 1, 1, p.ink);
  };
  const flat = (cx) => PX.rect(g, cx - 2, y, 4, 1, p.ink);

  switch (face) {
    case 'happy': case 'proud': case 'blush': case 'soft': arc(L); arc(R); break;
    case 'closed': case 'blink': case 'sneaky': flat(L); flat(R); break;
    case 'surprised': case 'panic': dot(L, 4, 5); dot(R, 4, 5); break;
    case 'wink': arc(L); dot(R, 3, 4); break;
    case 'sparkle':
      for (const cx of [L, R]) {
        PX.rect(g, cx - 1, y - 3, 2, 7, p.ink); PX.rect(g, cx - 3, y - 1, 7, 2, p.ink);
        PX.rect(g, cx - 1, y - 1, 1, 1, '#FFFFFF');
      } break;
    default: dot(L, 3, 4); dot(R, 3, 4);
  }
}

function purinArt(g, x, y, o) {
  const p = PAL.purin;
  const face = o.face || 'normal';
  const eyeFace = o.eyeFace || face;
  const b = -(o.bob || 0) - (o.lift || 0);
  const step = o.walk ? Math.round(Math.sin(o.walk * Math.PI * 2) * 2) : 0;

  const K = p.line;

  /* feet — small bumps peeking out at the bottom of the blob */
  PX.ellInk(g, x - 8 + step, y - 2 + b, 5, 3, p.mid, K);
  PX.ellInk(g, x + 8 - step, y - 2 + b, 5, 3, p.mid, K);

  /* ears: soft ovals that only just bulge past the body. In the reference
     the whole character is ONE rounded silhouette, not a body with handles. */
  const flop = Math.round((o.walk ? Math.sin(o.walk * Math.PI * 2 + 1) : Math.sin((o.t || 0) * 2)) * 1);
  PX.ellInk(g, x - 15, y - 17 + b + flop, 4.5, 9.5, p.mid, K);
  PX.ellInk(g, x + 15, y - 17 + b - flop, 4.5, 9.5, p.mid, K);

  /* the right arm reaches out for the cake */
  if (o.armsUp) PX.ellInk(g, x + 17, y - 14 + b, 4, 4, p.mid, K);

  /* the one big rounded body — 34×32, wider than it is tall */
  PX.rrectInk(g, x - 17, y - 34 + b, 34, 32, 14, p.base, K);
  PX.ell(g, x, y - 29 + b, 10, 5, p.lite);           // forehead sheen

  /* beret: a flat little cap, ~40% of the body width, with a small stem */
  const by = y - 37 + b;
  PX.rrectInk(g, x - 1, by - 3, 3, 4, 1, p.beret, K);   // stem
  PX.rrectInk(g, x - 7, by, 15, 8, 4, p.beret, K);
  PX.rect(g, x - 5, by + 1, 9, 2, p.beretLite);
  PX.rrect(g, x - 7, by + 5, 15, 3, 1, p.beretDark);

  /* face — everything small and clustered in the middle */
  purinEyes(g, x, y - 21 + b, eyeFace, p);
  PX.rect(g, x - 1, y - 17 + b, 3, 2, p.nose);        // tiny nose

  /* mouth */
  const my = y - 14 + b;
  if (face === 'surprised' || face === 'panic') {
    PX.ell(g, x, my, 2, 2.5, p.mouth);
  } else if (face === 'proud' || face === 'sparkle') {
    PX.poly(g, [[x - 3, my - 1], [x + 3, my - 1], [x, my + 3]], p.mouth);
  } else if (face === 'sneaky') {
    PX.rect(g, x - 3, my, 5, 1, p.mouth);
  } else {                                            // small "w" smile
    PX.rect(g, x - 3, my, 3, 1, p.mouth); PX.rect(g, x + 1, my, 3, 1, p.mouth);
    PX.rect(g, x - 4, my - 1, 1, 1, p.mouth); PX.rect(g, x + 4, my - 1, 1, 1, p.mouth);
    PX.rect(g, x, my + 1, 1, 1, p.mouth);
  }

  if (face === 'blush' || face === 'sparkle' || o.blush) {
    PX.ell(g, x - 11, y - 18 + b, 3, 2, p.blush);
    PX.ell(g, x + 11, y - 18 + b, 3, 2, p.blush);
  }
  if (face === 'panic') PX.ell(g, x + 16, y - 33 + b, 2, 2.5, '#9ED8F0');
}

function drawPurin(g, x, y, o = {}) {
  x = Math.round(x); y = Math.round(y);
  const lift = o.walk ? Math.abs(Math.round(Math.sin(o.walk * Math.PI * 2) * 1.5)) : 0;
  PX.shadow(g, x, y - 1, 16 - lift);
  outlined(g, x - SPR.OX, y - SPR.OY, (gg, ox, oy) => purinArt(gg, ox, oy, Object.assign({ lift }, o)), PAL.purin.line);
}

/* ═══════════════ KUROMI (my wife) ═══════════════
   White rounded head, grey jester hood with two big ears drooping
   out to the sides, pink skull on the brow, big eyes, blush. */

function kuromiEyes(g, x, y, face, p) {
  const L = x - 8, R = x + 8;
  const eye = (cx, rx, ry) => {
    PX.ell(g, cx, y, rx, ry, p.ink);
    PX.rect(g, cx - rx + 1, y - ry + 2, 2, 2, '#FFFFFF');
  };
  const arc = (cx) => {
    for (let i = -4; i <= 4; i++) PX.rect(g, cx + i, y + Math.abs(i) * 0.5 - 1.5, 1, 1, p.ink);
  };
  const flat = (cx) => PX.rect(g, cx - 4, y, 9, 2, p.ink);

  switch (face) {
    case 'happy': case 'soft': case 'blush': arc(L); arc(R); break;
    case 'closed': case 'blink': flat(L); flat(R); break;
    case 'surprised': eye(L, 4.5, 5.5); eye(R, 4.5, 5.5); break;
    case 'annoyed':
      flat(L); flat(R);
      PX.rect(g, L - 4, y - 4, 9, 1, p.ink); PX.rect(g, R - 4, y - 4, 9, 1, p.ink); break;
    case 'smug':
      eye(L, 3.5, 3.5); eye(R, 3.5, 3.5);
      PX.rect(g, L - 4, y - 6, 9, 1, p.ink); PX.rect(g, R - 4, y - 7, 9, 1, p.ink); break;
    case 'wink': arc(L); eye(R, 3.5, 4.5); break;
    case 'sparkle':
      for (const cx of [L, R]) {
        PX.rect(g, cx - 1, y - 5, 3, 11, p.ink); PX.rect(g, cx - 5, y - 1, 11, 3, p.ink);
        PX.rect(g, cx - 1, y - 1, 2, 2, '#FFFFFF');
      } break;
    default: eye(L, 3.5, 4.5); eye(R, 3.5, 4.5);
  }
}

function kuromiArt(g, x, y, o) {
  const p = PAL.kuromi;
  const face = o.face || 'smug';
  const eyeFace = o.eyeFace || face;
  const b = -(o.bob || 0);

  const K = p.line;

  /* feet */
  PX.ellInk(g, x - 7, y - 3 + b, 5.5, 3.5, p.base, K);
  PX.ellInk(g, x + 7, y - 3 + b, 5.5, 3.5, p.base, K);

  /* little devil tail */
  const tw = Math.round(Math.sin((o.t || 0) * 3) * 2);
  PX.ellInk(g, x + 15, y - 14 + b, 2.5, 2.5, p.hood, K);
  PX.ellInk(g, x + 18, y - 17 + b + tw, 2.5, 2.5, p.hood, K);
  PX.polyInk(g, [[x + 16, y - 19 + b + tw], [x + 22, y - 22 + b + tw], [x + 18, y - 14 + b + tw]], p.hood, K);

  /* arms, then body — the body's ink ring makes them read as separate bumps */
  PX.ellInk(g, x - 13, y - 15 + b, 4, 4, p.base, K);
  PX.ellInk(g, x + 13, y - 15 + b, 4, 4, p.base, K);
  PX.rrectInk(g, x - 11, y - 24 + b, 22, 22, 8, p.base, K);
  PX.rrect(g, x - 8, y - 23 + b, 16, 6, 3, p.lite);

  /* The two hood ears. They attach under the dome and sweep UP and OUT so
     they clear the head on both sides — drawn first, so the head's ink ring
     cuts a clean line and the dome stays visible between them. */
  const earL = [[x - 8, y - 46 + b], [x - 14, y - 56 + b], [x - 23, y - 54 + b],
                [x - 28, y - 41 + b], [x - 23, y - 30 + b], [x - 13, y - 34 + b]];
  const earR = earL.map(pt => [2 * x - pt[0], pt[1]]);
  PX.polyInk(g, earL, p.hood, K);
  PX.polyInk(g, earR, p.hood, K);
  PX.poly(g, [[x - 15, y - 51 + b], [x - 22, y - 49 + b], [x - 25, y - 41 + b], [x - 18, y - 40 + b]], p.hoodLite);
  PX.poly(g, [[x + 15, y - 51 + b], [x + 22, y - 49 + b], [x + 25, y - 41 + b], [x + 18, y - 40 + b]], p.hoodLite);

  /* head: hood dome, then the white face carved back out of it */
  PX.rrectInk(g, x - 16, y - 52 + b, 32, 34, 13, p.hood, K);
  PX.rrect(g, x - 10, y - 51 + b, 20, 5, 2, p.hoodLite);      // top sheen
  PX.rrectInk(g, x - 14, y - 40 + b, 28, 22, 10, p.base, K);  // face
  PX.rrect(g, x - 10, y - 38 + b, 20, 5, 3, p.lite);
  PX.poly(g, [[x - 5, y - 41 + b], [x + 5, y - 41 + b], [x, y - 34 + b]], p.hood);  // brow point

  /* pink skull badge, centred in the hood band */
  const sy = y - 47 + b;
  PX.ell(g, x, sy, 5, 4.5, p.skull);
  PX.rrect(g, x - 4, sy + 3, 8, 4, 1, p.skull);
  PX.rect(g, x - 3, sy - 1, 3, 3, p.skullDark);
  PX.rect(g, x + 1, sy - 1, 3, 3, p.skullDark);
  PX.rect(g, x - 1, sy + 3, 2, 2, p.skullDark);
  PX.rect(g, x - 2, sy + 5, 1, 2, p.skullDark);
  PX.rect(g, x + 2, sy + 5, 1, 2, p.skullDark);

  /* face */
  kuromiEyes(g, x, y - 31 + b, eyeFace, p);

  const my = y - 23 + b;
  if (face === 'surprised') PX.ell(g, x, my + 1, 2.5, 3, p.mouth);
  else if (face === 'annoyed') PX.rect(g, x - 4, my, 9, 1, p.mouth);
  else if (face === 'happy' || face === 'soft') {
    PX.rect(g, x - 3, my, 7, 1, p.mouth);
    PX.rect(g, x - 4, my - 1, 1, 1, p.mouth); PX.rect(g, x + 4, my - 1, 1, 1, p.mouth);
  } else if (face === 'blush') {
    PX.rect(g, x - 2, my, 5, 1, p.mouth); PX.rect(g, x - 1, my + 1, 3, 1, p.mouth);
  } else {                                                     // smirk + fang
    PX.rect(g, x - 4, my, 6, 1, p.mouth); PX.rect(g, x + 2, my - 1, 2, 1, p.mouth);
    PX.poly(g, [[x - 4, my + 1], [x - 2, my + 1], [x - 3, my + 3]], '#FFFFFF');
  }

  /* blush — she basically always has it, like the reference */
  PX.ell(g, x - 11, y - 26 + b, 3.5, 2.5, p.blush);
  PX.ell(g, x + 11, y - 26 + b, 3.5, 2.5, p.blush);

  if (face === 'annoyed') {
    PX.rect(g, x + 18, y - 46 + b, 5, 1, '#FF6E8A');
    PX.rect(g, x + 20, y - 48 + b, 1, 5, '#FF6E8A');
  }
}

function drawKuromi(g, x, y, o = {}) {
  x = Math.round(x); y = Math.round(y);
  PX.shadow(g, x, y - 1, 15);
  outlined(g, x - SPR.OX, y - SPR.OY, (gg, ox, oy) => kuromiArt(gg, ox, oy, o), PAL.kuromi.line);
}

/* ═══════════════ THE CAKE ═══════════════
   o.lit 0..1 candle glow, o.blow 0..1 how hard the flames bend,
   o.smoke true once they're out. */

function drawCake(g, x, y, o = {}) {
  const c = PAL.cake;
  x = Math.round(x); y = Math.round(y);
  const lit = o.lit || 0, blow = o.blow || 0, t = o.t || 0;

  PX.ell(g, x, y, 15, 3, c.plateDark);
  PX.ell(g, x, y - 1, 14, 2.5, c.plate);

  PX.rect(g, x - 12, y - 9, 25, 8, c.sponge);
  PX.ell(g, x, y - 1, 12.5, 2.5, c.spongeDark);
  PX.rect(g, x - 12, y - 5, 25, 1, c.spongeDark);

  PX.rect(g, x - 12, y - 13, 25, 5, c.frost);
  PX.ell(g, x, y - 13, 12.5, 2.5, c.frostLite);
  for (const dx of [-9, -4, 2, 8]) PX.rect(g, x + dx, y - 8, 2, 2, c.frostDark);

  for (const dx of [-10, -5, 0, 5, 10]) PX.rect(g, x + dx, y - 15, 2, 2, c.cream);
  PX.rect(g, x - 7, y - 11, 1, 1, '#8FD8E8');
  PX.rect(g, x + 3, y - 11, 1, 1, '#FFE071');
  PX.rect(g, x + 9, y - 10, 1, 1, '#A8E6A0');
  PX.rect(g, x - 2, y - 10, 1, 1, '#C7A8F0');

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
