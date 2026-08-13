/* ══════════════════════════════════════════════════════════════
   sprites.js — hand-authored pixel art.

   Characters are drawn as small pixel GRIDS (24×22, 26×26) and then
   blown up 2× with nearest-neighbour, so every pixel is a chunky 2×2
   block. That's what makes it read as pixel art instead of smooth
   shapes — authoring small and scaling up, never the other way round.

   Each grid is built once per expression and cached.
   ══════════════════════════════════════════════════════════════ */

const SCALE = 2;

const PX = {
  rect(g, x, y, w, h, c) {
    g.fillStyle = c;
    g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  },

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
  }
};

/* ═══════ grid → outlined bitmap ═══════ */

function _canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  return { c, g };
}

/* paints the grid, adds a 1px outline around the silhouette, returns a canvas */
function buildSprite(spec, face) {
  const W = spec.w + 2, H = spec.h + 2;      // 1px margin all round for the outline
  const art = _canvas(W, H);

  spec.rows.forEach((row, ry) => {
    for (let cx = 0; cx < row.length; cx++) {
      const col = spec.pal[row[cx]];
      if (col) { art.g.fillStyle = col; art.g.fillRect(cx + 1, ry + 1, 1, 1); }
    }
  });
  if (spec.face) spec.face(art.g, 1, 1, face, spec);

  const sil = _canvas(W, H);
  sil.g.drawImage(art.c, 0, 0);
  sil.g.globalCompositeOperation = 'source-in';
  sil.g.fillStyle = spec.line;
  sil.g.fillRect(0, 0, W, H);

  const out = _canvas(W, H);
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) out.g.drawImage(sil.c, dx, dy);
  out.g.drawImage(art.c, 0, 0);
  return out.c;
}

const _sprCache = new Map();
function spriteFor(spec, key, face) {
  const k = key + '|' + face;
  let hit = _sprCache.get(k);
  if (!hit) { hit = buildSprite(spec, face); _sprCache.set(k, hit); }
  return hit;
}

/* stamps a built sprite so its feet land on (x, y), centred horizontally */
function stamp(g, cv, spec, x, y, lift) {
  const dw = cv.width * SCALE, dh = cv.height * SCALE;
  const dx = Math.round(x) - Math.round(dw / 2);
  const dy = Math.round(y) - (spec.h + 1) * SCALE - Math.round(lift || 0);
  g.drawImage(cv, dx, dy, dw, dh);
}

/* ═══════════════ POMPOMPURIN (Syl) — 24 × 22 ═══════════════
   One round yellow blob, small brown beret with its stem, ears as
   shaded panels at the sides, tiny dot eyes and nose. */

const PURIN = {
  w: 24, h: 22,
  line: '#B5792F',
  ink: '#3A2A1E',
  pal: {
    '.': null,
    Y: '#FBDF8C',   // body
    M: '#F0C766',   // ears / feet
    o: '#D4A24A',   // the line that makes an ear read as an ear
    B: '#8A4F32',   // beret
    D: '#6B3A24',   // beret dark
    E: '#3A2A1E'    // nose
  },
  rows: [
    '...........DD...........',
    '......BBBBBBBBBBBB......',
    '.....BBBBBBBBBBBBBB.....',
    '.....BBBBBBBBBBBBBB.....',
    '....YDDDDDDDDDDDDDDY....',
    '...YYYYYYYYYYYYYYYYYY...',
    '..YYYYYYYYYYYYYYYYYYYY..',
    '..YYYYYYYYYYYYYYYYYYYY..',
    '..MMMoYYYYYYYYYYYYoMMM..',
    '.MMMMoYYYYYYYYYYYYoMMMM.',
    '.MMMMoYYYYYYYYYYYYoMMMM.',
    '.MMMMoYYYYYYYYYYYYoMMMM.',
    '.MMMMoYYYYYEEYYYYYoMMMM.',
    '.MMMMoYYYYYYYYYYYYoMMMM.',
    '.MMMMoYYYYYYYYYYYYoMMMM.',
    '..MMMoYYYYYYYYYYYYoMMM..',
    '..YYYYYYYYYYYYYYYYYYYY..',
    '..YYYYYYYYYYYYYYYYYYYY..',
    '...YYYYYYYYYYYYYYYYYY...',
    '....YYYYYYYYYYYYYYYY....',
    '....MMMMMYYYYYYMMMMM....',
    '....MMMMM......MMMMM....'
  ],
  /* eyes on rows 9–10 (cols 8–9 / 14–15), mouth on rows 14–15 */
  face(g, ox, oy, f, s) {
    g.fillStyle = s.ink;
    const p = (cx, cy, w, h) => g.fillRect(ox + cx, oy + cy, w || 1, h || 1);

    switch (f) {
      case 'happy': case 'blush': case 'proud': case 'soft':
        p(7, 10); p(8, 9, 2, 1); p(10, 10);
        p(13, 10); p(14, 9, 2, 1); p(16, 10); break;
      case 'blink': case 'closed': case 'sneaky':
        p(7, 10, 3, 1); p(14, 10, 3, 1); break;
      case 'surprised': case 'panic':
        p(8, 8, 2, 3); p(14, 8, 2, 3); break;
      case 'sparkle':
        p(8, 8, 2, 4); p(7, 9, 4, 2);
        p(14, 8, 2, 4); p(13, 9, 4, 2); break;
      case 'wink':
        p(7, 10); p(8, 9, 2, 1); p(10, 10); p(14, 9, 2, 2); break;
      default:
        p(8, 9, 2, 2); p(14, 9, 2, 2);
    }

    switch (f) {
      case 'surprised': case 'panic': p(11, 14, 2, 2); break;
      case 'proud': case 'sparkle': p(9, 14, 6, 1); p(10, 15, 4, 1); break;
      case 'sneaky': p(9, 14, 5, 1); break;
      default: p(9, 14); p(14, 14); p(10, 15, 4, 1);   // small "u" smile
    }
    if (f === 'blush' || f === 'sparkle') {
      g.fillStyle = '#FFA6BE';
      g.fillRect(ox + 5, oy + 12, 3, 2); g.fillRect(ox + 16, oy + 12, 3, 2);
    }
  }
};

