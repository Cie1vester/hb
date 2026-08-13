/* ══════════════════════════════════════════════════════════════
   scene.js — the cosy little house the whole thing happens in.
   Canvas is 320×180. Wall 0–118, floor 118–180.
   ══════════════════════════════════════════════════════════════ */

const ROOM = {
  wall: '#F2C4D4', wallDk: '#E7B0C4', wallLt: '#F9D8E2',
  rail: '#FFF1E0', railDk: '#D9A98C', wainscot: '#FCE6D5', wainDk: '#E8C6AE',
  floor: '#C9905E', floorDk: '#B67C4E', floorLt: '#D9A473', seam: '#A96D42',
  door: '#B87A55', doorDk: '#955C3C', doorLt: '#CE9068',
  sky: '#2A2452', moon: '#FFF6CE', star: '#FFFFFF',
  sofa: '#B9A6E8', sofaDk: '#9C86D4', sofaLt: '#D2C3F5',
  wood: '#A9744C', leaf: '#7CC47F', leafDk: '#5FA765', pot: '#E88C8C',
  lamp: '#FFE6A8', lampDk: '#F0C86A'
};

/* ── 3×5 micro font, for the bunting and the banner ── */
const MF = {
  A: '.#.#.####.##.#', B: '##.#.###.#.###.', C: '.###..#..#...##', D: '##.#.##.##.###.',
  E: '####..##.#..###', F: '####..##.#..#..', G: '.###..#.##.#.##', H: '#.##.####.##.#',
  I: '###.#..#..#.###', J: '..#..#..##.#.#.', K: '#.##.###.#.##.#', L: '#..#..#..#..###',
  M: '#.########.##.#', N: '#.###########.#', O: '.#.#.##.##.#.#.', P: '##.#.###.#..#..',
  Q: '.#.#.##.###..##', R: '##.#.###.#.##.#', S: '.###...#...###.', T: '###.#..#..#..#.',
  U: '#.##.##.##.####', V: '#.##.##.##.#.#.', W: '#.##.########.#', X: '#.##.#.#.#.##.#',
  Y: '#.##.#.#..#..#.', Z: '###..#..#..#.###',
  '!': '.#..#..#......#', '?': '##...#.#.....#.', "'": '.#..#..........',
  ' ': '...............', '.': '..............#'
};
/* fix the few glyphs that need a straight 15-char grid */
MF.A = '.#.' + '#.#' + '###' + '#.#' + '#.#';
MF.H = '#.#' + '#.#' + '###' + '#.#' + '#.#';
MF.Z = '###' + '..#' + '.#.' + '#..' + '###';
MF['!'] = '.#.' + '.#.' + '.#.' + '...' + '.#.';
MF['?'] = '##.' + '..#' + '.#.' + '...' + '.#.';

function mfText(g, x, y, str, col, scale = 1) {
  str = String(str).toUpperCase();
  let cx = Math.round(x);
  for (const ch of str) {
    const gl = MF[ch];
    if (gl) {
      for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) {
        if (gl[r * 3 + c] === '#') PX.rect(g, cx + c * scale, y + r * scale, scale, scale, col);
      }
    }
    cx += 4 * scale;
  }
  return cx - x;
}
function mfWidth(str, scale = 1) { return String(str).length * 4 * scale - scale; }

/* ── 5×7 font, used for the big name on the banner.
      3px-wide letters can't tell M from H, and the name matters. ── */