function drawPurin(g, x, y, o = {}) {
  const face = o.eyeFace || o.face || 'normal';
  const lift = (o.bob || 0) + (o.walk ? Math.abs(Math.round(Math.sin(o.walk * Math.PI * 2) * 2)) : 0);
  PX.shadow(g, x, y - 1, 20);
  stamp(g, spriteFor(PURIN, 'purin', face), PURIN, x, y, lift);
}

/* ═══════════════ KUROMI (my wife) — 26 × 26 ═══════════════
   White head, grey hood with two big ears sweeping out to the sides,
   pink skull on the brow, big eyes, permanent blush. */

const KUROMI = {
  w: 26, h: 26,
  line: '#171320',
  ink: '#1F1A28',
  pal: {
    '.': null,
    H: '#5C5866',   // hood
    W: '#FFFFFF',   // body / face
    P: '#FFAFD2',   // skull
    K: '#241F2E',   // skull sockets
    B: '#FF9EC8'    // blush
  },
  rows: [
    '..HHH................HHH..',
    '.HHHHH..............HHHHH.',
    'HHHHHHH............HHHHHHH',
    'HHHHHHH...HHHHHH...HHHHHHH',
    'HHHHHHH.HHHHHHHHHH.HHHHHHH',
    'HHHHHHHHHHHHHHHHHHHHHHHHHH',
    'HHHHHHHHHHPPPPPPHHHHHHHHHH',
    'HHHHHHHHHHPKPPKPHHHHHHHHHH',
    'HHHHHHHHHHPPKKPPHHHHHHHHHH',
    'HHHHHHHHHHHPPPPHHHHHHHHHHH',
    'HHHHHHHWWWWHHHHWWWWHHHHHHH',
    'HHHHHHHWWWWWHHWWWWWHHHHHHH',
    'HHHHHHHWWWWWWWWWWWWHHHHHHH',
    'HHHHHHHWWWWWWWWWWWWHHHHHHH',
    'HHHHHHHWWWWWWWWWWWWHHHHHHH',
    '..HHHHHWWWWWWWWWWWWHHHHH..',
    '.....HHBBWWWWWWWWBBHH.....',
    '.....HHWWWWWWWWWWWWHH.....',
    '......WWWWWWWWWWWWWW......',
    '.......WWWWWWWWWWWW.......',
    '......WWWWWWWWWWWWWW......',
    '......WWWWWWWWWWWWWWHH....',
    '.......WWWWWWWWWWWW.......',
    '........WWWWWWWWWW........',
    '........WWWW..WWWW........',
    '........WWWW..WWWW........'
  ],
  /* eyes on rows 12–15 (cols 8–10 / 15–17), mouth on row 17 */
  face(g, ox, oy, f, s) {
    g.fillStyle = s.ink;
    const p = (cx, cy, w, h) => g.fillRect(ox + cx, oy + cy, w || 1, h || 1);
    const glint = (cx, cy) => { g.fillStyle = '#FFFFFF'; g.fillRect(ox + cx, oy + cy, 1, 1); g.fillStyle = s.ink; };

    switch (f) {
      case 'happy': case 'soft': case 'blush':
        p(8, 14); p(9, 13, 2, 1); p(11, 14);
        p(14, 14); p(15, 13, 2, 1); p(17, 14); break;
      case 'blink': case 'closed':
        p(8, 14, 3, 1); p(15, 14, 3, 1); break;
      case 'surprised':
        p(8, 11, 3, 5); p(15, 11, 3, 5); glint(9, 12); glint(16, 12); break;
      case 'annoyed':
        p(8, 14, 3, 1); p(15, 14, 3, 1);
        p(8, 12, 3, 1); p(15, 12, 3, 1); break;
      case 'smug':
        p(8, 13, 3, 3); p(15, 13, 3, 3);
        p(8, 11, 3, 1); p(15, 11, 3, 1); glint(9, 13); glint(16, 13); break;
      case 'sparkle':
        p(9, 11, 1, 6); p(8, 13, 3, 2);
        p(16, 11, 1, 6); p(15, 13, 3, 2); break;
      case 'wink':
        p(8, 14); p(9, 13, 2, 1); p(11, 14); p(15, 12, 3, 4); glint(16, 13); break;
      default:
        p(8, 12, 3, 4); p(15, 12, 3, 4); glint(9, 13); glint(16, 13);
    }

    switch (f) {
      case 'surprised': p(12, 17, 2, 2); break;
      case 'annoyed': p(10, 17, 6, 1); break;
      case 'happy': case 'soft': p(11, 17, 4, 1); p(10, 16); p(15, 16); break;
      default: p(11, 17, 3, 1); p(14, 16);             // little smirk
    }
  }
};

function drawKuromi(g, x, y, o = {}) {
  const face = o.eyeFace || o.face || 'smug';
  PX.shadow(g, x, y - 1, 18);
  stamp(g, spriteFor(KUROMI, 'kuromi', face), KUROMI, x, y, o.bob || 0);
}

/* ═══════════════ THE CAKE — 17 × 14 ═══════════════ */

const CAKE = {
  w: 17, h: 14,
  line: '#A8708F',
  pal: {
    '.': null,
    C: '#FF9EC4', c: '#FFFFFF',              // candles
    L: '#FFE0EE', F: '#FFC2DC', f: '#F09CC0', // frosting
    S: '#F6D9A6', s: '#E0BC82',               // sponge
    P: '#EFE6F2', p: '#CDBFD6'                // plate
  },
  rows: [
    '..C..c..C..c..C..',
    '..C..c..C..c..C..',
    '..C..c..C..c..C..',
    'LLLLLLLLLLLLLLLLL',
    'FFFFFFFFFFFFFFFFF',
    'FFfFFFfFFFfFFFfFF',
    'SSSSSSSSSSSSSSSSS',
    'SsSSSSsSSSSsSSSsS',
    'SSSSSSSSSSSSSSSSS',
    'SSSSSSSSSSSSSSSSS',
    'sssssssssssssssss',
    'PPPPPPPPPPPPPPPPP',
    '.ppppppppppppppp.',
    '..ppppppppppppp..'
  ]
};
const CAKE_CANDLES = [2, 5, 8, 11, 14];

function drawCake(g, x, y, o = {}) {
  const cv = spriteFor(CAKE, 'cake', 'base');
  stamp(g, cv, CAKE, x, y, 0);

  const lit = o.lit || 0, blow = o.blow || 0, t = o.t || 0;
  if (lit <= 0 && !o.smoke) return;

  /* flames sit above the candle tops, drawn in 2px blocks to match */
  const left = Math.round(x) - Math.round((cv.width * SCALE) / 2) + SCALE;
  const top = Math.round(y) - (CAKE.h + 1) * SCALE + SCALE;

  CAKE_CANDLES.forEach((cc, i) => {
    const fx = left + cc * SCALE;
    if (o.smoke) {
      g.globalAlpha = Math.max(0, 0.55 - (o.smokeT || 0) * 0.55);
      const s = Math.round(Math.sin(t * 3 + i) * 2) * SCALE;
      PX.rect(g, fx + s, top - 6 - (o.smokeT || 0) * 18, SCALE, SCALE, '#C9BCD6');
      PX.rect(g, fx - s, top - 12 - (o.smokeT || 0) * 22, SCALE, SCALE, '#C9BCD6');
      g.globalAlpha = 1;
      return;
    }
    const flick = Math.sin(t * 9 + i * 1.7) > 0 ? 1 : 0;
    const bend = Math.round(blow * 3) * SCALE;
    const h = blow > 0.7 ? 1 : 2;
    g.globalAlpha = Math.min(1, lit);
    PX.rect(g, fx + bend, top - h * SCALE, SCALE, h * SCALE, '#FF8C36');
    PX.rect(g, fx + bend, top - (h + flick) * SCALE, SCALE, SCALE, '#FFD34E');
    if (!flick) PX.rect(g, fx + bend, top - h * SCALE, SCALE, SCALE, '#FFF3B0');
    g.globalAlpha = 1;
  });
}

/* ═══════════════ little bits ═══════════════ */

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

function drawSparkle(g, x, y, s, col) {
  x = Math.round(x); y = Math.round(y); s = Math.round(s);
  if (s < 1) return;
  PX.rect(g, x - s, y, s * 2 + 1, 1, col);
  PX.rect(g, x, y - s, 1, s * 2 + 1, col);
  if (s > 1) { PX.rect(g, x - 1, y - 1, 1, 1, col); PX.rect(g, x + 1, y + 1, 1, 1, col); }
}

/* the framed photo on the wall borrows these */
const PAL = {
  purin: { base: PURIN.pal.Y, lite: PURIN.pal.L, beret: PURIN.pal.B },
  kuromi: { base: KUROMI.pal.W, hood: KUROMI.pal.H }
};