const BIGF = {
  A: '.###.#...##...########...##...##...#',
  B: '####.#...##...#####.#...##...#####.',
  C: '.#####....#....#....#....#.....####',
  D: '####.#...##...##...##...##...#####.',
  E: '######....#....####.#....#....#####',
  F: '######....#....####.#....#....#....',
  G: '.###.#...##....#..###...##...#.###.',
  H: '#...##...##...########...##...##...#',
  I: '#####..#....#....#....#....#..#####',
  J: '..###...#....#....#....#.#..#..##..',
  K: '#...##..#.#.#..##...#.#..#..#.#...#',
  L: '#....#....#....#....#....#....#####',
  M: '#...###.###.#.##.#.##...##...##...#',
  N: '#...###..##.#.##..###...##...##...#',
  O: '.###.#...##...##...##...##...#.###.',
  P: '####.#...##...#####.#....#....#....',
  Q: '.###.#...##...##...##.#.##..#..##.#',
  R: '####.#...##...#####.#.#..#..#.#...#',
  S: '.#####....#....###.....#....######.',
  T: '#####..#....#....#....#....#....#..',
  U: '#...##...##...##...##...##...#.###.',
  V: '#...##...##...##...##...#.#.#...#..',
  W: '#...##...##...##.#.##.#.###.###...#',
  X: '#...##...#.#.#...#...#.#.##...##...#',
  Y: '#...##...#.#.#...#....#....#....#..',
  Z: '#########...#...#...#...#....#####',
  ' ': '...................................',
  '!': '..#....#....#....#....#.........#..',
  '-': '...............#####...............'
};
/* a couple of glyphs need their rows spelled out exactly (5 cols × 7 rows) */
BIGF.H = '#...#' + '#...#' + '#...#' + '#####' + '#...#' + '#...#' + '#...#';
BIGF.A = '.###.' + '#...#' + '#...#' + '#####' + '#...#' + '#...#' + '#...#';
BIGF.X = '#...#' + '#...#' + '.#.#.' + '..#..' + '.#.#.' + '#...#' + '#...#';
BIGF.Z = '#####' + '....#' + '...#.' + '..#..' + '.#...' + '#....' + '#####';

function bigText(g, x, y, str, col, scale = 1) {
  str = String(str).toUpperCase();
  let cx = Math.round(x);
  for (const ch of str) {
    const gl = BIGF[ch];
    if (gl) {
      for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) {
        if (gl[r * 5 + c] === '#') PX.rect(g, cx + c * scale, y + r * scale, scale, scale, col);
      }
    }
    cx += 6 * scale;
  }
}
function bigWidth(str, scale = 1) { return String(str).length * 6 * scale - scale; }

/* ═══════════════ the room ═══════════════ */

function drawRoom(g, st) {
  const t = st.t;

  /* ── wall ── */
  PX.rect(g, 0, 0, 320, 118, ROOM.wall);
  for (let x = 0; x < 320; x += 16) PX.rect(g, x, 0, 6, 118, ROOM.wallLt);      // stripes
  for (let x = 4; x < 320; x += 32) for (let y = 8; y < 92; y += 24) {           // polka hearts
    drawHeart(g, x + 8, y, 2, ROOM.wallDk);
  }

  /* ── wainscoting ── */
  PX.rect(g, 0, 92, 320, 26, ROOM.wainscot);
  PX.rect(g, 0, 89, 320, 4, ROOM.rail);
  PX.rect(g, 0, 93, 320, 1, ROOM.railDk);
  for (let x = 6; x < 320; x += 26) PX.rect(g, x, 98, 1, 16, ROOM.wainDk);
  PX.rect(g, 0, 114, 320, 4, ROOM.railDk);

  /* ── floor: planks, rows get taller toward the viewer ── */
  let fy = 118;
  const rows = [5, 7, 9, 12, 15, 18];
  rows.forEach((h, i) => {
    const shade = i % 2 ? ROOM.floor : ROOM.floorLt;
    PX.rect(g, 0, fy, 320, h, shade);
    PX.rect(g, 0, fy, 320, 1, ROOM.seam);
    for (let x = (i * 23) % 46; x < 320; x += 46) PX.rect(g, x, fy, 1, h, ROOM.floorDk);
    fy += h;
  });
  PX.rect(g, 0, fy, 320, 180 - fy, ROOM.floor);

  /* ── round rug ── */
  PX.ell(g, 158, 152, 104, 25, '#F5A6C4');
  PX.ell(g, 158, 152, 94, 21, '#FFC9DE');
  PX.ell(g, 158, 152, 74, 16, '#FFE2EE');
  PX.ell(g, 158, 152, 42, 9, '#FFC9DE');
  for (let a = 0; a < 22; a++) {                    // scalloped edge
    const th = (a / 22) * Math.PI * 2;
    PX.ell(g, 158 + Math.cos(th) * 104, 152 + Math.sin(th) * 25, 3, 2, '#F08CB2');
  }

  drawDoor(g, st);
  drawPlant(g, 76, 118);
  drawSofa(g, 132, 122);
  drawWindow(g, st);
  drawTable(g, 288, 124, st);
  drawClock(g, 108, 30, t);
  drawPhoto(g, st);
  drawBunting(g, st);
}

function drawDoor(g, st) {
  const x = 12, y = 30, w = 48, h = 88;
  PX.rect(g, x - 3, y - 3, w + 6, h + 3, ROOM.doorDk);     // frame
  PX.rect(g, x, y, w, h, ROOM.door);
  PX.rect(g, x + 4, y + 5, w - 8, 32, ROOM.doorLt);        // panels
  PX.rect(g, x + 4, y + 43, w - 8, 32, ROOM.doorLt);
  PX.rect(g, x + 4, y + 5, w - 8, 1, ROOM.doorDk);
  PX.rect(g, x + 4, y + 43, w - 8, 1, ROOM.doorDk);
  PX.ell(g, x + w - 7, y + 44, 2, 2, '#FFDD8A');           // knob

  /* warm light spilling in when the door is open */
  if (st.doorOpen > 0) {
    const ow = Math.round(st.doorOpen * (w - 6));
    PX.rect(g, x + 2, y + 2, ow, h - 4, '#3B2B44');
    g.globalAlpha = 0.35 * st.doorOpen;
    PX.rect(g, x + 2, y + 2, ow, h - 4, '#FFD9A0');
    g.globalAlpha = 1;
  }
}

function drawPlant(g, x, y) {
  PX.rect(g, x - 8, y - 14, 16, 14, ROOM.pot);
  PX.rect(g, x - 9, y - 17, 18, 4, '#F5A0A0');
  PX.rect(g, x - 8, y - 12, 16, 1, '#D06E6E');
  for (const [dx, dy, r] of [[-6, -22, 6], [6, -21, 6], [0, -28, 7], [-3, -18, 5], [4, -27, 5]]) {
    PX.ell(g, x + dx, y + dy, r, r - 1, ROOM.leaf);
    PX.ell(g, x + dx - 1, y + dy - 1, r - 3, r - 3, '#98D89A');
  }
  PX.rect(g, x - 1, y - 24, 2, 10, ROOM.leafDk);
}

function drawSofa(g, x, y) {
  const w = 84;
  PX.rect(g, x - w / 2, y - 34, w, 24, ROOM.sofaDk);            // back
  PX.rect(g, x - w / 2 + 3, y - 31, w - 6, 18, ROOM.sofa);
  PX.rect(g, x - w / 2 + 3, y - 31, w - 6, 4, ROOM.sofaLt);
  PX.rect(g, x - w / 2, y - 12, w, 10, ROOM.sofa);              // seat
  PX.rect(g, x - w / 2, y - 12, w, 3, ROOM.sofaLt);
  PX.rect(g, x - w / 2 - 5, y - 20, 8, 18, ROOM.sofaDk);        // arms
  PX.rect(g, x + w / 2 - 3, y - 20, 8, 18, ROOM.sofaDk);
  PX.rect(g, x - w / 2 - 5, y - 20, 8, 3, ROOM.sofa);
  PX.rect(g, x + w / 2 - 3, y - 20, 8, 3, ROOM.sofa);
  PX.rect(g, x - w / 2 + 6, y - 2, 4, 4, ROOM.wood);            // legs
  PX.rect(g, x + w / 2 - 10, y - 2, 4, 4, ROOM.wood);
  /* cushions */
  PX.ell(g, x - 22, y - 20, 8, 7, '#FFD2E4'); PX.ell(g, x - 22, y - 22, 5, 3, '#FFE8F2');
  PX.ell(g, x + 22, y - 20, 8, 7, '#FFF0C2'); PX.ell(g, x + 22, y - 22, 5, 3, '#FFF8DE');
}

function drawWindow(g, st) {
  const x = 208, y = 18, w = 62, h = 50;
  PX.rect(g, x - 4, y - 4, w + 8, h + 8, '#FFF1E0');        // frame
  PX.rect(g, x - 4, y - 4, w + 8, 2, '#D9A98C');
  PX.rect(g, x, y, w, h, ROOM.sky);
  PX.rect(g, x, y, w, 16, '#3A3070');                        // sky gradient
  PX.rect(g, x, y, w, 7, '#4A3D86');

  for (const [sx, sy, s] of [[10, 8, 1], [24, 5, 1], [38, 12, 1], [52, 7, 1], [16, 20, 1], [46, 26, 1], [30, 33, 1], [8, 30, 1], [57, 18, 1]]) {
    const tw = (Math.sin(st.t * 2 + sx) * 0.5 + 0.5) > 0.35;
    if (tw) drawSparkle(g, x + sx, y + sy, s, ROOM.star);
  }
  PX.ell(g, x + 44, y + 14, 8, 8, ROOM.moon);                // moon
  PX.ell(g, x + 40, y + 11, 6, 6, ROOM.sky);
  PX.ell(g, x + 20, y + 42, 12, 4, '#3A3070');               // distant hills
  PX.ell(g, x + 46, y + 44, 14, 4, '#332A64');

  PX.rect(g, x + w / 2 - 1, y, 2, h, '#FFF1E0');             // mullions
  PX.rect(g, x, y + h / 2 - 1, w, 2, '#FFF1E0');

  /* curtains */
  for (const side of [-1, 1]) {
    const cx = side < 0 ? x - 4 : x + w - 10;
    PX.rect(g, cx, y - 6, 14, h + 8, '#FFB9D2');
    PX.rect(g, cx + (side < 0 ? 0 : 10), y - 6, 4, h + 8, '#FFD4E4');
    PX.rect(g, cx + 5, y - 6, 2, h + 8, '#F094B6');
  }
  PX.rect(g, x - 8, y - 8, w + 16, 3, '#C98A6A');            // rod
}

function drawTable(g, x, y, st) {
  PX.rect(g, x - 16, y - 20, 32, 4, ROOM.wood);              // top
  PX.rect(g, x - 16, y - 20, 32, 1, '#C08A5E');
  PX.rect(g, x - 13, y - 16, 3, 16, '#8E5F3C');             // legs
  PX.rect(g, x + 10, y - 16, 3, 16, '#8E5F3C');
  PX.rect(g, x - 13, y - 8, 26, 2, '#8E5F3C');

  /* lamp with a gentle flicker */
  const fl = Math.sin(st.t * 3.1) * 0.5 + Math.sin(st.t * 7.7) * 0.2;
  PX.rect(g, x - 2, y - 30, 4, 10, '#C7A88E');
  PX.poly(g, [[x - 11, y - 30], [x + 11, y - 30], [x + 7, y - 42], [x - 7, y - 42]], ROOM.lampDk);
  PX.poly(g, [[x - 9, y - 31], [x + 9, y - 31], [x + 6, y - 41], [x - 6, y - 41]], ROOM.lamp);
  PX.rect(g, x - 7, y - 34, 14, 2, '#FFF4D0');
  g.globalAlpha = 0.10 + fl * 0.03;
  PX.ell(g, x, y - 30, 34, 26, '#FFE9A8');
  g.globalAlpha = 0.07;
  PX.ell(g, x, y - 26, 48, 34, '#FFE9A8');
  g.globalAlpha = 1;
}

function drawClock(g, x, y, t) {
  PX.ell(g, x, y, 10, 10, '#C98A6A');
  PX.ell(g, x, y, 8, 8, '#FFF6E4');
  PX.ell(g, x, y, 7, 7, '#FFFDF4');
  for (const [dx, dy] of [[0, -5], [5, 0], [0, 5], [-5, 0]]) PX.rect(g, x + dx, y + dy, 1, 1, '#8E6B58');
  const a = t * 0.5;
  PX.rect(g, x, y - 4, 1, 4, '#5B4438');
  PX.rect(g, x, y, Math.round(Math.cos(a) * 3) || 1, 1, '#5B4438');
  PX.rect(g, x, y, 1, 1, '#D06E8E');
}

function drawPhoto(g, st) {
  const x = 182, y = 34;
  PX.rect(g, x - 13, y - 11, 26, 22, '#C98A6A');
  PX.rect(g, x - 11, y - 9, 22, 18, '#FFF6E4');
  /* two tiny heads + a heart between them */
  PX.ell(g, x - 5, y, 4, 4, PAL.purin.base);
  PX.ell(g, x - 5, y - 3, 3, 2, PAL.purin.lite);
  PX.rect(g, x - 7, y - 4, 5, 2, PAL.purin.beret);
  PX.ell(g, x + 5, y, 4, 4, PAL.kuromi.base);
  PX.ell(g, x + 5, y - 3, 4, 3, PAL.kuromi.hood);
  drawHeart(g, x, y - 5, 2, '#FF7FA8');
  if (st.photoGlow > 0) {
    g.globalAlpha = st.photoGlow * 0.5;
    PX.rect(g, x - 13, y - 11, 26, 22, '#FFFFFF');
    g.globalAlpha = 1;
  }
}

/* ── bunting: a drooping string of lettered flags ── */
const BUNT_TEXT = 'HAPPY BIRTHDAY';
const BUNT_COLS = ['#FF9EC4', '#FFD98A', '#A8E0F0', '#C7B0F0', '#A8E6A0'];

function drawBunting(g, st) {
  if (st.bannerY <= -60) return;
  const off = Math.round(st.bannerY);
  const n = BUNT_TEXT.length, span = 300, x0 = 10;
  const gap = span / (n - 1);

  /* string */
  for (let i = 0; i <= span; i++) {
    const p = i / span;
    const y = 8 + Math.sin(p * Math.PI) * 10 + off;
    PX.rect(g, x0 + i, y, 1, 1, '#8E6B58');
  }
  for (let i = 0; i < n; i++) {
    const p = i / (n - 1);
    const x = Math.round(x0 + p * span);
    const y = Math.round(8 + Math.sin(p * Math.PI) * 10 + off);
    const ch = BUNT_TEXT[i];
    if (ch === ' ') continue;
    const col = BUNT_COLS[i % BUNT_COLS.length];
    PX.poly(g, [[x - 8, y], [x + 8, y], [x, y + 15]], col);
    PX.poly(g, [[x - 8, y], [x + 8, y], [x, y + 4]], '#FFFFFF');
    g.globalAlpha = 0.25; PX.poly(g, [[x + 2, y], [x + 8, y], [x, y + 15]], '#000000'); g.globalAlpha = 1;
    mfText(g, x - 1, y + 3, ch, '#4A2A44', 1);
  }

  /* the name, in big pixel letters under the bunting */
  if (st.nameIn > 0) {
    const nm = ((window.CONFIG && CONFIG.NAME) || 'My Wife').toUpperCase();
    const s = bigWidth(nm, 2) <= 250 ? 2 : 1;
    const w = bigWidth(nm, s), nx = Math.round(160 - w / 2);
    const ny = Math.round(50 + off + (1 - st.nameIn) * -20);
    g.globalAlpha = Math.min(1, st.nameIn);
    /* 1px outline — a scaled offset would just smear the glyphs */
    for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, -1], [1, -1], [-1, 1], [2, 2]]) {
      bigText(g, nx + ox, ny + oy, nm, '#6E2F4E', s);
    }
    bigText(g, nx, ny, nm, '#FFFFFF', s);
    drawHeart(g, nx - 12, ny + 6, 3, '#FF7FA8');
    drawHeart(g, nx + w + 12, ny + 6, 3, '#FF7FA8');
    g.globalAlpha = 1;
  }
}

/* ── balloons drifting up in the finale ── */
function drawBalloon(g, x, y, col, t) {
  x = Math.round(x + Math.sin(t * 1.4 + y * 0.1) * 3); y = Math.round(y);
  PX.ell(g, x, y, 7, 9, col);
  PX.ell(g, x - 2, y - 3, 3, 4, '#FFFFFF');
  PX.poly(g, [[x - 2, y + 8], [x + 2, y + 8], [x, y + 12]], col);
  for (let i = 0; i < 14; i++) PX.rect(g, x + Math.round(Math.sin(i * 0.6 + t) * 2), y + 12 + i, 1, 1, '#EBD7E4');
}

/* ═══════════════ lighting mood ═══════════════
   Called AFTER the characters so the dim covers everyone. */

function applyMood(g, st) {
  if (st.dim > 0) {
    g.globalAlpha = st.dim * 0.72;
    PX.rect(g, 0, 0, 320, 180, '#1B1433');
    g.globalAlpha = 1;
  }
  /* warm pool of candlelight */
  if (st.glow > 0) {
    const fl = 1 + Math.sin(st.t * 8) * 0.03;
    g.globalCompositeOperation = 'lighter';
    for (const [r, a] of [[64, 0.10], [44, 0.12], [26, 0.14], [14, 0.16]]) {
      g.globalAlpha = a * st.glow;
      PX.ell(g, st.glowX, st.glowY, r * fl, r * 0.8 * fl, '#FFC96B');
    }
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
  }
  /* soft vignette keeps the eye in the middle */
  g.globalAlpha = 0.12;
  PX.rect(g, 0, 0, 320, 6, '#5B3F5A'); PX.rect(g, 0, 174, 320, 6, '#5B3F5A');
  PX.rect(g, 0, 0, 6, 180, '#5B3F5A'); PX.rect(g, 314, 0, 6, 180, '#5B3F5A');
  g.globalAlpha = 1;

  if (st.flash > 0) {
    g.globalAlpha = Math.min(1, st.flash);
    PX.rect(g, 0, 0, 320, 180, '#FFFFFF');
    g.globalAlpha = 1;
  }
  if (st.fade > 0) {
    g.globalAlpha = Math.min(1, st.fade);
    PX.rect(g, 0, 0, 320, 180, '#150F26');
    g.globalAlpha = 1;
  }
}
